import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()
  if (user?.role !== 'driver') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const code = (body?.code ?? '').trim()
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('id,driver_id,users!referral_codes_driver_id_fkey(full_name)')
    .eq('code', code)
    .maybeSingle()

  if (!refCode) return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
  if (refCode.driver_id === userId) return NextResponse.json({ error: 'Cannot apply your own code' }, { status: 400 })

  const { error } = await supabase.from('referral_events').insert({ referral_code_id: refCode.id, referred_driver_id: userId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const referrerName = (refCode.users as any)?.full_name ?? 'a driver'
  return NextResponse.json({ referrer_name: referrerName })
}
