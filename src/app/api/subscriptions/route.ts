import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plan } = await serviceSupabase
    .from('driver_plans')
    .select('*')
    .eq('driver_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: driver } = await serviceSupabase.from('drivers').select('trial_ends_at').eq('id', userId).single()
  const trialEndsAt = driver?.trial_ends_at
  const remaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  let subscription = null
  if (plan?.plan_type === 'pro') {
    const { data } = await serviceSupabase
      .from('subscriptions')
      .select('*')
      .eq('driver_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    subscription = data
  }

  return NextResponse.json({
    current_plan: plan?.plan_type ?? 'per_ride',
    trial_ends_at: trialEndsAt,
    trial_days_remaining: remaining,
    subscription,
  })
}
