import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  await (supabase as any).from('driver_documents').insert({
    driver_id: user.id,
    document_type: body.document_type,
    storage_path: body.storage_path,
    status: 'pending',
  })
  return NextResponse.json({ success: true })
}
