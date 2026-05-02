import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { sendEmail } from '@/lib/email/send'
import { driverAssigned } from '@/lib/email/templates'

export async function POST(_req: Request, { params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: ride } = await (supabase as any).from('rides').select('*').eq('id', rideId).single()
  if ((ride as any)?.status !== 'searching') return NextResponse.json({ error: 'Ride no longer available' }, { status: 409 })

  const { data: driver } = await (supabase as any).from('drivers').select('approval_status,is_online,stripe_connect_onboarded').eq('id', user.id).single()
  if ((driver as any)?.approval_status !== 'approved' || !(driver as any).is_online || !(driver as any).stripe_connect_onboarded) {
    return NextResponse.json({ error: 'driver_not_ready' }, { status: 403 })
  }

  const service = await createServiceClient() as any
  await service.from('rides').update({ status: 'accepted', driver_id: user.id, accepted_at: new Date().toISOString() }).eq('id', rideId).eq('status', 'searching')

  if ((ride as any).stripe_payment_intent_id) {
    await stripe.paymentIntents.capture((ride as any).stripe_payment_intent_id)
  }

  await service.from('ride_events').insert({ ride_id: rideId, event_type: 'driver_accepted', actor_id: user.id })

  const [{ data: riderUser }, { data: driverUser }, { data: vehicle }] = await Promise.all([
    service.from('users').select('email,full_name').eq('id', ride.rider_id).single(),
    service.from('users').select('full_name').eq('id', user.id).single(),
    service.from('vehicles').select('year,make,model,license_plate,color').eq('driver_id', user.id).maybeSingle(),
  ])
  if (riderUser?.email) {
    const tpl = driverAssigned({
      riderName: riderUser.full_name ?? 'there',
      driverName: driverUser?.full_name ?? 'Your driver',
      vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.color})` : 'Vehicle details unavailable',
      plate: vehicle?.license_plate ?? '—',
      rating: Number(driver?.rating ?? 5).toFixed(1),
    })
    void sendEmail({ to: riderUser.email, ...tpl })
  }

  return NextResponse.json({ success: true })
}
