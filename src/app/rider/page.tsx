'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddressAutocomplete } from '@/components/maps/AddressAutocomplete'
import { RiderMap } from '@/components/maps/RiderMap'
import { useGeolocation } from '@/hooks/useGeolocation'

export default function RiderPage() {
  const router = useRouter()
  const { coords } = useGeolocation()
  const [pickup, setPickup] = useState<{ address: string; lat: number; lng: number } | null>(null)
  const [dropoff, setDropoff] = useState<{ address: string; lat: number; lng: number } | null>(null)
  const [pickupText, setPickupText] = useState('Current Location')
  const [dropoffText, setDropoffText] = useState('')

  useEffect(() => {
    if (!coords) return
    setPickup((current) => current ?? { address: 'Current Location', lat: coords.lat, lng: coords.lng })
  }, [coords])

  const canQuote = Boolean(pickup && dropoff)
  const query = useMemo(() => {
    if (!pickup || !dropoff) return ''
    const params = new URLSearchParams({ pickup_lat: String(pickup.lat), pickup_lng: String(pickup.lng), pickup_address: pickup.address, dropoff_lat: String(dropoff.lat), dropoff_lng: String(dropoff.lng), dropoff_address: dropoff.address })
    return params.toString()
  }, [pickup, dropoff])

  return <main className='mx-auto max-w-md space-y-4 p-4'>
    <RiderMap pickup={pickup ?? undefined} dropoff={dropoff ?? undefined} />
    <div className='space-y-3'>
      <AddressAutocomplete placeholder='Pickup' value={pickupText} onChange={(place) => { setPickup(place); setPickupText(place.address) }} />
      <AddressAutocomplete placeholder='Dropoff' value={dropoffText} onChange={(place) => { setDropoff(place); setDropoffText(place.address) }} />
    </div>
    {canQuote ? <button type='button' onClick={() => router.push(`/rider/quote?${query}`)} className='w-full rounded-lg bg-[#7B5EA7] p-3 font-semibold text-white'>Get Quote →</button> : null}
  </main>
}
