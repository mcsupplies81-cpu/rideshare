'use client'

import { useEffect, useState } from 'react'

type Period = 'today' | 'week' | 'month'

export default function DriverEarningsPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/driver/earnings?period=${period}`).then(async (r) => setData(await r.json()))
  }, [period])

  return (
    <main className="space-y-6 p-6">
      <div className="flex gap-2">{(['today', 'week', 'month'] as Period[]).map((p) => <button key={p} className="rounded border px-3 py-1" onClick={() => setPeriod(p)}>{p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}</button>)}</div>
      <div className="text-4xl font-bold">${(data?.total_net ?? 0).toFixed?.(2) ?? '0.00'}</div>
      <div className="grid grid-cols-3 gap-4 text-sm"><div>Rides {data?.ride_count ?? 0}</div><div>Earnings ${(data?.total_gross ?? 0).toFixed?.(2) ?? '0.00'}</div><div>Fees ${(data?.total_fees ?? 0).toFixed?.(2) ?? '0.00'}</div></div>
      <div className="space-y-2">
        {(data?.recent_rides ?? []).map((ride: any) => (
          <div key={ride.ride_id} className="flex items-center justify-between rounded border p-3 text-sm">
            <div>
              <div>{new Date(ride.completed_at).toLocaleTimeString()} · {`${ride.pickup_address} → ${ride.dropoff_address}`.slice(0, 60)}</div>
            </div>
            <div className="flex items-center gap-3"><span>${Number(ride.net_amount).toFixed(2)}</span><span className="rounded bg-gray-100 px-2 py-1">{ride.status}</span></div>
          </div>
        ))}
      </div>
      <a className="text-purple-600" href="#">View All</a>
    </main>
  )
}
