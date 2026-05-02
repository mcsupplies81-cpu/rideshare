import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function makeReferralCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function requireDriver(serviceSupabase: any) {
  const { data: auth } = await serviceSupabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: user } = await serviceSupabase.from('users').select('role').eq('id', userId).single()
  if (user?.role !== 'driver') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  return { userId }
}

export async function GET() {
  const supabase = await createServiceClient() as any
  const auth = await requireDriver(supabase)
  if ('error' in auth) return auth.error

  let { data: codeRow } = await supabase.from('referral_codes').select('id,code,uses').eq('driver_id', auth.userId).maybeSingle()

  if (!codeRow) {
    for (let i = 0; i < 5; i++) {
      const code = makeReferralCode(8)
      const { data, error } = await supabase.from('referral_codes').insert({ driver_id: auth.userId, code }).select('id,code,uses').single()
      if (!error) {
        codeRow = data
        break
      }
    }
  }

  if (!codeRow) return NextResponse.json({ error: 'Unable to create referral code' }, { status: 500 })

  return NextResponse.json({ code: codeRow.code, uses: codeRow.uses ?? 0 })
}

export async function POST(request: Request) {
  const supabase = await createServiceClient() as any
  const auth = await requireDriver(supabase)
  if ('error' in auth) return auth.error

  const body = await request.json()
  const code = (body?.code ?? '').trim()
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  const { data: refCode } = await supabase.from('referral_codes').select('id,driver_id').eq('code', code).maybeSingle()
  if (!refCode) return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
  if (refCode.driver_id === auth.userId) return NextResponse.json({ error: 'Cannot apply your own code' }, { status: 400 })

  const { error } = await supabase.from('referral_events').insert({ referral_code_id: refCode.id, referred_driver_id: auth.userId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: currentCode } = await supabase.from('referral_codes').select('uses').eq('id', refCode.id).single()
  await supabase.from('referral_codes').update({ uses: (currentCode?.uses ?? 0) + 1 }).eq('id', refCode.id)
  return NextResponse.json({ success: true })
}
