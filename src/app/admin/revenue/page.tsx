import { createServiceClient } from '@/lib/supabase/server'

export default async function Revenue({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const period = (await searchParams).period ?? 'month'
  const s = await createServiceClient() as any
  const since = period === 'week'
    ? new Date(Date.now() - 7 * 86400000).toISOString()
    : period === 'month'
    ? new Date(Date.now() - 30 * 86400000).toISOString()
    : null

  const [payments, payouts, subs] = await Promise.all([
    s.from('payments').select('amount,status,created_at'),
    s.from('payouts').select('platform_fee,net_amount,status,created_at'),
    s.from('subscriptions').select('status,plan_type'),
  ])

  const p = ((payments.data ?? []) as any[])
    .filter((x: any) => x.status === 'captured' && (!since || x.created_at >= since))
    .reduce((n: number, x: any) => n + x.amount, 0)

  const fees = ((payouts.data ?? []) as any[])
    .filter((x: any) => x.status !== 'failed' && (!since || x.created_at >= since))
    .reduce((n: number, x: any) => n + x.platform_fee, 0)

  const sent = ((payouts.data ?? []) as any[])
    .filter((x: any) => x.status === 'paid' && (!since || x.created_at >= since))
    .reduce((n: number, x: any) => n + x.net_amount, 0)

  const mrr = ((subs.data ?? []) as any[])
    .filter((x: any) => x.status === 'active' && x.plan_type === 'pro').length * 69

  return (
    <div className="grid gap-3 md:grid-cols-2 text-white p-6">
      <div className="bg-[#1A1A2E] rounded-xl p-4">Gross rider payments: ${p.toFixed(2)}</div>
      <div className="bg-[#1A1A2E] rounded-xl p-4">Per-ride fees collected: ${fees.toFixed(2)}</div>
      <div className="bg-[#1A1A2E] rounded-xl p-4">Subscription MRR: ${mrr}</div>
      <div className="bg-[#1A1A2E] rounded-xl p-4">Total payouts sent: ${sent.toFixed(2)}</div>
      <div className="bg-[#1A1A2E] rounded-xl p-4 md:col-span-2">Net platform revenue: ${(fees + mrr).toFixed(2)}</div>
    </div>
  )
}
