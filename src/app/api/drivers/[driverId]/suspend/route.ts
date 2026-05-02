import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function POST(_: Request, { params }: { params: Promise<{ driverId: string }> }) {
  const auth = await requireAdminApi()
  if (auth.error) return auth.error

  const { driverId } = await params
  const supabase = await createServiceClient() as any
  await supabase.from('drivers').update({ approval_status: 'suspended', is_online: false }).eq('id', driverId)
  return NextResponse.json({ success: true })
}
