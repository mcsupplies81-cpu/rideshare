import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RiderNav } from './RiderNav'

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } : { data: any } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'rider') redirect('/login')

  return (
    <div className='min-h-screen bg-[#0F0F1A] pb-20 text-white'>
      {children}
      <RiderNav />
    </div>
  )
}
