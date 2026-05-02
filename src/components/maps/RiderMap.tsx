'use client'

import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '@/lib/maps/client'

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0F0F1A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e8ea0' }] },
]

export function RiderMap({ pickup, dropoff, className }: { pickup?: { lat: number; lng: number }; dropoff?: { lat: number; lng: number }; className?: string }) {
  const mapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return
    let pickupMarker: google.maps.Marker | null = null
    let dropoffMarker: google.maps.Marker | null = null

    loadGoogleMaps().then(() => {
      if (!mapRef.current) return
      const center = pickup ?? { lat: 32.7157, lng: -117.1611 }
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
      })

      if (pickup) {
        pickupMarker = new google.maps.Marker({ position: pickup, map, icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png' })
      }
      if (dropoff) {
        dropoffMarker = new google.maps.Marker({ position: dropoff, map, icon: 'http://maps.google.com/mapfiles/ms/icons/grey-dot.png' })
      }
    }).catch(() => {})

    return () => {
      pickupMarker?.setMap(null)
      dropoffMarker?.setMap(null)
    }
  }, [pickup, dropoff])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return <div className={`flex min-h-[50vh] w-full items-center justify-center rounded-lg bg-[#1A1A2E] text-gray-300 ${className ?? ''}`}>Map loading...</div>
  }

  return <div ref={mapRef} className={`min-h-[50vh] w-full rounded-lg ${className ?? ''}`} />
}
