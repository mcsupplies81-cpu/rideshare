import Link from 'next/link'
import { headers } from 'next/headers'

const statuses = ['all', 'pending', 'approved', 'suspended'] as const
const plans = ['all', 'trial', 'per_ride', 'pro'] as const

export default async function DriversPage({ searchParams }: { searchParams: Promise<{ approval_status?: string; page?: string; plan_type?: string; search?: string }> }) {
  const params = await searchParams
  const approvalStatus = statuses.includes((params.approval_status as any) ?? 'pending') ? (params.approval_status as any) : 'pending'
  const planType = plans.includes((params.plan_type as any) ?? 'all') ? (params.plan_type as any) : 'all'
  const search = params.search ?? ''
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const host = (await headers()).get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const qs = new URLSearchParams({ approval_status: approvalStatus, page: String(page), limit: '20', plan_type: planType, ...(search ? { search } : {}) })
  const res = await fetch(`${protocol}://${host}/api/admin/drivers?${qs}`, { cache: 'no-store' })
  const payload = await res.json()
  const rows = payload.drivers ?? []

  return <div className='space-y-4 text-white'><h1 className='text-2xl font-bold'>Drivers</h1>
    <div className='flex gap-2'>{statuses.map((s) => <Link key={s} href={`/admin/drivers?${new URLSearchParams({ approval_status: s, page: '1', plan_type: planType, ...(search ? { search } : {}) })}`} className={`rounded-full px-4 py-2 text-sm ${approvalStatus === s ? 'bg-purple-600' : 'bg-slate-800 text-slate-300'}`}>{s}</Link>)}</div>
    <form className='grid gap-2 md:grid-cols-4'><input type='hidden' name='approval_status' value={approvalStatus} /><input name='search' placeholder='Search name or phone' defaultValue={search} className='rounded bg-slate-900 p-2' /><select name='plan_type' defaultValue={planType} className='rounded bg-slate-900 p-2'>{plans.map((p)=><option key={p} value={p}>{p}</option>)}</select><button className='rounded bg-slate-800 px-3 py-2'>Apply</button></form>
    <div className='overflow-x-auto rounded-xl bg-[#1A1A2E] p-2'><table className='w-full text-sm'><thead><tr className='text-left text-slate-400'><th className='p-3'>Name</th><th>Phone</th><th>Status</th><th>Plan</th></tr></thead><tbody>{rows.map((d:any)=><tr key={d.id} className='border-t border-slate-800'><td className='p-3'>{d.user?.full_name ?? 'Unknown'}</td><td>{d.user?.phone ?? '—'}</td><td>{d.approval_status}</td><td>{d.driver_plans?.find((p:any)=>p.is_active)?.plan_type ?? '—'}</td></tr>)}</tbody></table></div>
    <div className='flex items-center justify-between'><Link href={`/admin/drivers?${new URLSearchParams({ approval_status: approvalStatus, page: String(Math.max(1,page-1)), plan_type: planType, ...(search ? { search } : {}) })}`} className={`rounded px-3 py-2 ${page<=1?'pointer-events-none bg-slate-800/50 text-slate-500':'bg-slate-800'}`}>Previous</Link><span>Page {payload.page} of {payload.totalPages}</span><Link href={`/admin/drivers?${new URLSearchParams({ approval_status: approvalStatus, page: String(page+1), plan_type: planType, ...(search ? { search } : {}) })}`} className={`rounded px-3 py-2 ${page>=payload.totalPages?'pointer-events-none bg-slate-800/50 text-slate-500':'bg-slate-800'}`}>Next</Link></div>
  </div>
}
