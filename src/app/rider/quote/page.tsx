'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RiderMap } from '@/components/maps/RiderMap'
import { VehicleSelector } from '@/components/rides/VehicleSelector'
import { FareBreakdown } from '@/components/rides/FareBreakdown'
import type { FareQuote } from '@/types/ride'

type PromoInfo = { promoCode: string; discountAmount: number; discountedFare: number }

export default function QuotePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fares, setFares] = useState<(FareQuote & PromoInfo)[]>([])
  const [selectedType, setSelectedType] = useState<string>('base')
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')

  const pickup = searchParams.get('pickup') ?? ''
  const pickupLat = Number(searchParams.get('pickupLat'))
  const pickupLng = Number(searchParams.get('pickupLng'))
  const dropoff = searchParams.get('dropoff') ?? ''
  const dropoffLat = Number(searchParams.get('dropoffLat'))
  const dropoffLng = Number(searchParams.get('dropoffLng'))

  const loadQuote = async (nextPromoCode?: string) => {
    setLoading(true)
    setPromoError('')
    const response = await fetch('/api/rides/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup_lat: pickupLat, pickup_lng: pickupLng, dropoff_lat: dropoffLat, dropoff_lng: dropoffLng, promoCode: nextPromoCode ?? promoCode }),
    })
    const data = await response.json()
    if (!response.ok) {
      setPromoError(data.error ?? 'Unable to apply promo code')
      setLoading(false)
      return
    }

    const nextFares = ['base', 'smooth', 'xl'].map((type) => ({
      vehicle_type: type as FareQuote['vehicle_type'],
      display_name: data.fares[type].display_name,
      fare: data.fares[type].fare,
      multiplier: data.fares[type].multiplier,
      promoCode: data.fares[type].promoCode,
      discountAmount: data.fares[type].discountAmount,
      discountedFare: data.fares[type].discountedFare,
    }))
    setFares(nextFares)
    setLoading(false)
  }

  useEffect(() => { void loadQuote() }, [pickupLat, pickupLng, dropoffLat, dropoffLng])

  const selectedFare = useMemo(() => fares.find((item) => item.vehicle_type === selectedType) ?? fares[0], [fares, selectedType])

  const requestRide = async () => {
    if (!selectedFare) return
    const response = await fetch('/api/rides/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickup_address: pickup,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        dropoff_address: dropoff,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
        vehicle_type: selectedFare.vehicle_type,
        estimated_fare: selectedFare.discountedFare,
        estimated_miles: 0,
        estimated_minutes: 0,
        promoCode: selectedFare.promoCode,
      }),
    })
    const data = await response.json()
    router.push(`/rider/searching?rideId=${data.ride_id}`)
  }

  if (loading) return <main className='min-h-screen bg-[#0F0F1A] p-4 text-white'>Loading quote...</main>

  return <main className='min-h-screen bg-[#0F0F1A] p-4'>
    <div className='mx-auto max-w-md space-y-4'>
      <RiderMap pickupLat={pickupLat} pickupLng={pickupLng} dropoffLat={dropoffLat} dropoffLng={dropoffLng} />
      <p className='rounded-xl bg-[#1A1A2E] p-4 text-sm text-gray-200'>{pickup} → {dropoff}</p>
      <VehicleSelector fares={fares} selected={selectedType} onSelect={setSelectedType} />
      <div className='rounded-xl bg-[#1A1A2E] p-4'>
        <label className='mb-2 block text-sm text-gray-300'>Promo code</label>
        <div className='flex gap-2'>
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className='w-full rounded bg-slate-900 p-2 text-white' />
          <button type='button' onClick={() => void loadQuote(promoCode)} className='rounded bg-slate-700 px-4'>Apply</button>
        </div>
        {promoError ? <p className='mt-2 text-sm text-red-400'>{promoError}</p> : null}
      </div>
      {selectedFare ? <>
        <FareBreakdown fare={selectedFare.discountedFare} distanceMiles={0} vehicleType={selectedFare.display_name} />
        {selectedFare.discountAmount > 0 ? <p className='text-sm text-green-400'>Discount: -${selectedFare.discountAmount.toFixed(2)} ({selectedFare.promoCode})</p> : null}
      </> : null}
      <button type='button' onClick={requestRide} className='w-full rounded-xl bg-[#7B5EA7] py-4 font-semibold text-white'>Request Ride</button>
    </div>
  </main>
}
