import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function GET() {
  const a = await requireAdminApi()
  if (a.error) return a.error
  const s = await createServiceClient() as any
  const { data } = await s.from('fare_settings').select('region_id, surge_multiplier, effective_from').order('effective_from', { ascending: false })
  return NextResponse.json({ surge: data ?? [] })
}

export async function POST(request: Request) {
  const a = await requireAdminApi()
  if (a.error) return a.error
  const body = await request.json()
  const s = await createServiceClient() as any
  await s.from('fare_settings').upsert({ region_id: body.region_id, surge_multiplier: body.multiplier, effective_from: new Date().toISOString() }, { onConflict: 'region_id' })
  return NextResponse.json({ success: true })
}
