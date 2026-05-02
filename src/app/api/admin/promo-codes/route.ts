import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin'

export async function GET() {
  const a = await requireAdminApi()
  if (a.error) return a.error
  const supabase = await createServiceClient() as any
  const { data, error } = await (supabase as any).from('promo_codes').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ promo_codes: data ?? [] })
}

export async function POST(request: Request) {
  const a = await requireAdminApi()
  if (a.error) return a.error
  const body = await request.json()
  const supabase = await createServiceClient() as any
  const { data, error } = await (supabase as any).from('promo_codes').insert({
    code: body.code,
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    max_uses: body.max_uses || null,
    expires_at: body.expires_at || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ promo_code: data })
}
