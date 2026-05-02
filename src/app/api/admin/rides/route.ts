import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function GET(req: Request) {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const driverId = url.searchParams.get('driver_id')
  const fromDate = url.searchParams.get('from')
  const toDate = url.searchParams.get('to')
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const limit = Math.max(1, Number(url.searchParams.get('limit') ?? 25) || 25)
  const offset = (page - 1) * limit

  const supabase = (await createServiceClient()) as any
  let query = supabase
    .from('rides')
    .select('*,rider:users!rides_rider_id_fkey(full_name),driver:users!rides_driver_id_fkey(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (driverId) query = query.eq('driver_id', driverId)
  if (fromDate) query = query.gte('created_at', new Date(fromDate).toISOString())
  if (toDate) query = query.lte('created_at', new Date(`${toDate}T23:59:59.999Z`).toISOString())

  const { data, count, error } = await query.range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return NextResponse.json({ rides: data ?? [], total, page, totalPages })
}
