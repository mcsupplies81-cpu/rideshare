import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: driver } = await (supabase as any).from('drivers').select('is_online').eq('id', user.id).single()
  if (!(driver as any)?.is_online) return NextResponse.json({ error: 'Driver offline' }, { status: 400 })

  const body = await req.json()
  const service = await createServiceClient() as any
  await service.from('driver_locations').upsert({
    driver_id: user.id,
    lat: body.lat,
    lng: body.lng,
    heading: body.heading ?? null,
    speed: body.speed ?? null,
    updated_at: new Date().toISOString(),
  })
  return NextResponse.json({ success: true })
}
