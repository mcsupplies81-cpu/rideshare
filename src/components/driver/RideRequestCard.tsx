'use client'

type RideRequestCardProps = {
  ride: {
    id: string
    pickup_address: string
    dropoff_address: string
    estimated_fare: number
    vehicle_type: string
  }
  onAccept: () => void
  onDecline: () => void
  loading?: boolean
}

export function RideRequestCard({ ride, onAccept, onDecline, loading = false }: RideRequestCardProps) {
  return (
    <div className="w-full rounded-2xl border border-[#2B2B40] bg-[#151526] p-6 text-white shadow-xl">
      <h1 className="mb-4 text-2xl font-semibold">New ride request</h1>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-gray-400">Pickup</p>
        <p className="text-xl font-semibold">{ride.pickup_address}</p>
        <p className="text-xs uppercase tracking-wider text-gray-400">Dropoff</p>
        <p className="text-lg">{ride.dropoff_address}</p>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#23233A] px-3 py-1 text-sm text-gray-200">{ride.vehicle_type}</span>
          <span className="text-3xl font-bold text-green-400">${Number(ride.estimated_fare ?? 0).toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button disabled={loading} onClick={onDecline} className="rounded-xl border border-red-500 py-3 font-semibold text-red-400 disabled:opacity-60">
          {loading ? 'Working...' : 'Decline'}
        </button>
        <button disabled={loading} onClick={onAccept} className="rounded-xl bg-[#7B5EA7] py-3 font-semibold text-white disabled:opacity-60">
          {loading ? 'Working...' : 'Accept Ride'}
        </button>
      </div>
    </div>
  )
}
