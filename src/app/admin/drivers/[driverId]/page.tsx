import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

const labels: Record<string, string> = {
  drivers_license: "Driver's License",
  insurance: 'Insurance',
  vehicle_registration: 'Vehicle Registration',
}

export default async function DriverDetail({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = await params
  const s = await createServiceClient() as any
  const [{ data: driver }, { data: documents }, { data: vehicle }, { data: activePlan }, { count: rideCount }] = await Promise.all([
    s.from('drivers').select('*, user:users!drivers_id_fkey(full_name,phone,city,date_of_birth)').eq('id', driverId).single(),
    s.from('driver_documents').select('*').eq('driver_id', driverId),
    s.from('vehicles').select('*').eq('driver_id', driverId).maybeSingle(),
    s.from('driver_plans').select('*').eq('driver_id', driverId).eq('is_active', true).maybeSingle(),
    s.from('rides').select('*', { count: 'exact', head: true }).eq('driver_id', driverId).eq('status', 'completed'),
  ])

  const docsWithUrls = await Promise.all((documents ?? []).map(async (d: any) => {
    const { data } = await s.storage.from('driver-documents').createSignedUrl(d.storage_path, 3600)
    return { ...d, signed_url: data?.signedUrl ?? null }
  }))

  async function approve() { 'use server'; await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/drivers/${driverId}/approve`, { method: 'POST' }); redirect('/admin/drivers') }
  async function suspend() { 'use server'; await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/drivers/${driverId}/suspend`, { method: 'POST' }); redirect('/admin/drivers') }

  const canApprove = ['pending', 'rejected'].includes(driver?.approval_status) && docsWithUrls.length >= 3

  return <div className="space-y-5 text-white">
    <div><Link href="/admin/drivers" className="text-purple-300">← Back to Drivers</Link><h1 className="mt-2 text-2xl font-bold">{driver?.user?.full_name ?? 'Driver'}</h1><p className="text-slate-400">Rating: {Number(driver?.rating ?? 0).toFixed(2)} stars ({rideCount ?? 0} rides)</p></div>
    {docsWithUrls.length < 3 && <p className="rounded-lg border border-yellow-700 bg-yellow-900/30 p-3 text-yellow-300">Warning: fewer than 3 required documents uploaded.</p>}
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl bg-[#1A1A2E] p-4"><h2 className="mb-2 font-semibold">Driver Info</h2><p>Name: {driver?.user?.full_name ?? '—'}</p><p>Phone: {driver?.user?.phone ?? '—'}</p><p>City: {driver?.user?.city ?? '—'}</p><p>Date of Birth: {driver?.user?.date_of_birth ?? '—'}</p><p>Member since: {new Date(driver?.created_at).toLocaleDateString()}</p></div>
      <div className="rounded-xl bg-[#1A1A2E] p-4"><h2 className="mb-2 font-semibold">Vehicle</h2><p>{vehicle?.year} {vehicle?.make} {vehicle?.model}</p><p>Color: {vehicle?.color ?? '—'}</p><p>Plate: {vehicle?.license_plate ?? '—'}</p><p>Type: {vehicle?.vehicle_type ?? '—'}</p></div>
    </section>
    <section className="rounded-xl bg-[#1A1A2E] p-4"><h2 className="mb-2 font-semibold">Plan</h2><p>Current plan: {activePlan?.plan_type ?? 'None'}</p><p>Trial days remaining: {activePlan?.trial_ends_at ? Math.max(0, Math.ceil((new Date(activePlan.trial_ends_at).getTime() - Date.now()) / 86400000)) : 'N/A'}</p><p>Stripe Connect: {driver?.stripe_connect_onboarded ? 'Connected' : 'Not connected'}</p></section>
    <section className="rounded-xl bg-[#1A1A2E] p-4"><h2 className="mb-3 font-semibold">Documents</h2><ul className="space-y-2">{docsWithUrls.map((d: any) => <li key={d.id} className="flex items-center justify-between rounded-md border border-slate-800 p-3"><div><p>{labels[d.document_type] ?? d.document_type}</p><p className="text-xs text-slate-400">{d.status}</p></div>{d.signed_url ? <a href={d.signed_url} target="_blank" className="rounded bg-slate-800 px-3 py-1 text-sm">View</a> : <span className="text-xs text-slate-500">No preview</span>}</li>)}</ul></section>
    <div className="flex gap-2">{canApprove && <form action={approve}><button className="rounded bg-emerald-600 px-4 py-2">Approve Driver</button></form>}{driver?.approval_status === 'approved' && <form action={suspend}><button className="rounded bg-red-600 px-4 py-2">Suspend</button></form>}{['pending', 'rejected'].includes(driver?.approval_status) && <form action={suspend}><button className="rounded bg-rose-700 px-4 py-2">Reject</button></form>}</div>
  </div>
}
