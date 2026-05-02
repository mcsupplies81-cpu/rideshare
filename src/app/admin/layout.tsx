import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const topItems = [
  ['Overview', '/admin'],
  ['Drivers', '/admin/drivers'],
  ['Rides', '/admin/rides'],
  ['Revenue', '/admin/revenue'],
]

const settingItems = [
  ['Fares', '/admin/settings/fares'],
  ['Promo Codes', '/admin/settings/promo-codes'],
  ['Surge', '/admin/settings/fares#surge'],
  ['Regions', '/admin/settings/regions'],
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?role=admin')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  return <div className="md:grid md:grid-cols-[240px_1fr] min-h-screen bg-slate-950 text-white">
    <aside className="hidden md:block sticky top-0 h-screen bg-[#1A1A2E] p-4">
      <h2 className="mb-6 text-xl font-bold">Moove Admin</h2>
      <nav className="space-y-4">
        <div className='space-y-2'>{topItems.map(([label, href]) => <Link key={href} href={href} className="block rounded-l border-l-4 border-purple-500 px-3 py-2 hover:bg-purple-900/30">{label}</Link>)}</div>
        <div>
          <p className='px-3 text-xs uppercase tracking-wide text-slate-400'>Settings</p>
          <div className='mt-2 space-y-2'>{settingItems.map(([label, href]) => <Link key={href} href={href} className="block rounded-l border-l-4 border-slate-700 px-3 py-2 hover:bg-purple-900/30">{label}</Link>)}</div>
        </div>
      </nav>
      <form action="/auth/signout" method="post" className="mt-6"><button className="text-sm text-red-300">Log Out</button></form>
    </aside>
    <main><div className="p-4">{children}</div></main>
  </div>
}
