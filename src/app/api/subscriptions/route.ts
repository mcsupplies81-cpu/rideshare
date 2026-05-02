import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await serviceSupabase.from('users').select('role').eq('id', userId).single()
  if (user?.role !== 'driver') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: plan } = await serviceSupabase
    .from('driver_plans')
    .select('plan_type,is_active,stripe_subscription_id')
    .eq('driver_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: driver } = await serviceSupabase.from('drivers').select('trial_ends_at').eq('id', userId).single()

  return NextResponse.json({
    plan_type: plan?.plan_type ?? 'per_ride',
    trial_ends_at: driver?.trial_ends_at ?? null,
    is_active: plan?.is_active ?? false,
    stripe_subscription_id: plan?.stripe_subscription_id ?? null,
  })
}
