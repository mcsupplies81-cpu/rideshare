'use client'

import { useEffect, useRef } from 'react'
import { getGoogleMaps } from '@/lib/maps/client'

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [{"elementType":"geometry","stylers":[{"color":"#1A1A2E"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#9CA3AF"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#2A2A3E"}]},{"featureType":"water","stylers":[{"color":"#0F0F1A"}]}]

export function TripMap({ pickupLat, pickupLng, dropoffLat, dropoffLng, driverLat, driverLng }: { pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number; driverLat?: number; driverLng?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || !ref.current) return
    getGoogleMaps().then((maps) => {
      if (!ref.current) return
      const map = new maps.Map(ref.current, { center: { lat: pickupLat, lng: pickupLng }, zoom: 12, styles: DARK_MAP_STYLE, disableDefaultUI: true })
      const bounds = new maps.LatLngBounds()
      bounds.extend({ lat: pickupLat, lng: pickupLng })
      bounds.extend({ lat: dropoffLat, lng: dropoffLng })
      map.fitBounds(bounds)
      new maps.Polyline({ map, path: [{ lat: pickupLat, lng: pickupLng }, { lat: dropoffLat, lng: dropoffLng }], strokeColor: '#7B5EA7', strokeWeight: 5 })
      new maps.Marker({ map, position: { lat: pickupLat, lng: pickupLng } })
      new maps.Marker({ map, position: { lat: dropoffLat, lng: dropoffLng }, icon: 'http://maps.google.com/mapfiles/ms/icons/grey-dot.png' })
      if (driverLat !== undefined && driverLng !== undefined) {
        new maps.Marker({ map, position: { lat: driverLat, lng: driverLng }, icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png' })
      }
    }).catch(() => {})
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, driverLat, driverLng])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return <div className='h-[300px] w-full rounded-2xl bg-[#1A1A2E]' />
  return <div ref={ref} className='h-[300px] w-full rounded-2xl' />
}
