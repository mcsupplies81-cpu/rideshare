import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error

  const supabase = (await createServiceClient()) as any
  const { data, error } = await supabase
    .from('regions')
    .select('id,name,is_active,created_at,city,state,center_lat,center_lng,radius_miles')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ regions: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error

  const contentType = req.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries())
  const supabase = (await createServiceClient()) as any

  const payload = {
    name: String(body?.name ?? '').trim(),
    city: String(body?.city ?? '').trim(),
    state: String(body?.state ?? '').trim(),
    center_lat: Number(body?.center_lat),
    center_lng: Number(body?.center_lng),
    radius_miles: Number(body?.radius_miles),
    is_active: body?.is_active ?? true,
  }

  if (!payload.name) return NextResponse.json({ error: 'Region name is required' }, { status: 400 })

  const { data, error } = await supabase.from('regions').insert(payload).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ region: data }, { status: 201 })
}
