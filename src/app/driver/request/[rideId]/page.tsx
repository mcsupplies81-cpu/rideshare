'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DriverCountdown } from '@/components/driver/DriverCountdown'
import DriverMap from '@/components/maps/DriverMap'
import { useCurrentLocation } from '@/hooks/useDriverLocation'

type Ride = {
  id: string
  status: string
  pickup_address: string
  dropoff_address: string
  estimated_fare: number
  vehicle_type: string
  pickup_lat?: number
  pickup_lng?: number
  distance_miles?: number
  eta_minutes?: number
}

export default function RideRequestPage() {
  const { rideId } = useParams<{ rideId: string }>()
  const router = useRouter()
  const { lat, lng } = useCurrentLocation()
  const [ride, setRide] = useState<Ride | null>(null)
  const [loadingAction, setLoadingAction] = useState<'accept' | 'decline' | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/rides/${rideId}/status`)
      const data = await res.json()
      if (!res.ok || data.status !== 'searching') {
        router.replace('/driver')
        return
      }
      setRide(data)
    })()
  }, [rideId, router])

  async function declineAndLeave() {
    setLoadingAction('decline')
    await fetch(`/api/rides/${rideId}/decline`, { method: 'POST' })
    router.push('/driver')
  }

  async function acceptRide() {
    setLoadingAction('accept')
    await fetch(`/api/rides/${rideId}/accept`, { method: 'POST' })
    router.push(`/driver/trip/${rideId}`)
  }

  if (!ride) return <main className="min-h-screen bg-[#0F0F1A] p-6 text-white">Loading ride...</main>

  return (
    <main className="min-h-screen bg-[#0F0F1A] p-6 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-2xl bg-[#151526] p-6">
        <div className="flex justify-center">
          <DriverCountdown seconds={30} onExpire={declineAndLeave} />
        </div>
        <h1 className="text-3xl font-bold">{ride.pickup_address}</h1>
        <p className="text-lg text-gray-300">To: {ride.dropoff_address}</p>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-green-400">${Number(ride.estimated_fare ?? 0).toFixed(2)}</span>
          <span className="rounded-full bg-[#23233A] px-3 py-1 text-sm">{ride.vehicle_type}</span>
        </div>
        {(ride.distance_miles || ride.eta_minutes) && (
          <p className="text-sm text-gray-400">{ride.distance_miles ? `${ride.distance_miles.toFixed(1)} mi` : ''} {ride.eta_minutes ? `· ${ride.eta_minutes} min` : ''}</p>
        )}
        <DriverMap driverLat={lat} driverLng={lng} pickupLat={ride.pickup_lat ?? null} pickupLng={ride.pickup_lng ?? null} />
        <div className="grid grid-cols-2 gap-3">
          <button disabled={!!loadingAction} onClick={declineAndLeave} className="rounded-xl border border-red-500 py-3 font-semibold text-red-400 disabled:opacity-60">{loadingAction === 'decline' ? 'Declining...' : 'Decline'}</button>
          <button disabled={!!loadingAction} onClick={acceptRide} className="rounded-xl bg-[#7B5EA7] py-3 font-semibold text-white disabled:opacity-60">{loadingAction === 'accept' ? 'Accepting...' : 'Accept Ride'}</button>
        </div>
      </div>
    </main>
  )
}
