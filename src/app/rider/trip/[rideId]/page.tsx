'use client'

import { useEffect, useState } from 'react'
import RatingModal from '@/components/rides/RatingModal'

export default function RiderTripPage({ params }: { params: Promise<{ rideId: string }> }) {
  const [rideId, setRideId] = useState('')
  const [ride, setRide] = useState<any>(null)
  const [rated, setRated] = useState(false)

  useEffect(() => {
    params.then((p) => setRideId(p.rideId))
  }, [params])

  useEffect(() => {
    if (!rideId) return
    fetch(`/api/rides/${rideId}`).then(async (r) => setRide(await r.json())).catch(() => undefined)
  }, [rideId])

  const submitRating = async (rating: number) => {
    await fetch(`/api/rides/${rideId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, rated_by: 'rider' }),
    })
    setRated(true)
  }

  if (ride?.status !== 'completed') return <main className="p-6">Trip in progress...</main>

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Trip Complete! ✓</h1>
      <div>Total charged: ${Number(ride.final_fare ?? 0).toFixed(2)}</div>
      <div>Driver: {ride.driver_name ?? 'Your driver'}</div>
      {!rated ? (
        <RatingModal onSubmit={submitRating} driverName={ride.driver_name ?? 'your driver'} />
      ) : (
        <div className="space-y-2"><p>Thanks for riding with Rideo!</p><a className="inline-block rounded bg-purple-600 px-4 py-2 text-white" href="/rider">Back to Home</a></div>
      )}
    </main>
  )
}
