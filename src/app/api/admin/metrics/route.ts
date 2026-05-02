import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error
  const supabase = await createServiceClient()

  const [{ count: totalRides }, { data: payments }, { count: driversOnline }, { count: newUsers }, { data: overTime }] = await Promise.all([
    supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('payments').select('amount').eq('status', 'captured'),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_online', true),
    supabase.from('users').select('*', { count: 'exact', head: true }).gt('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('rides').select('completed_at').gt('completed_at', new Date(Date.now() - 14 * 86400000).toISOString()).eq('status', 'completed'),
  ])

  const rides_over_time = Object.entries((overTime ?? []).reduce<Record<string, number>>((acc, r) => {
    if (!r.completed_at) return acc
    const day = r.completed_at.slice(0, 10)
    acc[day] = (acc[day] ?? 0) + 1
    return acc
  }, {})).map(([date, count]) => ({ date, count }))

  return NextResponse.json({ total_rides: totalRides ?? 0, total_revenue: (payments ?? []).reduce((s, p) => s + p.amount, 0), drivers_online: driversOnline ?? 0, new_users: newUsers ?? 0, rides_over_time })
}
