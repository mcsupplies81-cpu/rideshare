import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'payment_intent.amount_capturable_updated': {
      // PaymentIntent is authorized — ride is ready to dispatch
      const pi = event.data.object as Stripe.PaymentIntent
      const riderId = pi.metadata.rider_id
      if (!riderId) break

      // Find the ride associated with this payment intent
      const { data: payment } = await supabase
        .from('payments')
        .select('ride_id')
        .eq('stripe_payment_intent_id', pi.id)
        .single()

      if (payment?.ride_id) {
        // Ensure status is payment_authorized before dispatching
        await supabase
          .from('rides')
          .update({ status: 'searching' })
          .eq('id', payment.ride_id)
          .eq('status', 'payment_authorized')

        await supabase.from('ride_events').insert({
          ride_id: payment.ride_id,
          event_type: 'searching_started',
          metadata: { payment_intent_id: pi.id },
        })
      }
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('payments')
        .update({ status: 'captured' })
        .eq('stripe_payment_intent_id', pi.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const { data: payment } = await supabase
        .from('payments')
        .select('ride_id')
        .eq('stripe_payment_intent_id', pi.id)
        .single()

      if (payment?.ride_id) {
        await supabase
          .from('rides')
          .update({ status: 'payment_failed' })
          .eq('id', payment.ride_id)

        await supabase.from('payments').update({ status: 'failed' }).eq('stripe_payment_intent_id', pi.id)
      }
      break
    }

    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('payments')
        .update({ status: 'voided' })
        .eq('stripe_payment_intent_id', pi.id)
      break
    }

    // Subscription events (expanded in Sprint 4)
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const driverId = sub.metadata.driver_id
      if (!driverId) break

      const isActive = sub.status === 'active' || sub.status === 'trialing'
      await supabase.from('subscriptions').upsert({
        driver_id: driverId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'stripe_subscription_id' })

      if (isActive) {
        await supabase
          .from('driver_plans')
          .update({ plan_type: 'pro' })
          .eq('driver_id', driverId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const driverId = sub.metadata.driver_id
      if (!driverId) break

      await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', sub.id)
      await supabase.from('driver_plans').update({ plan_type: 'per_ride' }).eq('driver_id', driverId)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
