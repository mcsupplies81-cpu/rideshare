import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths — no auth required
  const publicPaths = ['/', '/login', '/signup', '/api/webhooks', '/api/auth']
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    if (pathname.startsWith('/driver')) loginUrl.searchParams.set('role', 'driver')
    if (pathname.startsWith('/admin')) loginUrl.searchParams.set('role', 'admin')
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    // Fetch role from public.users
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (pathname.startsWith('/rider') && role !== 'rider') {
      return NextResponse.redirect(new URL(`/${role ?? ''}`, request.url))
    }
    if (pathname.startsWith('/driver') && role !== 'driver') {
      return NextResponse.redirect(new URL(`/${role ?? ''}`, request.url))
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}
