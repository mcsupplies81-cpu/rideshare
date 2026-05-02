import Link from 'next/link'
import { headers } from 'next/headers'

const statuses = ['all', 'pending', 'approved', 'suspended'] as const
const plans = ['all', 'trial', 'per_ride', 'pro'] as const

function statusColor(status: string) { if (status === 'pending') return 'bg-yellow-900/50 text-yellow-300'; if (status === 'approved') return 'bg-emerald-900/50 text-emerald-300'; if (status === 'suspended') return 'bg-red-900/50 text-red-300'; return 'bg-slate-800 text-slate-300' }

export default async function DriversPage({ searchParams }: { searchParams: Promise<{ approval_status?: string; page?: string; plan_type?: string; search?: string }> }) {
  const params = await searchParams
  const approvalStatus = statuses.includes((params.approval_status as any) ?? 'pending') ? (params.approval_status as any) : 'pending'
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const hdrs = await headers(); const host = hdrs.get('host'); const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const qs = new URLSearchParams({ approval_status: approvalStatus, page: String(page), limit: '20' })
  if (params.plan_type) qs.set('plan_type', params.plan_type)
  if (params.search) qs.set('search', params.search)
  const res = await fetch(`${protocol}://${host}/api/admin/drivers?${qs.toString()}`, { cache: 'no-store' })
  const payload = await res.json(); const rows = payload.data ?? []

  return <div className="space-y-4 text-white"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Drivers</h1><Link href="/api/admin/drivers?format=csv" className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium">Export CSV</Link></div>
    <form action='/admin/drivers' method='get' className='grid gap-2 md:grid-cols-3'><input name='search' defaultValue={params.search} placeholder='Search name or phone' className='rounded bg-slate-900 p-2' /><select name='plan_type' defaultValue={params.plan_type ?? 'all'} className='rounded bg-slate-900 p-2'>{plans.map((p) => <option key={p} value={p}>{p}</option>)}</select><input type='hidden' name='approval_status' value={approvalStatus} /><button className='rounded bg-purple-600 px-4 py-2'>Search</button></form>
    <div className="flex gap-2">{statuses.map((s) => <Link key={s} href={`/admin/drivers?approval_status=${s}&page=1`} className={`rounded-full px-4 py-2 text-sm ${approvalStatus === s ? 'bg-purple-600' : 'bg-slate-800 text-slate-300'}`}>{s[0].toUpperCase() + s.slice(1)}</Link>)}</div>
    <div className="overflow-x-auto rounded-xl bg-[#1A1A2E] p-2"><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="p-3">Name</th><th>Phone</th><th>Joined</th><th>Status</th><th>Plan</th><th>Rides</th><th>Actions</th></tr></thead><tbody>{rows.map((d: any) => <tr key={d.id} className="border-t border-slate-800"><td className="p-3">{d.user?.full_name ?? 'Unknown'}</td><td>{d.user?.phone ?? '—'}</td><td>{new Date(d.created_at).toLocaleDateString()}</td><td><span className={`rounded-full px-2 py-1 text-xs ${statusColor(d.approval_status)}`}>{d.approval_status}</span></td><td>{d.driver_plans?.find((p: any) => p.is_active)?.plan_type ?? '—'}</td><td>{d.total_rides ?? 0}</td><td><Link href={`/admin/drivers/${d.id}`} className="text-purple-300">Review</Link></td></tr>)}</tbody></table></div>
    <div className="flex items-center justify-between"><Link href={`/admin/drivers?approval_status=${approvalStatus}&page=${page-1}`} className={`rounded-md px-3 py-2 ${page <= 1 ? 'pointer-events-none bg-slate-800/50 text-slate-500' : 'bg-slate-800 text-white'}`}>Previous</Link><span className='text-sm text-slate-400'>Page {payload.page} of {payload.totalPages}</span><Link href={`/admin/drivers?approval_status=${approvalStatus}&page=${page+1}`} className={`rounded-md px-3 py-2 ${page >= payload.totalPages ? 'pointer-events-none bg-slate-800/50 text-slate-500' : 'bg-slate-800 text-white'}`}>Next</Link></div></div>
}
