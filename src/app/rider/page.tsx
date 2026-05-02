'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/shared/AuthGuard'
import { AddressAutocomplete } from '@/components/maps/AddressAutocomplete'
import { RiderMap } from '@/components/maps/RiderMap'
import { useGeolocation } from '@/hooks/useGeolocation'

export default function RiderPage() {
  const router = useRouter()
  const { lat, lng } = useGeolocation()
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLat, setPickupLat] = useState<number | null>(null)
  const [pickupLng, setPickupLng] = useState<number | null>(null)
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [dropoffLat, setDropoffLat] = useState<number | null>(null)
  const [dropoffLng, setDropoffLng] = useState<number | null>(null)

  useEffect(() => {
    if (lat === null || lng === null || pickupLat !== null || pickupLng !== null) return
    setPickupLat(lat)
    setPickupLng(lng)
    setPickupAddress('Current location')
  }, [lat, lng, pickupLat, pickupLng])

  const canQuote = pickupLat !== null && pickupLng !== null && dropoffLat !== null && dropoffLng !== null

  const quoteQuery = useMemo(() => {
    if (!canQuote) return ''
    return new URLSearchParams({
      pickup: pickupAddress,
      pickupLat: String(pickupLat),
      pickupLng: String(pickupLng),
      dropoff: dropoffAddress,
      dropoffLat: String(dropoffLat),
      dropoffLng: String(dropoffLng),
    }).toString()
  }, [canQuote, pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng])

  return <AuthGuard requiredRole='rider'>
    <main className='min-h-screen bg-[#0F0F1A] p-4'>
      <div className='mx-auto max-w-md space-y-4'>
        <RiderMap pickupLat={pickupLat ?? undefined} pickupLng={pickupLng ?? undefined} dropoffLat={dropoffLat ?? undefined} dropoffLng={dropoffLng ?? undefined} />
        <AddressAutocomplete value={pickupAddress} placeholder='Pickup address' onChange={(v, la, ln) => {
          setPickupAddress(v)
          setPickupLat(la)
          setPickupLng(ln)
        }} />
        <AddressAutocomplete value={dropoffAddress} placeholder='Dropoff address' onChange={(v, la, ln) => {
          setDropoffAddress(v)
          setDropoffLat(la)
          setDropoffLng(ln)
        }} />
        <button disabled={!canQuote} onClick={() => router.push(`/rider/quote?${quoteQuery}`)} className='w-full rounded-xl bg-[#7B5EA7] py-4 font-semibold text-white disabled:opacity-50'>Get Quote</button>
      </div>
    </main>
  </AuthGuard>
}
