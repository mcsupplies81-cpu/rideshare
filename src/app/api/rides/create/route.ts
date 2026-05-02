import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    pickup_address,
    pickup_lat,
    pickup_lng,
    dropoff_address,
    dropoff_lat,
    dropoff_lng,
    vehicle_type,
    estimated_fare,
    estimated_miles,
    estimated_minutes,
  } = body

  if (!pickup_address || !dropoff_address || !vehicle_type || !estimated_fare) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient()

  // Get or create Stripe customer for this user
  const { data: riderProfile } = await serviceSupabase
    .from('riders')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = riderProfile?.stripe_customer_id

  if (!customerId) {
    const { data: userRecord } = await serviceSupabase
      .from('users')
      .select('email, full_name, phone')
      .eq('id', user.id)
      .single()

    const customer = await stripe.customers.create({
      name: userRecord?.full_name ?? undefined,
      email: userRecord?.email ?? undefined,
      phone: userRecord?.phone ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await serviceSupabase
      .from('riders')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Create PaymentIntent with manual capture — funds held but not captured until trip complete
  const amountCents = Math.round(estimated_fare * 100)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    customer: customerId,
    capture_method: 'manual',
    metadata: { rider_id: user.id, vehicle_type },
  })

  // Insert ride record
  const { data: ride, error: rideError } = await serviceSupabase
    .from('rides')
    .insert({
      rider_id: user.id,
      pickup_address,
      pickup_lat,
      pickup_lng,
      dropoff_address,
      dropoff_lat,
      dropoff_lng,
      vehicle_type,
      estimated_fare,
      estimated_miles,
      estimated_minutes,
      status: 'payment_authorized',
    })
    .select()
    .single()

  if (rideError || !ride) {
    await stripe.paymentIntents.cancel(paymentIntent.id)
    return NextResponse.json({ error: 'Failed to create ride' }, { status: 500 })
  }

  // Insert payment record
  await serviceSupabase.from('payments').insert({
    ride_id: ride.id,
    rider_id: user.id,
    stripe_payment_intent_id: paymentIntent.id,
    amount: estimated_fare,
    status: 'authorized',
  })

  // Insert initial ride event
  await serviceSupabase.from('ride_events').insert({
    ride_id: ride.id,
    event_type: 'payment_authorized',
    metadata: { payment_intent_id: paymentIntent.id },
  })

  // Trigger dispatch asynchronously (fire-and-forget via Edge Function)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && serviceKey) {
    fetch(`${supabaseUrl}/functions/v1/dispatch-ride`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ ride_id: ride.id }),
    }).catch(() => {})
  }

  return NextResponse.json({
    ride_id: ride.id,
    client_secret: paymentIntent.client_secret,
  })
}
