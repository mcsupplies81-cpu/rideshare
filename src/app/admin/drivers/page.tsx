import Link from 'next/link'
import { headers } from 'next/headers'

const statuses = ['all', 'pending', 'approved', 'suspended'] as const

function statusColor(status: string) {
  if (status === 'pending') return 'bg-yellow-900/50 text-yellow-300'
  if (status === 'approved') return 'bg-emerald-900/50 text-emerald-300'
  if (status === 'suspended') return 'bg-red-900/50 text-red-300'
  return 'bg-slate-800 text-slate-300'
}

export default async function DriversPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const params = await searchParams
  const status = statuses.includes((params.status as any) ?? 'pending') ? (params.status as any) : 'pending'
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const hdrs = await headers()
  const host = hdrs.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const res = await fetch(`${protocol}://${host}/api/admin/drivers?status=${status}&page=${page}&limit=20`, { cache: 'no-store' })
  const payload = await res.json()
  const rows = payload.data ?? []
  const total = payload.total ?? 0
  const hasNext = page * 20 < total

  return <div className="space-y-4 text-white">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Drivers</h1>
      <Link href="/api/admin/drivers?format=csv" className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium hover:bg-purple-500">Export CSV</Link>
    </div>
    <div className="flex gap-2">{statuses.map((s) => <Link key={s} href={`/admin/drivers?status=${s}&page=1`} className={`rounded-full px-4 py-2 text-sm ${status === s ? 'bg-purple-600' : 'bg-slate-800 text-slate-300'}`}>{s[0].toUpperCase() + s.slice(1)}</Link>)}</div>
    {rows.length === 0 ? <div className="rounded-xl border border-slate-800 bg-[#1A1A2E] p-8 text-center text-slate-300">No {status === 'all' ? '' : status} drivers found.</div> : (
      <div className="overflow-x-auto rounded-xl bg-[#1A1A2E] p-2">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400"><th className="p-3">Name</th><th>Phone</th><th>Joined</th><th>Status</th><th>Plan</th><th>Rides</th><th>Actions</th></tr></thead>
          <tbody>{rows.map((d: any) => <tr key={d.id} className="border-t border-slate-800"><td className="p-3">{d.user?.full_name ?? 'Unknown'}</td><td>{d.user?.phone ?? '—'}</td><td>{new Date(d.created_at).toLocaleDateString()}</td><td><span className={`rounded-full px-2 py-1 text-xs ${statusColor(d.approval_status)}`}>{d.approval_status}</span></td><td>{d.driver_plans?.find((p: any) => p.is_active)?.plan_type ?? '—'}</td><td>{d.total_rides ?? 0}</td><td><Link href={`/admin/drivers/${d.id}`} className="text-purple-300 hover:text-purple-200">Review</Link></td></tr>)}</tbody>
        </table>
      </div>
    )}
    <div className="flex items-center justify-between">
      <Link aria-disabled={page <= 1} href={`/admin/drivers?status=${status}&page=${page - 1}`} className={`rounded-md px-3 py-2 ${page <= 1 ? 'pointer-events-none bg-slate-800/50 text-slate-500' : 'bg-slate-800 text-white'}`}>Previous</Link>
      <span className="text-sm text-slate-400">Page {page}</span>
      <Link aria-disabled={!hasNext} href={`/admin/drivers?status=${status}&page=${page + 1}`} className={`rounded-md px-3 py-2 ${!hasNext ? 'pointer-events-none bg-slate-800/50 text-slate-500' : 'bg-slate-800 text-white'}`}>Next</Link>
    </div>
  </div>
}
