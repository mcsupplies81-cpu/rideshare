'use client'

import { useEffect, useRef } from 'react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

export function RiderMap({
  pickup,
  dropoff,
  className,
}: {
  pickup?: { lat: number; lng: number }
  dropoff?: { lat: number; lng: number }
  className?: string
}) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const { loaded } = useGoogleMaps()

  useEffect(() => {
    if (!loaded || !mapRef.current || !window.google?.maps || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return

    const center = pickup ?? { lat: 32.7157, lng: -117.1611 }
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      styles: [{ elementType: 'geometry', stylers: [{ color: '#242f3e' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] }],
    })

    if (pickup) new window.google.maps.Marker({ position: pickup, map, icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png' })
    if (dropoff) new window.google.maps.Marker({ position: dropoff, map, icon: 'http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png' })
  }, [loaded, pickup, dropoff])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return <div className={`flex min-h-[50vh] w-full items-center justify-center rounded-2xl bg-[#1A1A2E] text-gray-300 ${className ?? ''}`}>Map loading...</div>
  }

  return <div ref={mapRef} className={`min-h-[50vh] w-full rounded-2xl ${className ?? ''}`} />
}
