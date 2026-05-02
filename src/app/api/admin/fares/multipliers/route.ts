import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function POST(req: Request) {
  const a = await requireAdminApi()
  if (a.error) return a.error

  const b = await req.json()
  const s = await createServiceClient() as any
  await s.from('vehicle_pricing').update({ multiplier: b.multiplier }).eq('vehicle_type', b.vehicle_type)
  return NextResponse.json({ success: true })
}
