import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { sendEmail } from '@/lib/email/send'
import { rideConfirmed } from '@/lib/email/templates'

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
    promoCode,
  } = body

  if (!pickup_address || !dropoff_address || !vehicle_type || !estimated_fare) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const serviceSupabase = await createServiceClient() as any

  let finalFare = Number(estimated_fare)
  let promoRow: any = null
  if (promoCode) {
    const now = new Date().toISOString()
    const { data } = await (serviceSupabase as any)
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle()

    if (!data || (data.max_uses !== null && data.uses >= data.max_uses)) {
      return NextResponse.json({ error: 'Promo code invalid or expired' }, { status: 400 })
    }

    promoRow = data
    const discountAmount = promoRow.discount_type === 'percent' ? finalFare * (Number(promoRow.discount_value) / 100) : Number(promoRow.discount_value)
    finalFare = Math.max(5, Math.round((finalFare - discountAmount) * 100) / 100)
  }

  const { data: riderProfile } = await serviceSupabase.from('riders').select('stripe_customer_id').eq('id', user.id).single()
  let customerId = riderProfile?.stripe_customer_id
  if (!customerId) {
    const { data: userRecord } = await serviceSupabase.from('users').select('email, full_name, phone').eq('id', user.id).single()
    const customer = await stripe.customers.create({
      name: userRecord?.full_name ?? undefined,
      email: userRecord?.email ?? undefined,
      phone: userRecord?.phone ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await serviceSupabase.from('riders').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const amountCents = Math.round(finalFare * 100)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    customer: customerId,
    capture_method: 'manual',
    metadata: { rider_id: user.id, vehicle_type, promo_code: promoCode ?? '' },
  })

  if (promoRow) {
    await (serviceSupabase as any).from('promo_codes').update({ uses: promoRow.uses + 1 }).eq('id', promoRow.id)
  }

  const { data: ride, error: rideError } = await serviceSupabase.from('rides').insert({
    rider_id: user.id,
    pickup_address,
    pickup_lat,
    pickup_lng,
    dropoff_address,
    dropoff_lat,
    dropoff_lng,
    vehicle_type,
    estimated_fare: finalFare,
    estimated_miles,
    estimated_minutes,
    status: 'payment_authorized',
  }).select().single()

  if (rideError || !ride) {
    await stripe.paymentIntents.cancel(paymentIntent.id)
    return NextResponse.json({ error: 'Failed to create ride' }, { status: 500 })
  }

  await serviceSupabase.from('payments').insert({ ride_id: ride.id, rider_id: user.id, stripe_payment_intent_id: paymentIntent.id, amount: finalFare, status: 'authorized' })
  await serviceSupabase.from('ride_events').insert({ ride_id: ride.id, event_type: 'payment_authorized', metadata: { payment_intent_id: paymentIntent.id } })

  const { data: userRecord } = await serviceSupabase.from('users').select('email,full_name').eq('id', user.id).single()
  if (userRecord?.email) {
    const tpl = rideConfirmed({ riderName: userRecord.full_name ?? 'there', pickup: pickup_address, dropoff: dropoff_address, fare: `$${finalFare.toFixed(2)}`, vehicleType: vehicle_type })
    void sendEmail({ to: userRecord.email, ...tpl })
  }

  return NextResponse.json({ ride_id: ride.id, client_secret: paymentIntent.client_secret })
}
