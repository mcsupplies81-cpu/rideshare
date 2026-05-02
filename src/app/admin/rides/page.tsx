import Link from 'next/link'
import { headers } from 'next/headers'
import RideStatusBadge from '@/components/rides/RideStatusBadge'

const statuses = ['all', 'searching', 'in_trip', 'completed', 'cancelled_by_rider'] as const

export default async function AdminRidesPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; driver_id?: string; from?: string; to?: string }> }) {
  const params = await searchParams
  const status = statuses.includes((params.status as any) ?? 'all') ? (params.status as any) : 'all'
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const hdrs = await headers()
  const host = hdrs.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const qs = new URLSearchParams({ status, page: String(page), limit: '25' })
  if (params.driver_id) qs.set('driver_id', params.driver_id)
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const res = await fetch(`${protocol}://${host}/api/admin/rides?${qs.toString()}`, { cache: 'no-store' })
  const payload = await res.json()
  const rides = payload.rides ?? []

  return <div className="space-y-4 text-white"><h1 className="text-2xl font-bold">Rides</h1>
  <form className='grid gap-2 md:grid-cols-3' action='/admin/rides' method='get'><input type='hidden' name='status' value={status} /><input name='driver_id' defaultValue={params.driver_id} placeholder='Driver ID' className='rounded bg-slate-900 p-2' /><input name='from' type='date' defaultValue={params.from} className='rounded bg-slate-900 p-2' /><input name='to' type='date' defaultValue={params.to} className='rounded bg-slate-900 p-2' /><button className='rounded bg-purple-600 px-4 py-2'>Apply Filters</button></form>
  <div className="flex gap-2">{statuses.map((s) => <Link key={s} href={`/admin/rides?status=${s}&page=1`} className={`rounded-full px-4 py-2 text-sm ${status === s ? 'bg-purple-600' : 'bg-slate-800 text-slate-300'}`}>{s === 'cancelled_by_rider' ? 'cancelled' : s}</Link>)}</div>
  <div className="overflow-x-auto rounded-xl bg-[#1A1A2E] p-2"><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="p-3">Time</th><th>Rider</th><th>Driver</th><th>Pickup → Dropoff</th><th>Fare</th><th>Status</th></tr></thead><tbody>{rides.map((r:any)=><tr key={r.id} className="border-t border-slate-800"><td className="p-3"><Link href={`/admin/rides/${r.id}`}>{new Date(r.created_at).toLocaleString()}</Link></td><td>{r.rider?.full_name ?? '—'}</td><td>{r.driver?.full_name ?? '—'}</td><td className="max-w-xs truncate">{r.pickup_address} → {r.dropoff_address}</td><td>${Number(r.final_fare ?? r.estimated_fare ?? 0).toFixed(2)}</td><td><RideStatusBadge status={r.status} /></td></tr>)}</tbody></table></div>
  <div className='flex items-center justify-between'><Link href={`/admin/rides?status=${status}&page=${page - 1}`} className={`rounded px-3 py-2 ${page<=1?'pointer-events-none bg-slate-800/50 text-slate-500':'bg-slate-800'}`}>Previous</Link><span className='text-sm text-slate-400'>Page {payload.page} of {payload.totalPages}</span><Link href={`/admin/rides?status=${status}&page=${page + 1}`} className={`rounded px-3 py-2 ${page>=payload.totalPages?'pointer-events-none bg-slate-800/50 text-slate-500':'bg-slate-800'}`}>Next</Link></div></div>
}
