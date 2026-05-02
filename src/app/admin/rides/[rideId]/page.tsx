import { TripMap } from '@/components/maps/TripMap'
import { createServiceClient } from '@/lib/supabase/server'

export default async function RideDetailPage({ params }: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await params
  const supabase = (await createServiceClient()) as any

  const [{ data: ride }, { data: rideEvents }, { data: payment }] = await Promise.all([
    supabase
      .from('rides')
      .select('*,driver:drivers!rides_driver_id_fkey(rating,user:users!drivers_id_fkey(full_name,phone)),rider:users!rides_rider_id_fkey(full_name,phone)')
      .eq('id', rideId)
      .single(),
    supabase.from('ride_events').select('*').eq('ride_id', rideId).order('created_at', { ascending: true }),
    supabase.from('payments').select('*').eq('ride_id', rideId).maybeSingle(),
  ])

  const hasCoords = Boolean(ride?.pickup_lat && ride?.pickup_lng && ride?.dropoff_lat && ride?.dropoff_lng)

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="rounded-xl bg-[#1A1A2E] p-4">
        <h1 className="mb-2 text-2xl font-bold">Ride {rideId}</h1>
        <div className="space-y-1 text-sm">
          <p>Status: <span className="rounded-full bg-slate-800 px-2 py-1">{ride?.status ?? 'unknown'}</span></p>
          <p>Pickup: {ride?.pickup_address ?? '—'}</p>
          <p>Dropoff: {ride?.dropoff_address ?? '—'}</p>
          <p>Fare: Est. ${Number(ride?.estimated_fare ?? 0).toFixed(2)} / Final ${Number(ride?.final_fare ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-[#1A1A2E] p-4">
          <h2 className="mb-2 font-semibold">Driver</h2>
          <p>{ride?.driver?.user?.full_name ?? 'Unknown'}</p>
          <p className="text-sm text-slate-300">{ride?.driver?.user?.phone ?? '—'}</p>
          <p className="text-sm text-slate-300">Rating: {ride?.driver?.rating ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-[#1A1A2E] p-4">
          <h2 className="mb-2 font-semibold">Rider</h2>
          <p>{ride?.rider?.full_name ?? 'Unknown'}</p>
          <p className="text-sm text-slate-300">{ride?.rider?.phone ?? '—'}</p>
        </div>
      </div>

      <div className="rounded-xl bg-[#1A1A2E] p-4">
        <h2 className="mb-2 font-semibold">Event Timeline</h2>
        <ul className="space-y-3 border-l border-slate-700 pl-4">
          {((rideEvents ?? []) as any[]).map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-purple-400" />
              <p className="font-medium">{event.status ?? event.event_type ?? 'event'}</p>
              <p className="text-sm text-slate-400">{new Date(event.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-[#1A1A2E] p-4">
        <h2 className="mb-2 font-semibold">Payment</h2>
        <p>Amount: ${Number(payment?.amount ?? 0).toFixed(2)}</p>
        <p>Status: {payment?.status ?? '—'}</p>
        <p>Payment Intent: {payment?.payment_intent_id ? `${payment.payment_intent_id.slice(0, 20)}...` : '—'}</p>
      </div>

      {hasCoords ? (
        <TripMap
          pickupLat={ride.pickup_lat}
          pickupLng={ride.pickup_lng}
          dropoffLat={ride.dropoff_lat}
          dropoffLng={ride.dropoff_lng}
        />
      ) : null}
    </div>
  )
}
