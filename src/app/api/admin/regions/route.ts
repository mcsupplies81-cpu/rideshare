import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error
  const supabase = (await createServiceClient()) as any
  const { data, error } = await supabase.from('regions').select('id,name,city,state,bounds,is_active,created_at').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ regions: data ?? [] })
}

export async function POST(req: Request) {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error
  const body = await req.json()
  const name = String(body.name ?? '').trim()
  const city = String(body.city ?? '').trim()
  const state = String(body.state ?? '').trim()
  const center_lat = Number(body.center_lat)
  const center_lng = Number(body.center_lng)
  const radius_miles = Number(body.radius_miles)
  if (!name || !city || !state || Number.isNaN(center_lat) || Number.isNaN(center_lng) || Number.isNaN(radius_miles)) return NextResponse.json({ error: 'Invalid region payload' }, { status: 400 })

  const supabase = (await createServiceClient()) as any
  const { data, error } = await supabase.from('regions').insert({ name, city, state, bounds: { center_lat, center_lng, radius_miles }, is_active: true }).select('id,name,city,state,bounds,is_active,created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ region: data }, { status: 201 })
}
