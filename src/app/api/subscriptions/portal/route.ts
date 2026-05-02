import { stripe } from '@/lib/stripe/client'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await serviceSupabase.from('users').select('email,full_name,role').eq('id', userId).single()
  if (user?.role !== 'driver') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: existingSub } = await (serviceSupabase as any).from('subscriptions').select('stripe_customer_id').eq('driver_id', userId).maybeSingle()
  let stripeCustomerId = existingSub?.stripe_customer_id

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name: user?.full_name ?? undefined,
      metadata: { driver_id: userId },
    })
    stripeCustomerId = customer.id
    await (serviceSupabase as any).from('subscriptions').upsert({ driver_id: userId, stripe_customer_id: stripeCustomerId, stripe_subscription_id: `pending_${userId}`, status: 'incomplete', plan_type: 'pro' }, { onConflict: 'driver_id' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/driver/subscription`,
  })

  return NextResponse.json({ url: session.url })
}
