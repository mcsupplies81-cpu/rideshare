import EarningsChart from '@/components/driver/EarningsChart'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function getUtcDayBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))
  return { start, end }
}

export default async function DriverEarningsPage() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id

  if (!userId) redirect('/login')

  const now = new Date()
  const { start: todayStart, end: todayEnd } = getUtcDayBounds(now)
  const weekStart = new Date(todayStart)
  weekStart.setUTCDate(todayStart.getUTCDate() - todayStart.getUTCDay())
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))

  const [todayRes, weekRes, monthRes, ridesRes, payoutsRes, planRes] = await Promise.all([
    serviceSupabase
      .from('rides')
      .select('final_fare')
      .eq('driver_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString())
      .lte('completed_at', todayEnd.toISOString()),
    serviceSupabase
      .from('rides')
      .select('final_fare')
      .eq('driver_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', weekStart.toISOString())
      .lte('completed_at', todayEnd.toISOString()),
    serviceSupabase
      .from('rides')
      .select('final_fare')
      .eq('driver_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', monthStart.toISOString())
      .lte('completed_at', todayEnd.toISOString()),
    serviceSupabase
      .from('rides')
      .select('id,pickup_address,dropoff_address,final_fare,completed_at')
      .eq('driver_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10),
    serviceSupabase
      .from('payouts')
      .select('id,net_amount,status,created_at')
      .eq('driver_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    serviceSupabase
      .from('driver_plans')
      .select('plan_type,is_active')
      .eq('driver_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .maybeSingle(),
  ])

  const dailyStart = new Date(todayStart)
  dailyStart.setUTCDate(todayStart.getUTCDate() - 29)
  const { data: last30Rides } = await (serviceSupabase as any)
    .from('rides')
    .select('completed_at,final_fare')
    .eq('driver_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', dailyStart.toISOString())
    .lte('completed_at', todayEnd.toISOString())

  const sumFares = (rows: any[] | null | undefined) =>
    (rows ?? []).reduce((sum, row) => sum + Number(row.final_fare ?? 0), 0)

  const todayEarnings = sumFares(todayRes.data)
  const weekEarnings = sumFares(weekRes.data)
  const monthEarnings = sumFares(monthRes.data)

  const byDay = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    const d = new Date(dailyStart)
    d.setUTCDate(dailyStart.getUTCDate() + i)
    byDay.set(d.toISOString().slice(0, 10), 0)
  }

  for (const ride of last30Rides ?? []) {
    const key = new Date(ride.completed_at).toISOString().slice(0, 10)
    byDay.set(key, (byDay.get(key) ?? 0) + Number(ride.final_fare ?? 0))
  }

  const chartData = Array.from(byDay.entries()).map(([date, amount]) => ({ date, amount }))

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-white">Earnings</h1>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Today Earnings', todayEarnings],
          ['Week Earnings', weekEarnings],
          ['Month Earnings', monthEarnings],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#2A2540] bg-[#121024] p-4">
            <p className="text-sm text-[#B2A6CC]">{label}</p>
            <p className="text-2xl font-semibold text-white">${Number(value).toFixed(2)}</p>
          </div>
        ))}
      </section>

      <EarningsChart data={chartData} />

      <section className="rounded-xl border border-[#2A2540] bg-[#121024] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Last 10 Completed Rides</h2>
          <p className="text-sm text-[#B2A6CC]">Plan: {planRes.data?.plan_type ?? 'per_ride'}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#B2A6CC]"><th>Pickup</th><th>Dropoff</th><th>Fare</th><th>Date</th></tr>
            </thead>
            <tbody>
              {(ridesRes.data ?? []).map((ride: any) => (
                <tr key={ride.id} className="border-t border-[#2A2540] text-white">
                  <td className="py-2 pr-3">{ride.pickup_address}</td>
                  <td className="py-2 pr-3">{ride.dropoff_address}</td>
                  <td className="py-2 pr-3">${Number(ride.final_fare ?? 0).toFixed(2)}</td>
                  <td className="py-2">{ride.completed_at ? new Date(ride.completed_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-[#2A2540] bg-[#121024] p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Payout History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#B2A6CC]"><th>Amount</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {(payoutsRes.data ?? []).map((payout: any) => (
                <tr key={payout.id} className="border-t border-[#2A2540] text-white">
                  <td className="py-2 pr-3">${Number(payout.net_amount ?? 0).toFixed(2)}</td>
                  <td className="py-2 pr-3 capitalize">{payout.status}</td>
                  <td className="py-2">{new Date(payout.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
