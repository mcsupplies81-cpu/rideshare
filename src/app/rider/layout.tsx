import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'rider') redirect('/login')

  return (
    <div className="min-h-screen bg-[#0F0F1A] pb-24 text-white">
      {children}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#2D2D44] bg-[#1A1A2E]/95 p-4">
        <div className="mx-auto flex max-w-md justify-between">
          <Link href="/rider" className="text-[#7B5EA7]">Home</Link>
          <Link href="/rider/history" className="text-gray-300">History</Link>
          <Link href="/rider/profile" className="text-gray-300">Profile</Link>
        </div>
      </nav>
    </div>
  )
}
