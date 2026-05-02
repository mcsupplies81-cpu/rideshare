import { stripe } from '@/lib/stripe/client'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'


export async function POST(request: Request) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  if (event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = String(sub.customer)
    const { data: rider } = await supabase.from('riders').select('id').eq('stripe_customer_id', customerId).maybeSingle()
    const driverId = rider?.id
    if (driverId) {
      await supabase.from('subscriptions').upsert({
        driver_id: driverId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: customerId,
        status: sub.status,
        plan_type: 'pro',
        current_period_start: new Date(sub.items.data[0]?.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.items.data[0]?.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      })
      await supabase.from('driver_plans').update({ is_active: false }).eq('driver_id', driverId)
      await supabase.from('driver_plans').insert({
        driver_id: driverId,
        plan_type: 'pro',
        stripe_subscription_id: sub.id,
        stripe_subscription_status: sub.status,
        ends_at: new Date(sub.items.data[0]?.current_period_end * 1000).toISOString(),
      })
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    await supabase
      .from('subscriptions')
      .update({
        status: sub.status,
        current_period_start: new Date(sub.items.data[0]?.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.items.data[0]?.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const { data: row } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', sub.id)
      .select('driver_id')
      .single()
    if (row) {
      await supabase.from('driver_plans').update({ is_active: false }).eq('driver_id', row.driver_id).eq('plan_type', 'pro')
      await supabase.from('driver_plans').insert({ driver_id: row.driver_id, plan_type: 'per_ride' })
    }
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    if (account.details_submitted && account.charges_enabled) {
      await supabase
        .from('drivers')
        .update({ stripe_connect_onboarded: true })
        .eq('stripe_connect_account_id', account.id)
    }
  }

  if (event.type === 'transfer.created') {
    const transfer = event.data.object as Stripe.Transfer
    await supabase.from('payouts').upsert({
      driver_id: String(transfer.metadata.driver_id ?? ''),
      ride_id: transfer.metadata.ride_id ?? null,
      gross_amount: 0,
      platform_fee: 0,
      net_amount: transfer.amount / 100,
      stripe_transfer_id: transfer.id,
      status: 'processing',
    })
  }
  if (event.type === 'transfer.paid') {
    const transfer = event.data.object as Stripe.Transfer
    await supabase.from('payouts').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('stripe_transfer_id', transfer.id)
  }
  if (event.type === 'transfer.failed') {
    const transfer = event.data.object as Stripe.Transfer
    await supabase.from('payouts').update({ status: 'failed' }).eq('stripe_transfer_id', transfer.id)
  }

  return NextResponse.json({ received: true })
}
