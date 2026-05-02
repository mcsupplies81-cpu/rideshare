'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TripMap } from '@/components/maps/TripMap'
import { useRideStatus } from '@/hooks/useRideStatus'
import { useCurrentLocation, useDriverLocation } from '@/hooks/useDriverLocation'

type RideData = {
  id: string
  status: string
  rider_name?: string
  rider_phone?: string
  pickup_address?: string
  dropoff_address?: string
  pickup_lat?: number
  pickup_lng?: number
  dropoff_lat?: number
  dropoff_lng?: number
  estimated_fare?: number
  final_fare?: number
}

export default function DriverTripPage() {
  const { rideId } = useParams<{ rideId: string }>()
  const router = useRouter()
  const { ride: realtimeRide } = useRideStatus(rideId)
  const { startTracking, stopTracking } = useDriverLocation()
  const { lat, lng } = useCurrentLocation()
  const [ride, setRide] = useState<RideData | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/rides/${rideId}/status`)
      const data = await res.json()
      if (res.ok) setRide(data)
    })()
  }, [rideId])

  useEffect(() => {
    if (realtimeRide) setRide((prev) => ({ ...(prev ?? {}), ...realtimeRide } as RideData))
  }, [realtimeRide])

  useEffect(() => {
    if (ride?.status === 'in_trip') startTracking()
    return () => stopTracking()
  }, [ride?.status, startTracking, stopTracking])

  async function postAction(action: 'arrived' | 'start' | 'complete') {
    setLoadingAction(action)
    await fetch(`/api/rides/${rideId}/${action}`, { method: 'POST' })
    const res = await fetch(`/api/rides/${rideId}/status`)
    const data = await res.json()
    setRide(data)
    setLoadingAction(null)
  }

  if (!ride) return <main className="min-h-screen bg-[#0F0F1A] p-6 text-white">Loading trip...</main>

  const cancelled = ['cancelled_by_rider', 'cancelled_by_driver', 'no_driver_found'].includes(ride.status)

  return (
    <main className="min-h-screen bg-[#0F0F1A] p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-4 rounded-2xl bg-[#151526] p-6">
        {ride.status === 'accepted' && (
          <>
            <h1 className="text-2xl font-bold">En route to pickup</h1>
            <p>{ride.rider_name ?? 'Rider'}</p>
            <p className="text-gray-300">{ride.pickup_address}</p>
            {lat !== null && lng !== null && ride.pickup_lat != null && ride.pickup_lng != null && <TripMap driverLat={lat} driverLng={lng} pickupLat={ride.pickup_lat} pickupLng={ride.pickup_lng} dropoffLat={ride.dropoff_lat ?? 0} dropoffLng={ride.dropoff_lng ?? 0} />}
            <button disabled={!!loadingAction} onClick={() => void postAction('arrived')} className="w-full rounded-xl bg-[#7B5EA7] py-4 text-lg font-semibold">{loadingAction === 'arrived' ? 'Updating...' : "I've Arrived"}</button>
          </>
        )}

        {ride.status === 'driver_arrived' && (
          <>
            <h1 className="text-2xl font-bold">Waiting for rider</h1>
            <p>{ride.rider_name ?? 'Rider'}</p>
            {ride.rider_phone ? <a className="text-[#C6B2E5] underline" href={`tel:${ride.rider_phone}`}>{ride.rider_phone}</a> : null}
            <button disabled={!!loadingAction} onClick={() => void postAction('start')} className="w-full rounded-xl bg-[#7B5EA7] py-4 text-lg font-semibold">{loadingAction === 'start' ? 'Starting...' : 'Start Trip'}</button>
          </>
        )}

        {ride.status === 'in_trip' && (
          <>
            <h1 className="text-2xl font-bold">Trip in progress</h1>
            <p className="text-lg text-gray-200">Dropoff: {ride.dropoff_address}</p>
            <p className="text-2xl font-bold text-green-400">Est. ${Number(ride.estimated_fare ?? 0).toFixed(2)}</p>
            {lat !== null && lng !== null && ride.pickup_lat != null && ride.pickup_lng != null && ride.dropoff_lat != null && ride.dropoff_lng != null && <TripMap driverLat={lat} driverLng={lng} pickupLat={ride.pickup_lat} pickupLng={ride.pickup_lng} dropoffLat={ride.dropoff_lat} dropoffLng={ride.dropoff_lng} />}
            <button disabled={!!loadingAction} onClick={() => void postAction('complete')} className="w-full rounded-xl bg-[#7B5EA7] py-4 text-lg font-semibold">{loadingAction === 'complete' ? 'Completing...' : 'Complete Trip'}</button>
          </>
        )}

        {ride.status === 'completed' && (
          <>
            <h1 className="text-3xl font-bold">Trip Complete!</h1>
            <p className="text-2xl font-semibold text-green-400">Final Fare: ${Number(ride.final_fare ?? 0).toFixed(2)}</p>
            <button onClick={() => router.push('/driver')} className="w-full rounded-xl border border-[#7B5EA7] py-3">Done</button>
          </>
        )}

        {cancelled && (
          <>
            <h1 className="text-2xl font-bold">Ride Cancelled</h1>
            <p className="text-gray-300">This ride is no longer active.</p>
            <button onClick={() => router.push('/driver')} className="w-full rounded-xl border border-[#7B5EA7] py-3">Back to Home</button>
          </>
        )}
      </div>
    </main>
  )
}
