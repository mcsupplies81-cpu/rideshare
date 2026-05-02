import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RiderNav } from './RiderNav'

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className='min-h-screen bg-[#0F0F1A] pb-20 text-white'>
      <div>{children}</div>
      <RiderNav />
    </div>
  )
}
