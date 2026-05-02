import Link from 'next/link'
import { headers } from 'next/headers'
import RideStatusBadge from '@/components/rides/RideStatusBadge'

const tabs = ['all', 'active', 'completed', 'cancelled'] as const
const live = new Set(['searching', 'accepted', 'driver_arrived', 'in_trip'])

export default async function AdminRidesPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const params = await searchParams
  const status = tabs.includes((params.status as any) ?? 'all') ? (params.status as any) : 'all'
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const mapped = status === 'active' ? 'in_trip' : status === 'cancelled' ? 'cancelled_by_rider' : status
  const host = (await headers()).get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const res = await fetch(`${protocol}://${host}/api/admin/rides?status=${mapped}&page=${page}&limit=25`, { cache: 'no-store' })
  const payload = await res.json()
  const rides = payload.data ?? []
  const hasNext = page * 25 < (payload.total ?? 0)

  return <div className="space-y-4 text-white"><h1 className="text-2xl font-bold">Rides</h1><div className="flex gap-2">{tabs.map((t) => <Link key={t} href={`/admin/rides?status=${t}&page=1`} className={`rounded-full px-4 py-2 text-sm ${status === t ? 'bg-purple-600' : 'bg-slate-800 text-slate-300'}`}>{t[0].toUpperCase() + t.slice(1)}</Link>)}</div>
  <div className="overflow-x-auto rounded-xl bg-[#1A1A2E] p-2"><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="p-3">Time</th><th>Rider</th><th>Driver</th><th>Pickup → Dropoff</th><th>Fare</th><th>Status</th></tr></thead><tbody>{rides.map((r:any)=><tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/40"><td className="p-3"><Link href={`/admin/rides/${r.id}`}>{new Date(r.created_at).toLocaleString()}</Link></td><td>{r.rider?.full_name ?? '—'}</td><td>{r.driver?.full_name ?? '—'}</td><td className="max-w-xs truncate">{r.pickup_address} → {r.dropoff_address}</td><td>${Number(r.final_fare ?? r.estimated_fare ?? 0).toFixed(2)}</td><td className="space-x-2"><RideStatusBadge status={r.status} />{live.has(r.status) && <span className="rounded bg-emerald-900/50 px-2 py-1 text-xs text-emerald-300">LIVE</span>}</td></tr>)}</tbody></table></div>
  <div className="flex justify-between"><Link href={`/admin/rides?status=${status}&page=${page-1}`} className={`rounded px-3 py-2 ${page<=1?'pointer-events-none bg-slate-800/50 text-slate-500':'bg-slate-800'}`}>Previous</Link><Link href={`/admin/rides?status=${status}&page=${page+1}`} className={`rounded px-3 py-2 ${!hasNext?'pointer-events-none bg-slate-800/50 text-slate-500':'bg-slate-800'}`}>Next</Link></div></div>
}
