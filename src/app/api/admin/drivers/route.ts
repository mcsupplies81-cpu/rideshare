import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

function csvCell(value: unknown) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
  return text
}

export async function GET(req: Request) {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  const page = Number(url.searchParams.get('page') ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 20)
  const format = url.searchParams.get('format')
  const from = (page - 1) * limit

  const supabase = (await createServiceClient()) as any

  let query = supabase
    .from('drivers')
    .select('id,city,approval_status,rating,created_at,user:users!drivers_id_fkey(full_name,phone),vehicle:vehicles(*),plan:driver_plans(plan_type,is_active),rides!rides_driver_id_fkey(id,status)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('approval_status', status)
  if (search) query = query.or(`id.ilike.%${search}%,user.full_name.ilike.%${search}%`)
  if (format !== 'csv') query = query.range(from, from + limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (format === 'csv') {
    const header = 'name,phone,city,approval_status,plan_type,rides_completed,rating,created_at'
    const rows = ((data ?? []) as any[]).map((driver) => {
      const activePlan = (driver.plan ?? []).find((plan: any) => plan.is_active)?.plan_type ?? ''
      const ridesCompleted = (driver.rides ?? []).filter((ride: any) => ride.status === 'completed').length
      return [
        csvCell(driver.user?.full_name ?? ''),
        csvCell(driver.user?.phone ?? ''),
        csvCell(driver.city ?? ''),
        csvCell(driver.approval_status ?? ''),
        csvCell(activePlan),
        csvCell(ridesCompleted),
        csvCell(driver.rating ?? ''),
        csvCell(driver.created_at ?? ''),
      ].join(',')
    })

    return new NextResponse([header, ...rows].join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="drivers.csv"',
      },
    })
  }

  return NextResponse.json({ data, page, limit, total: count ?? 0 })
}
