import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ rideId: string }> }
) {
  const { rideId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceSupabase = await createServiceClient() as any
  const { data: ride } = await serviceSupabase
    .from('rides')
    .select('id, rider_id, status')
    .eq('id', rideId)
    .single()

  if (!ride) {
    return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
  }

  if (ride.rider_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cancellableStatuses = ['payment_authorized', 'searching']
  if (!cancellableStatuses.includes(ride.status)) {
    return NextResponse.json({ error: 'Ride cannot be cancelled at this stage' }, { status: 409 })
  }

  const { data: payment } = await serviceSupabase
    .from('payments')
    .select('stripe_payment_intent_id')
    .eq('ride_id', ride.id)
    .single()

  if (payment?.stripe_payment_intent_id) {
    try {
      await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
    } catch {
      // Already cancelled or captured — ignore
    }
  }

  await serviceSupabase
    .from('rides')
    .update({ status: 'cancelled_by_rider', cancelled_at: new Date().toISOString() })
    .eq('id', ride.id)

  await serviceSupabase.from('ride_events').insert({
    ride_id: ride.id,
    event_type: 'cancelled_by_rider',
  })

  return NextResponse.json({ success: true })
}
