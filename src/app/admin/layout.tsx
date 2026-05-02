import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const items = [
  ['Dashboard', '/admin'],
  ['Rides', '/admin/rides'],
  ['Drivers', '/admin/drivers'],
  ['Revenue', '/admin/revenue'],
  ['Settings', '/admin/settings/fares'],
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?role=admin')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null }
  if (profile?.role !== 'admin') redirect('/')

  return <div className="md:grid md:grid-cols-[240px_1fr] min-h-screen bg-slate-950 text-white">
    <aside className="hidden md:block sticky top-0 h-screen bg-[#1A1A2E] p-4">
      <h2 className="mb-6 text-xl font-bold">Rideo Admin</h2>
      <nav className="space-y-2">{items.map(([label, href]) => <Link key={href} href={href} className="block rounded-l border-l-4 border-purple-500 px-3 py-2 hover:bg-purple-900/30">{label}</Link>)}</nav>
      <form action="/auth/signout" method="post" className="mt-6"><button className="text-sm text-red-300">Log Out</button></form>
    </aside>
    <main>
      <div className="md:hidden flex gap-2 overflow-auto bg-[#1A1A2E] p-2">{items.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded border border-purple-700 px-3 py-1">{label}</Link>)}<span className="px-2 py-1 text-red-300">Log Out</span></div>
      <div className="p-4">{children}</div>
    </main>
  </div>
}
