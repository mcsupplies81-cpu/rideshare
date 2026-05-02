'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RiderMap } from '@/components/maps/RiderMap'
import { AddressAutocomplete } from '@/components/maps/AddressAutocomplete'
import { useGeolocation } from '@/hooks/useGeolocation'

export default function RiderHomePage() {
  const router = useRouter()
  const { coords } = useGeolocation()
  const [pickup, setPickup] = useState<{ address: string; lat: number; lng: number } | null>(null)
  const [dropoff, setDropoff] = useState<{ address: string; lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (coords && !pickup) setPickup({ address: 'Current Location', lat: coords.lat, lng: coords.lng })
  }, [coords, pickup])

  const goQuote = () => {
    if (!pickup || !dropoff) return
    const params = new URLSearchParams({
      pickup_lat: String(pickup.lat), pickup_lng: String(pickup.lng), pickup_address: pickup.address,
      dropoff_lat: String(dropoff.lat), dropoff_lng: String(dropoff.lng), dropoff_address: dropoff.address,
    })
    router.push(`/rider/quote?${params.toString()}`)
  }

  return <main className="mx-auto max-w-md space-y-4 p-4"><RiderMap pickup={pickup ?? undefined} dropoff={dropoff ?? undefined} /><AddressAutocomplete placeholder="Pickup" value={pickup?.address ?? 'Current Location'} onChange={setPickup} /><AddressAutocomplete placeholder="Dropoff" value={dropoff?.address ?? ''} onChange={setDropoff} />{pickup && dropoff && <button onClick={goQuote} className="w-full rounded-xl bg-[#7B5EA7] py-3 font-semibold">Get Quote →</button>}</main>
}
