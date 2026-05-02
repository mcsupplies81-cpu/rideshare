import Link from 'next/link'
import { headers } from 'next/headers'
import RideStatusBadge from '@/components/rides/RideStatusBadge'

const tabs = ['all', 'searching', 'in_trip', 'completed', 'cancelled'] as const

export default async function AdminRidesPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; from?: string; to?: string; driver_id?: string }> }) {
  const params = await searchParams
  const status = tabs.includes((params.status as any) ?? 'all') ? (params.status as any) : 'all'
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const from = params.from ?? ''
  const to = params.to ?? ''
  const driverId = params.driver_id ?? ''
  const host = (await headers()).get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const qs = new URLSearchParams({ status, page: String(page), limit: '25', ...(from ? { from } : {}), ...(to ? { to } : {}), ...(driverId ? { driver_id: driverId } : {}) })
  const res = await fetch(`${protocol}://${host}/api/admin/rides?${qs.toString()}`, { cache: 'no-store' })
  const payload = await res.json()
  const rides = payload.rides ?? []

  return <div className="space-y-4 text-white"><h1 className="text-2xl font-bold">Rides</h1>
    <div className='flex flex-wrap gap-2'>{tabs.map((t) => <Link key={t} href={`/admin/rides?${new URLSearchParams({ status: t, page: '1', ...(from ? { from } : {}), ...(to ? { to } : {}), ...(driverId ? { driver_id: driverId } : {}) }).toString()}`} className={`rounded-full px-4 py-2 text-sm ${status === t ? 'bg-purple-600' : 'bg-slate-800 text-slate-300'}`}>{t}</Link>)}</div>
    <form className='grid gap-2 md:grid-cols-4'>
      <input type='hidden' name='status' value={status} />
      <input type='date' name='from' defaultValue={from} className='rounded bg-slate-900 p-2' />
      <input type='date' name='to' defaultValue={to} className='rounded bg-slate-900 p-2' />
      <input name='driver_id' placeholder='Driver ID' defaultValue={driverId} className='rounded bg-slate-900 p-2' />
      <button className='rounded bg-slate-800 px-3 py-2'>Apply</button>
    </form>
    <div className="overflow-x-auto rounded-xl bg-[#1A1A2E] p-2"><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="p-3">Time</th><th>Rider</th><th>Driver</th><th>Route</th><th>Fare</th><th>Status</th></tr></thead><tbody>{rides.map((r:any)=><tr key={r.id} className="border-t border-slate-800"><td className="p-3"><Link href={`/admin/rides/${r.id}`}>{new Date(r.created_at).toLocaleString()}</Link></td><td>{r.rider?.full_name ?? '—'}</td><td>{r.driver?.full_name ?? '—'}</td><td className="max-w-xs truncate">{r.pickup_address} → {r.dropoff_address}</td><td>${Number(r.final_fare ?? r.estimated_fare ?? 0).toFixed(2)}</td><td><RideStatusBadge status={r.status} /></td></tr>)}</tbody></table></div>
    <div className='flex items-center justify-between'><Link href={`/admin/rides?${new URLSearchParams({ status, page: String(Math.max(1, page - 1)), ...(from ? { from } : {}), ...(to ? { to } : {}), ...(driverId ? { driver_id: driverId } : {}) })}`} className={`rounded px-3 py-2 ${page<=1?'pointer-events-none bg-slate-800/50 text-slate-500':'bg-slate-800'}`}>Previous</Link><span className='text-sm text-slate-400'>Page {payload.page} of {payload.totalPages}</span><Link href={`/admin/rides?${new URLSearchParams({ status, page: String(page + 1), ...(from ? { from } : {}), ...(to ? { to } : {}), ...(driverId ? { driver_id: driverId } : {}) })}`} className={`rounded px-3 py-2 ${page>=payload.totalPages?'pointer-events-none bg-slate-800/50 text-slate-500':'bg-slate-800'}`}>Next</Link></div>
  </div>
}
