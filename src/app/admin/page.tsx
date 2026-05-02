import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/admin/MetricCard'
import { RideActivityFeed } from '@/components/admin/RideActivityFeed'

export default async function AdminDashboardPage() {
  const supabase = await createServiceClient() as any
  const startOfToday = new Date(); startOfToday.setUTCHours(0,0,0,0)
  const [{ count: totalRides }, { data: payments }, { count: driversOnline }, { count: newUsers }, { data: initialRides }, { count: pendingApprovals }, { data: todayPayments }] = await Promise.all([
    supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('payments').select('amount').eq('status', 'captured'),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_online', true),
    supabase.from('users').select('*', { count: 'exact', head: true }).gt('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('rides').select('id,pickup_address,dropoff_address,final_fare,estimated_fare,status,created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('payments').select('amount').eq('status', 'captured').gte('created_at', startOfToday.toISOString()),
  ])

  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard label="Total Rides" value={totalRides ?? 0} />
      <MetricCard label="Total Revenue" value={`$${((payments ?? []) as any[]).reduce((s: number, p: any) => s + (p.amount ?? 0), 0).toFixed(2)}`} />
      <MetricCard label="Revenue Today" value={`$${((todayPayments ?? []) as any[]).reduce((s: number, p: any) => s + (p.amount ?? 0), 0).toFixed(2)}`} />
      <MetricCard label="Drivers Online" value={driversOnline ?? 0} />
      <MetricCard label="New Users (7d)" value={newUsers ?? 0} />
      <MetricCard label="Pending Approvals" value={pendingApprovals ?? 0} subtitle={pendingApprovals > 0 ? 'Needs review' : undefined} />
    </div>
    {pendingApprovals > 0 && <Link href="/admin/drivers?status=pending" className="text-purple-300">Review Drivers →</Link>}
    <div className="rounded border border-slate-700 p-4">Rides over time available at <Link href="/api/admin/metrics" className="text-purple-300">metrics API</Link></div>
    <RideActivityFeed initialRides={initialRides ?? []} />
  </div>
}
