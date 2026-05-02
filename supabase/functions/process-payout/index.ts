import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@18.5.0?target=deno'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-03-31.basil' })

Deno.serve(async (request) => {
  const { ride_id } = await request.json()
  const { data: ride } = await supabase.from('rides').select('id,final_fare,driver_id').eq('id', ride_id).single()
  if (!ride) return new Response(JSON.stringify({ error: 'Ride not found' }), { status: 404 })

  const { data: driver } = await supabase
    .from('drivers')
    .select('stripe_connect_account_id,stripe_connect_onboarded')
    .eq('id', ride.driver_id)
    .single()

  if (!driver?.stripe_connect_onboarded || !driver.stripe_connect_account_id) {
    await supabase.from('payouts').insert({
      driver_id: ride.driver_id,
      ride_id,
      gross_amount: ride.final_fare ?? 0,
      platform_fee: 0,
      net_amount: ride.final_fare ?? 0,
      status: 'pending',
    })
    return new Response(JSON.stringify({ success: true, pending: true }))
  }

  const { data: plan } = await supabase
    .from('driver_plans')
    .select('plan_type,ends_at')
    .eq('driver_id', ride.driver_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date()
  const proActive = plan?.plan_type === 'pro' && (!!plan.ends_at && new Date(plan.ends_at) > now)
  const fee = plan?.plan_type === 'trial' || proActive ? 0 : 2.99
  const netAmount = (ride.final_fare ?? 0) - fee
  if (netAmount <= 0) return new Response(JSON.stringify({ success: true, skipped: true }))

  const transfer = await stripe.transfers.create({
    amount: Math.round(netAmount * 100),
    currency: 'usd',
    destination: driver.stripe_connect_account_id,
    transfer_group: ride_id,
    metadata: { ride_id, driver_id: ride.driver_id },
  })

  await supabase.from('payouts').insert({
    driver_id: ride.driver_id,
    ride_id,
    gross_amount: ride.final_fare ?? 0,
    platform_fee: fee,
    net_amount: netAmount,
    stripe_transfer_id: transfer.id,
    status: 'processing',
  })

  await supabase.from('ride_events').insert({ ride_id, event_type: 'payout_initiated', actor_id: ride.driver_id })

  return new Response(JSON.stringify({ success: true }))
})
