'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type RideStatus =
  | 'quoted'
  | 'payment_authorized'
  | 'searching'
  | 'accepted'
  | 'driver_arrived'
  | 'in_trip'
  | 'completed'
  | 'cancelled_by_rider'
  | 'cancelled_by_driver'
  | 'no_driver_found'
  | 'payment_failed'

interface RideStatusData {
  id: string
  status: RideStatus
  driver_id: string | null
  driver?: {
    full_name: string | null
    phone: string | null
    rating: number | null
  }
}

export function useRideStatus(rideId: string | null) {
  const [ride, setRide] = useState<RideStatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!rideId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function fetchRide() {
      const { data } = await supabase
        .from('rides')
        .select(`
          id, status, driver_id,
          driver:users!rides_driver_id_fkey(full_name, phone, rating)
        `)
        .eq('id', rideId!)
        .single()

      if (data) setRide(data as RideStatusData)
      setLoading(false)
    }

    fetchRide()

    // Subscribe to realtime changes on this ride row
    const channel = supabase
      .channel(`ride:${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          setRide((prev) => prev ? { ...prev, ...payload.new } : (payload.new as RideStatusData))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [rideId])

  return { ride, loading }
}
