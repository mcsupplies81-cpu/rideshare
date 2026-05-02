import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const period = (url.searchParams.get('period') ?? 'today') as 'today' | 'week' | 'month'

  const startDate = new Date()
  if (period === 'today') startDate.setUTCHours(0, 0, 0, 0)
  if (period === 'week') startDate.setUTCDate(startDate.getUTCDate() - 7)
  if (period === 'month') startDate.setUTCMonth(startDate.getUTCMonth() - 1)

  const { data: payouts } = await serviceSupabase
    .from('payouts')
    .select('gross_amount,platform_fee,net_amount,status,ride_id,created_at,rides!inner(completed_at,pickup_address,dropoff_address,driver_id)')
    .gte('created_at', startDate.toISOString())
    .eq('rides.driver_id', userId)
    .order('created_at', { ascending: false })

  const rows = payouts ?? []
  const totalGross = rows.reduce((s, r) => s + r.gross_amount, 0)
  const totalFees = rows.reduce((s, r) => s + r.platform_fee, 0)
  const totalNet = rows.reduce((s, r) => s + r.net_amount, 0)

  const recentRides = rows.slice(0, 10).map((r) => ({
    ride_id: r.ride_id,
    completed_at: (r.rides as any).completed_at,
    pickup_address: (r.rides as any).pickup_address,
    dropoff_address: (r.rides as any).dropoff_address,
    gross_amount: r.gross_amount,
    platform_fee: r.platform_fee,
    net_amount: r.net_amount,
    status: r.status,
  }))

  return NextResponse.json({
    period,
    total_gross: Math.round(totalGross * 100) / 100,
    total_fees: Math.round(totalFees * 100) / 100,
    total_net: Math.round(totalNet * 100) / 100,
    ride_count: rows.length,
    recent_rides: recentRides,
  })
}
