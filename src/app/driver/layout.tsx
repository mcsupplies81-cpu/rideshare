import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?role=driver')
  const { data: driver } = await supabase.from('drivers').select('approval_status').eq('id', user.id).single()
  if (driver?.approval_status !== 'approved' && driver?.approval_status !== 'pending') redirect('/driver/onboarding')
  return <div className="mx-auto max-w-md p-4 pb-24">{driver?.approval_status === 'pending' && <div className="mb-3 rounded bg-amber-100 p-3 text-sm">Your account is under review. We'll notify you within 24 hours.</div>}{children}<nav className="fixed bottom-0 left-0 right-0 border-t bg-white"><div className="mx-auto flex max-w-md justify-around p-3"><Link href="/driver">Home</Link><Link href="/driver/earnings">Earnings</Link><Link href="/driver/profile">Account</Link></div></nav></div>
}
