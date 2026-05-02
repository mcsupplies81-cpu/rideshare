'use client'

type Ride = {
  id: string
  status: string
  pickup_address: string
  dropoff_address: string
  created_at: string
}

export function RideActivityFeed({ rides, onStatusFilter }: { rides: Ride[]; onStatusFilter: (status: string) => void }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Ride Activity</h3>
        <button className="text-sm text-purple-300" onClick={() => onStatusFilter('active')}>Active only</button>
      </div>
      <table className="w-full text-left text-sm">
        <thead><tr><th>Status</th><th>Route</th><th>Time</th></tr></thead>
        <tbody>
          {rides.map(ride => (
            <tr key={ride.id} className="border-t border-slate-800">
              <td>{ride.status}</td>
              <td>{ride.pickup_address} → {ride.dropoff_address}</td>
              <td>{new Date(ride.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
