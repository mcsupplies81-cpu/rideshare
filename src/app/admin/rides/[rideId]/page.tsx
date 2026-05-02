import { createServiceClient } from '@/lib/supabase/server'

export default async function RideDetail({ params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await params
  const s = await createServiceClient() as any

  const [{ data: ride }, { data: events }, { data: payment }, { data: payout }, { data: drivers }] =
    await Promise.all([
      s.from('rides').select('*').eq('id', rideId).single(),
      s.from('ride_events').select('*').eq('ride_id', rideId).order('occurred_at'),
      s.from('payments').select('*').eq('ride_id', rideId).maybeSingle(),
      s.from('payouts').select('*').eq('ride_id', rideId).maybeSingle(),
      s.from('drivers').select('id,user:users!drivers_id_fkey(full_name)').eq('is_online', true).eq('approval_status', 'approved'),
    ]) as any[]

  return (
    <div className="space-y-4 p-6 text-white">
      <h1 className="text-2xl font-bold">Ride {rideId}</h1>
      <p>{ride?.pickup_address} → {ride?.dropoff_address}</p>
      <p>Status: {ride?.status}</p>
      <p>PaymentIntent: {ride?.stripe_payment_intent_id} / ${payment?.amount} ({payment?.status})</p>
      <p>Payout: {payout ? `$${payout.net_amount} (${payout.status})` : '—'}</p>

      {['no_driver_found', 'searching'].includes(ride?.status ?? '') && (
        <form action={`/api/admin/rides/${rideId}/assign`} method="post" className="flex gap-2">
          <select name="driver_id" className="bg-[#1A1A2E] rounded px-2 py-1">
            {(drivers as any[])?.map((d: any) => (
              <option key={d.id} value={d.id}>{d.user?.full_name ?? d.id}</option>
            ))}
          </select>
          <button className="px-3 py-1 bg-purple-600 rounded">Assign Driver</button>
        </form>
      )}

      <div>
        <h2 className="font-semibold mb-2">Event Timeline</h2>
        <ul className="space-y-1 text-sm text-gray-300">
          {(events as any[])?.map((e: any) => (
            <li key={e.id}>{e.event_type} @ {new Date(e.occurred_at).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
