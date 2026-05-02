import { err } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'

export async function withAuth(handler: (userId: string) => Promise<Response>): Promise<Response> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return err('Unauthorized', 401)
  return handler(user.id)
}

export async function withDriverAuth(handler: (userId: string) => Promise<Response>): Promise<Response> {
  return withAuth(async (userId) => {
    const supabase = (await createClient()) as any
    const { data } = await supabase.from('users').select('role').eq('id', userId).single()
    if (data?.role !== 'driver') return err('Forbidden', 403)
    return handler(userId)
  })
}

export async function withAdminAuth(handler: (userId: string) => Promise<Response>): Promise<Response> {
  return withAuth(async (userId) => {
    const supabase = (await createClient()) as any
    const { data } = await supabase.from('users').select('role').eq('id', userId).single()
    if (data?.role !== 'admin') return err('Forbidden', 403)
    return handler(userId)
  })
}
