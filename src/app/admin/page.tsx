import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/admin/MetricCard'

export default async function AdminDashboardPage() {
  const supabase = await createServiceClient()
  const [{ count: totalRides }, { data: payments }, { count: driversOnline }, { count: newUsers }, { data: recentRides }] = await Promise.all([
    supabase.from('rides').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('payments').select('amount').eq('status', 'captured'),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_online', true),
    supabase.from('users').select('*', { count: 'exact', head: true }).gt('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('rides').select('id,pickup_address,dropoff_address,final_fare,status,completed_at,rider:users!rides_rider_id_fkey(full_name),driver:users!rides_driver_id_fkey(full_name)').eq('status','completed').order('completed_at', { ascending: false }).limit(10),
  ])

  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-4">
      <MetricCard label="Total Rides" value={totalRides ?? 0} />
      <MetricCard label="Total Revenue" value={`$${(payments ?? []).reduce((s,p)=>s+p.amount,0).toFixed(2)}`} />
      <MetricCard label="Drivers Online" value={driversOnline ?? 0} />
      <MetricCard label="New Users (7d)" value={newUsers ?? 0} />
    </div>
    <div className='rounded border border-slate-700 p-4'>Rides over time available at <Link href="/api/admin/metrics" className='text-purple-300'>metrics API</Link></div>
    <table className="w-full text-sm"><thead><tr><th>Time</th><th>Driver</th><th>Rider</th><th>Route</th><th>Fare</th><th>Status</th></tr></thead><tbody>{recentRides?.map((r:any)=><tr key={r.id} className='border-t border-slate-800'><td>{new Date(r.completed_at).toLocaleString()}</td><td>{r.driver?.full_name ?? '—'}</td><td>{r.rider?.full_name ?? '—'}</td><td>{r.pickup_address.slice(0,24)} → {r.dropoff_address.slice(0,24)}</td><td>${(r.final_fare ?? 0).toFixed(2)}</td><td>{r.status}</td></tr>)}</tbody></table>
  </div>
}
