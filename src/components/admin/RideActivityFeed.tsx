'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import RideStatusBadge from '@/components/rides/RideStatusBadge'
import { useEffect } from 'react'

export function RideActivityFeed({ initialRides }: { initialRides: any[] }) {
  const supabase = useMemo(() => createClient(), [])
  const [rides, setRides] = useState<any[]>(initialRides ?? [])

  useEffect(() => {
    const upsertRide = (row: any) => {
      setRides((prev) => {
        const next = [row, ...prev.filter((r) => r.id !== row.id)]
        return next.slice(0, 20)
      })
    }

    const channel = supabase
      .channel('admin-ride-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides' }, ({ new: row }) => upsertRide(row))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides' }, ({ new: row }) => upsertRide(row))
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="rounded-2xl bg-[#1A1A2E] p-5 text-white">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
        <h3 className="font-semibold">Live Feed</h3>
      </div>
      <div className="space-y-3">
        {rides.map((ride) => (
          <div key={ride.id} className="rounded-lg border border-slate-800/70 bg-slate-900/50 p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
              <span>{new Date(ride.created_at ?? Date.now()).toLocaleTimeString()}</span>
              <span>${Number(ride.final_fare ?? ride.estimated_fare ?? 0).toFixed(2)}</span>
            </div>
            <p className="truncate text-sm">{ride.pickup_address} → {ride.dropoff_address}</p>
            <div className="mt-2"><RideStatusBadge status={ride.status} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
