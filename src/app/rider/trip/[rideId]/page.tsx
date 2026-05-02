'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, MapPin, Star } from 'lucide-react'
import { RiderMap } from '@/components/maps/RiderMap'
import RatingModal from '@/components/rides/RatingModal'
import { useRideStatus } from '@/hooks/useRideStatus'

type RideDetail = Record<string, any>

const CANCELLED_STATUSES = new Set(['cancelled_by_rider', 'cancelled_by_driver', 'no_driver_found', 'payment_failed'])

export default function RiderTripPage() {
  const params = useParams<{ rideId: string }>()
  const rideId = params?.rideId
  const router = useRouter()
  const { ride, loading } = useRideStatus(rideId)
  const [rideDetail, setRideDetail] = useState<RideDetail | null>(null)
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    if (!rideId) return

    const loadStatus = async () => {
      const response = await fetch(`/api/rides/${rideId}/status`, { cache: 'no-store' })
      if (!response.ok) return
      setRideDetail(await response.json())
    }

    void loadStatus()
    const interval = window.setInterval(() => {
      void loadStatus()
    }, 10000)
    return () => window.clearInterval(interval)
  }, [rideId])

  useEffect(() => {
    if (ride?.status === 'searching' && rideId) {
      router.replace(`/rider/searching?rideId=${rideId}`)
    }
  }, [ride?.status, rideId, router])

  useEffect(() => {
    if (ride?.status !== 'completed') {
      setShowRating(false)
      return
    }

    const timer = window.setTimeout(() => setShowRating(true), 1000)
    return () => window.clearTimeout(timer)
  }, [ride?.status])

  const acceptedAt = rideDetail?.accepted_at ? new Date(rideDetail.accepted_at).getTime() : null
  const canCancel = acceptedAt ? Date.now() - acceptedAt < 2 * 60 * 1000 : false

  const driverRating = useMemo(() => {
    const value = Number(ride?.driver?.rating ?? 0)
    return Number.isFinite(value) ? value.toFixed(1) : '—'
  }, [ride?.driver?.rating])

  const status = ride?.status

  if (!rideId || loading || !status) {
    return <main className="min-h-screen bg-[#0F0F1A] p-6 text-white">Loading trip...</main>
  }

  return (
    <main className="min-h-screen bg-[#0F0F1A] p-4 pb-24 text-white">
      <div key={status} className="mx-auto max-w-2xl animate-[fade_400ms_ease-in-out] space-y-4">
        {status === 'accepted' && (
          <section className="space-y-4 rounded-xl bg-[#1A1A2E] p-5">
            <h1 className="text-2xl font-bold">Driver is on the way</h1>
            <p>{ride?.driver?.full_name ?? 'Your driver'} • ⭐ {driverRating}</p>
            <p className="text-sm text-gray-300">{rideDetail?.vehicle_make} {rideDetail?.vehicle_model} {rideDetail?.vehicle_color}</p>
            <RiderMap
              pickupLat={rideDetail?.driver_lat ?? undefined}
              pickupLng={rideDetail?.driver_lng ?? undefined}
              dropoffLat={rideDetail?.pickup_lat ?? undefined}
              dropoffLng={rideDetail?.pickup_lng ?? undefined}
            />
            {rideDetail?.estimated_arrival && <p>Estimated arrival: {rideDetail.estimated_arrival}</p>}
            {canCancel && (
              <button
                type="button"
                className="rounded-lg border border-red-500 px-4 py-2 text-red-300"
                onClick={async () => {
                  await fetch(`/api/rides/${rideId}/cancel`, { method: 'POST' })
                }}
              >
                Cancel
              </button>
            )}
          </section>
        )}

        {status === 'driver_arrived' && (
          <section className="space-y-4 rounded-xl bg-[#1A1A2E] p-5">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-green-400"><CheckCircle2 />Your driver has arrived!</h1>
            <p>{ride?.driver?.full_name ?? 'Your driver'} • {rideDetail?.vehicle_make} {rideDetail?.vehicle_model}</p>
            <p className="text-gray-300">Meet your driver outside.</p>
            <div className="flex items-center justify-center">
              <MapPin className="h-12 w-12 animate-pulse text-[#7B5EA7]" />
            </div>
          </section>
        )}

        {status === 'in_trip' && (
          <section className="space-y-4 rounded-xl bg-[#1A1A2E] p-5">
            <h1 className="text-2xl font-bold">You&apos;re on your way!</h1>
            <RiderMap
              pickupLat={rideDetail?.pickup_lat ?? undefined}
              pickupLng={rideDetail?.pickup_lng ?? undefined}
              dropoffLat={rideDetail?.dropoff_lat ?? undefined}
              dropoffLng={rideDetail?.dropoff_lng ?? undefined}
            />
            <p className="text-sm text-gray-300">Dropoff: {rideDetail?.dropoff_address ?? '—'}</p>
            {rideDetail?.estimated_time_remaining && <p>Estimated time remaining: {rideDetail.estimated_time_remaining}</p>}
          </section>
        )}

        {status === 'completed' && (
          <section className="space-y-4 rounded-xl bg-[#1A1A2E] p-5">
            <h1 className="text-2xl font-bold">You&apos;ve arrived!</h1>
            <p className="text-4xl font-extrabold text-[#7B5EA7]">${Number(rideDetail?.final_fare ?? 0).toFixed(2)}</p>
          </section>
        )}

        {CANCELLED_STATUSES.has(status) && (
          <section className="space-y-4 rounded-xl bg-[#1A1A2E] p-5 text-center">
            <h1 className="text-2xl font-bold">Ride cancelled</h1>
            <Link href="/rider" className="inline-block rounded-lg bg-[#7B5EA7] px-4 py-2 font-semibold">Book another ride</Link>
          </section>
        )}
      </div>

      {showRating && status === 'completed' && (
        <RatingModal rideId={rideId} onComplete={() => router.push('/rider/history')} onSkip={() => router.push('/rider/history')} />
      )}
    </main>
  )
}
