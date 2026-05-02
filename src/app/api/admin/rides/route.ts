import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function GET(req: Request) {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error
  const u = new URL(req.url)
  const status = u.searchParams.get('status')
  const driverId = u.searchParams.get('driver_id')
  const fromDate = u.searchParams.get('from')
  const toDate = u.searchParams.get('to')
  const page = Math.max(1, Number(u.searchParams.get('page') ?? 1))
  const limit = Math.max(1, Number(u.searchParams.get('limit') ?? 25))
  const start = (page - 1) * limit

  const s = (await createServiceClient()) as any
  let q = s.from('rides').select('*,rider:users!rides_rider_id_fkey(full_name),driver:users!rides_driver_id_fkey(full_name)', { count: 'exact' }).order('created_at', { ascending: false })
  if (status && status !== 'all') q = q.eq('status', status)
  if (driverId) q = q.eq('driver_id', driverId)
  if (fromDate) q = q.gte('created_at', `${fromDate}T00:00:00.000Z`)
  if (toDate) q = q.lte('created_at', `${toDate}T23:59:59.999Z`)
  const { data: rides, count, error } = await q.range(start, start + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const total = count ?? 0
  return NextResponse.json({ rides: rides ?? [], total, page, totalPages: Math.max(1, Math.ceil(total / limit)) })
}
