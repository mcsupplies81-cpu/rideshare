import { RevenueChart } from '@/components/admin/RevenueChart'
import { createServiceClient } from '@/lib/supabase/server'

function currency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function RevenuePage() {
  const supabase = (await createServiceClient()) as any
  const since = new Date(Date.now() - 30 * 86400000).toISOString()

  const [paymentsRes, totalRevenueRes, subscriptionsRes, payoutsRes, planBreakdownRes, recentPayoutsRes] = await Promise.all([
    supabase.from('payments').select('amount,created_at').eq('status', 'captured').gte('created_at', since),
    supabase.from('payments').select('amount').eq('status', 'captured'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payouts').select('amount,status,created_at').eq('status', 'paid'),
    supabase.from('driver_plans').select('plan_type'),
    supabase
      .from('payouts')
      .select('amount,status,created_at,driver:drivers!payouts_driver_id_fkey(user:users!drivers_id_fkey(full_name))')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const payments = (paymentsRes.data ?? []) as Array<{ amount: number; created_at: string }>
  const payouts = (payoutsRes.data ?? []) as Array<{ amount: number; status: string; created_at: string }>
  const totalRevenue = ((totalRevenueRes.data ?? []) as Array<{ amount: number }>).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const totalPayouts = payouts.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const mrr = Number(subscriptionsRes.count ?? 0) * 69

  const dayMap = new Map<string, { revenue: number; payouts: number }>()
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    dayMap.set(d, { revenue: 0, payouts: 0 })
  }

  payments.forEach((payment) => {
    const day = payment.created_at.slice(0, 10)
    if (!dayMap.has(day)) return
    const entry = dayMap.get(day)!
    entry.revenue += Number(payment.amount ?? 0)
  })

  payouts.forEach((payout) => {
    const day = payout.created_at.slice(0, 10)
    if (!dayMap.has(day)) return
    const entry = dayMap.get(day)!
    entry.payouts += Number(payout.amount ?? 0)
  })

  const dailyData = Array.from(dayMap.entries()).map(([date, vals]) => ({ date, ...vals }))

  const planBreakdown = ((planBreakdownRes.data ?? []) as Array<{ plan_type: string }>).reduce(
    (acc, row) => {
      if (row.plan_type === 'trial') acc.trial += 1
      if (row.plan_type === 'per_ride') acc.per_ride += 1
      if (row.plan_type === 'pro') acc.pro += 1
      return acc
    },
    { trial: 0, per_ride: 0, pro: 0 }
  )

  const recentPayouts = (recentPayoutsRes.data ?? []) as any[]

  return (
    <div className="space-y-6 p-6 text-white">
      <h1 className="text-2xl font-bold">Revenue</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-[#1A1A2E] p-4">Total Revenue: {currency(totalRevenue)}</div>
        <div className="rounded-xl bg-[#1A1A2E] p-4">MRR: {currency(mrr)}</div>
        <div className="rounded-xl bg-[#1A1A2E] p-4">Total Paid Out: {currency(totalPayouts)}</div>
        <div className="rounded-xl bg-[#1A1A2E] p-4">Net Revenue: {currency(totalRevenue - totalPayouts)}</div>
      </div>

      <RevenueChart data={dailyData} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-[#1A1A2E] p-4">Trial: {planBreakdown.trial}</div>
        <div className="rounded-xl bg-[#1A1A2E] p-4">Per Ride: {planBreakdown.per_ride}</div>
        <div className="rounded-xl bg-[#1A1A2E] p-4">Pro: {planBreakdown.pro}</div>
      </div>

      <div className="rounded-xl bg-[#1A1A2E] p-4">
        <h2 className="mb-3 text-lg font-semibold">Recent Payouts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-2">Driver</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentPayouts.map((row) => (
                <tr key={`${row.created_at}-${row.amount}`} className="border-t border-slate-800">
                  <td className="py-2">{row.driver?.user?.full_name ?? 'Unknown'}</td>
                  <td>{currency(Number(row.amount ?? 0))}</td>
                  <td>{row.status}</td>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
