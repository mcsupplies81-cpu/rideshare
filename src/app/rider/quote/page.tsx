'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RiderMap } from '@/components/maps/RiderMap'
import { VehicleSelector } from '@/components/rides/VehicleSelector'
import { FareBreakdown } from '@/components/rides/FareBreakdown'
import type { FareQuote } from '@/types/ride'

export default function QuotePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fares, setFares] = useState<FareQuote[]>([])
  const [selectedType, setSelectedType] = useState<string>('base')

  const pickup = searchParams.get('pickup') ?? ''
  const pickupLat = Number(searchParams.get('pickupLat'))
  const pickupLng = Number(searchParams.get('pickupLng'))
  const dropoff = searchParams.get('dropoff') ?? ''
  const dropoffLat = Number(searchParams.get('dropoffLat'))
  const dropoffLng = Number(searchParams.get('dropoffLng'))

  useEffect(() => {
    const query = new URLSearchParams({ pickup_lat: String(pickupLat), pickup_lng: String(pickupLng), pickup_address: pickup, dropoff_lat: String(dropoffLat), dropoff_lng: String(dropoffLng), dropoff_address: dropoff })
    fetch(`/api/rides/quote?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const nextFares: FareQuote[] = ['base', 'smooth', 'xl'].map((type) => ({ vehicle_type: type as FareQuote['vehicle_type'], display_name: data.fares[type].display_name, fare: data.fares[type].fare, multiplier: data.fares[type].multiplier }))
        setFares(nextFares)
      })
      .finally(() => setLoading(false))
  }, [pickup, pickupLat, pickupLng, dropoff, dropoffLat, dropoffLng])

  const selectedFare = useMemo(() => fares.find((item) => item.vehicle_type === selectedType) ?? fares[0], [fares, selectedType])

  const requestRide = async () => {
    if (!selectedFare) return
    const response = await fetch('/api/rides/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup, pickupLat, pickupLng, dropoff, dropoffLat, dropoffLng, vehicle_type: selectedFare.vehicle_type, fare: selectedFare.fare }),
    })
    const data = await response.json()
    router.push(`/rider/searching?rideId=${data.ride.id}`)
  }

  if (loading) return <main className='min-h-screen bg-[#0F0F1A] p-4 text-white'>Loading quote...</main>

  return <main className='min-h-screen bg-[#0F0F1A] p-4'>
    <div className='mx-auto max-w-md space-y-4'>
      <RiderMap pickupLat={pickupLat} pickupLng={pickupLng} dropoffLat={dropoffLat} dropoffLng={dropoffLng} />
      <p className='rounded-xl bg-[#1A1A2E] p-4 text-sm text-gray-200'>{pickup} → {dropoff}</p>
      <VehicleSelector fares={fares} selected={selectedType} onSelect={setSelectedType} />
      {selectedFare ? <FareBreakdown fare={selectedFare.fare} distanceMiles={0} vehicleType={selectedFare.display_name} /> : null}
      <button type='button' onClick={requestRide} className='w-full rounded-xl bg-[#7B5EA7] py-4 font-semibold text-white'>Request Ride</button>
    </div>
  </main>
}
