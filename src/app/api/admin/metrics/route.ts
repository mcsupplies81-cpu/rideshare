import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function GET(req: Request) {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error

  const supabase = (await createServiceClient()) as any
  const url = new URL(req.url)
  const days = Math.max(1, Number(url.searchParams.get('days') ?? '30') || 30)

  const [{ count: totalRides }, { data: payments }, { count: driversOnline }, { count: newUsers }, { data: overTime }, { count: activeSubs }, { data: paidPayouts }, { data: plans }] =
    await Promise.all([
      supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('payments').select('amount').eq('status', 'captured'),
      supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_online', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).gt('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('rides').select('completed_at').gt('completed_at', new Date(Date.now() - days * 86400000).toISOString()).eq('status', 'completed'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('payouts').select('amount').eq('status', 'paid'),
      supabase.from('driver_plans').select('plan_type'),
    ]) as any[]

  const rides_over_time = Object.entries(
    ((overTime ?? []) as any[]).reduce<Record<string, number>>((acc, r) => {
      if (!r.completed_at) return acc
      const day = r.completed_at.slice(0, 10)
      acc[day] = (acc[day] ?? 0) + 1
      return acc
    }, {})
  ).map(([date, count]) => ({ date, count }))

  const totalRevenue = ((payments ?? []) as any[]).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)
  const totalPayouts = ((paidPayouts ?? []) as any[]).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)
  const mrr = Number(activeSubs ?? 0) * 69

  const planBreakdown = ((plans ?? []) as any[]).reduce(
    (acc: { trial: number; perRide: number; pro: number }, plan: any) => {
      if (plan.plan_type === 'trial') acc.trial += 1
      if (plan.plan_type === 'per_ride') acc.perRide += 1
      if (plan.plan_type === 'pro') acc.pro += 1
      return acc
    },
    { trial: 0, perRide: 0, pro: 0 }
  )

  return NextResponse.json({
    total_rides: totalRides ?? 0,
    total_revenue: totalRevenue,
    drivers_online: driversOnline ?? 0,
    new_users: newUsers ?? 0,
    rides_over_time,
    mrr,
    totalPayouts,
    netRevenue: totalRevenue - totalPayouts,
    planBreakdown,
  })
}
