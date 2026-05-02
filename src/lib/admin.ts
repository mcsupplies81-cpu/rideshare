import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function requireAdminApi() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: profile } = await (supabase as any).from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase, user }
}
