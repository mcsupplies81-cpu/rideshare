import { stripe } from '@/lib/stripe/client'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { rideCompleted, payoutSent } from '@/lib/email/templates'


export async function POST(_: Request, { params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await params
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient() as any

  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ride, error: rideError } = await serviceSupabase
    .from('rides')
    .select('id,status,driver_id,pickup_lat,pickup_lng,dropoff_lat,dropoff_lng,vehicle_multiplier,stripe_payment_intent_id')
    .eq('id', rideId)
    .single()

  if (rideError || !ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
  if (ride.driver_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (ride.status !== 'in_trip') return NextResponse.json({ error: 'Ride must be in_trip' }, { status: 400 })
  if (!ride.stripe_payment_intent_id) return NextResponse.json({ error: 'Missing payment intent' }, { status: 400 })

  const directionsRes = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${ride.pickup_lat},${ride.pickup_lng}&destination=${ride.dropoff_lat},${ride.dropoff_lng}&key=${process.env.GOOGLE_MAPS_SERVER_KEY}`
  )
  const directions = await directionsRes.json()
  const meters = directions?.routes?.[0]?.legs?.[0]?.distance?.value
  if (!meters) return NextResponse.json({ error: 'Could not fetch actual distance' }, { status: 500 })
  const actualMiles = meters / 1609.344

  await serviceSupabase.from('fare_settings').select('id').order('effective_from', { ascending: false }).limit(1)

  const vehicleMultiplier = ride.vehicle_multiplier ?? 1
  const finalFare = Math.round(Math.max(5, (2 + 0.9 * actualMiles) * vehicleMultiplier) * 100) / 100

  const { error: updateError } = await serviceSupabase
    .from('rides')
    .update({ status: 'completed', completed_at: new Date().toISOString(), actual_miles: actualMiles, final_fare: finalFare })
    .eq('id', rideId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await stripe.paymentIntents.capture(ride.stripe_payment_intent_id, {
    amount_to_capture: Math.round(finalFare * 100),
  })

  await serviceSupabase.from('ride_events').insert({
    ride_id: rideId,
    event_type: 'trip_completed',
    actor_id: userId,
    metadata: { final_fare: finalFare, actual_miles: actualMiles },
  })

  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-payout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ride_id: rideId }),
  }).catch(() => undefined)

  const fullRide = await serviceSupabase.from('rides').select('rider_id,driver_id,pickup_address,dropoff_address').eq('id', rideId).single()
  const [{ data: riderUser }, { data: driverUser }] = await Promise.all([
    serviceSupabase.from('users').select('email,full_name').eq('id', fullRide.data?.rider_id).single(),
    serviceSupabase.from('users').select('email,full_name').eq('id', userId).single(),
  ])
  if (riderUser?.email) {
    const tpl = rideCompleted({ riderName: riderUser.full_name ?? 'there', pickup: fullRide.data?.pickup_address ?? '', dropoff: fullRide.data?.dropoff_address ?? '', fare: `$${finalFare.toFixed(2)}`, distance: `${actualMiles.toFixed(1)} mi` })
    void sendEmail({ to: riderUser.email, ...tpl })
  }
  if (driverUser?.email) {
    const tpl = payoutSent({ driverName: driverUser.full_name ?? 'there', amount: `$${(finalFare * 0.85).toFixed(2)}`, periodRides: 1 })
    void sendEmail({ to: driverUser.email, ...tpl })
  }

  return NextResponse.json({ success: true, final_fare: finalFare, ride_id: rideId })
}
