import { stripe } from '@/lib/stripe/client'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'


export async function POST() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rider } = await serviceSupabase.from('riders').select('stripe_customer_id').eq('id', userId).single()
  if (!rider?.stripe_customer_id) return NextResponse.json({ error: 'Missing Stripe customer' }, { status: 400 })

  const session = await stripe.billingPortal.sessions.create({
    customer: rider.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/driver/subscription`,
  })

  return NextResponse.json({ portal_url: session.url })
}
