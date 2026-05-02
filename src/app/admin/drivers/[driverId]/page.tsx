import { createServiceClient } from '@/lib/supabase/server'

export default async function DriverDetail({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = await params
  const s = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: driver }, { data: docs }, { data: vehicle }, { data: plans }, { data: rides }] =
    await Promise.all([
      (s as any).from('drivers').select('*, user:users!drivers_id_fkey(full_name,phone)').eq('id', driverId).single(),
      (s as any).from('driver_documents').select('*').eq('driver_id', driverId),
      (s as any).from('vehicles').select('*').eq('driver_id', driverId).maybeSingle(),
      (s as any).from('driver_plans').select('*').eq('driver_id', driverId).order('created_at', { ascending: false }),
      (s as any).from('rides').select('*').eq('driver_id', driverId).order('created_at', { ascending: false }).limit(10),
    ]) as any[]

  return (
    <div className="space-y-4 p-6 text-white">
      <h1 className="text-2xl font-bold">{driver?.user?.full_name ?? 'Unknown Driver'}</h1>
      <p className="text-gray-400">{driver?.user?.phone}</p>
      <p>Rating: {driver?.rating ?? 'N/A'}</p>
      <div className="flex gap-2">
        {['pending', 'rejected'].includes(driver?.approval_status ?? '') && (
          <form action={`/api/drivers/${driverId}/approve`} method="post">
            <button className="px-4 py-2 bg-green-600 rounded">Approve Driver</button>
          </form>
        )}
        {driver?.approval_status === 'approved' && (
          <form action={`/api/drivers/${driverId}/suspend`} method="post">
            <button className="px-4 py-2 bg-red-600 rounded">Suspend</button>
          </form>
        )}
      </div>
      <div>
        <h2 className="font-semibold mb-2">Documents</h2>
        <ul className="space-y-1">
          {docs?.map((d: any) => (
            <li key={d.id} className="text-sm text-gray-300">{d.document_type} — {d.status}</li>
          ))}
        </ul>
      </div>
      <p>Vehicle: {vehicle?.make} {vehicle?.model}</p>
      <p>Plan: {plans?.find((p: any) => p.is_active)?.plan_type ?? 'none'} | Stripe: {driver?.stripe_connect_onboarded ? 'Connected' : 'Not connected'}</p>
      <p>Recent rides: {rides?.length ?? 0}</p>
    </div>
  )
}
