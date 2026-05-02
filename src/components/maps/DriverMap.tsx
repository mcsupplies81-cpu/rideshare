'use client'

import { useEffect, useRef } from 'react'
import { getGoogleMaps } from '@/lib/maps/client'

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [{"elementType":"geometry","stylers":[{"color":"#1A1A2E"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#9CA3AF"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#2A2A3E"}]},{"featureType":"water","stylers":[{"color":"#0F0F1A"}]}]

export function DriverMap({ driverLat, driverLng, pickupLat, pickupLng }: { driverLat: number; driverLng: number; pickupLat?: number; pickupLng?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || !ref.current) return
    let renderer: google.maps.DirectionsRenderer | null = null
    getGoogleMaps().then((maps) => {
      if (!ref.current) return
      const map = new maps.Map(ref.current, { center: { lat: driverLat, lng: driverLng }, zoom: 13, styles: DARK_MAP_STYLE, disableDefaultUI: true })
      new maps.Marker({ map, position: { lat: driverLat, lng: driverLng }, icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png' })
      if (pickupLat !== undefined && pickupLng !== undefined) {
        new maps.Marker({ map, position: { lat: pickupLat, lng: pickupLng } })
        renderer = new maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#7B5EA7', strokeWeight: 5 } })
        new maps.DirectionsService().route({ origin: { lat: driverLat, lng: driverLng }, destination: { lat: pickupLat, lng: pickupLng }, travelMode: maps.TravelMode.DRIVING }, (res, status) => {
          if (status === maps.DirectionsStatus.OK && res) renderer?.setDirections(res)
        })
      }
    }).catch(() => {})

    return () => renderer?.setMap(null)
  }, [driverLat, driverLng, pickupLat, pickupLng])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return <div className='h-[250px] w-full rounded-2xl bg-[#1A1A2E]' />
  return <div ref={ref} className='h-[250px] w-full rounded-2xl' />
}
