import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const isOnline = !!body.is_online

  const { data: driver } = await (supabase as any).from('drivers').select('approval_status').eq('id', user.id).single()
  if (isOnline && (driver as any)?.approval_status !== 'approved') {
    return NextResponse.json({ error: 'Driver not approved' }, { status: 403 })
  }

  const payload: Record<string, unknown> = { is_online: isOnline }
  if (isOnline) payload.last_online_at = new Date().toISOString()

  await (supabase as any).from('drivers').update(payload).eq('id', user.id)
  return NextResponse.json({ success: true, is_online: isOnline })
}
