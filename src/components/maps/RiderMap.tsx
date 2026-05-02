'use client'

import { useEffect, useRef, useState } from 'react'
import { getGoogleMaps } from '@/lib/maps/client'

const SAN_DIEGO_CENTER = { lat: 32.7157, lng: -117.1611 }

interface RiderMapProps {
  pickupLat?: number
  pickupLng?: number
  dropoffLat?: number
  dropoffLng?: number
}

export function RiderMap({ pickupLat, pickupLng, dropoffLat, dropoffLng }: RiderMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const hasApiKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  useEffect(() => {
    if (!hasApiKey || !mapNodeRef.current) {
      setLoading(false)
      return
    }

    let renderer: google.maps.DirectionsRenderer | null = null
    let pickupMarker: google.maps.Marker | null = null
    let dropoffMarker: google.maps.Marker | null = null

    getGoogleMaps().then((maps) => {
      if (!mapNodeRef.current) return
      const center = pickupLat !== undefined && pickupLng !== undefined ? { lat: pickupLat, lng: pickupLng } : SAN_DIEGO_CENTER
      const map = new maps.Map(mapNodeRef.current, { center, zoom: 12, disableDefaultUI: true })

      if (pickupLat !== undefined && pickupLng !== undefined) {
        pickupMarker = new maps.Marker({ map, position: { lat: pickupLat, lng: pickupLng }, icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png' })
      }

      if (dropoffLat !== undefined && dropoffLng !== undefined) {
        dropoffMarker = new maps.Marker({ map, position: { lat: dropoffLat, lng: dropoffLng }, icon: 'http://maps.google.com/mapfiles/ms/icons/grey-dot.png' })
      }

      if (pickupLat !== undefined && pickupLng !== undefined && dropoffLat !== undefined && dropoffLng !== undefined) {
        const directionsService = new maps.DirectionsService()
        renderer = new maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#7B5EA7', strokeWeight: 5 } })
        directionsService.route(
          {
            origin: { lat: pickupLat, lng: pickupLng },
            destination: { lat: dropoffLat, lng: dropoffLng },
            travelMode: maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === maps.DirectionsStatus.OK && result) renderer?.setDirections(result)
          }
        )
      }
      setLoading(false)
    }).catch(() => setLoading(false))

    return () => {
      pickupMarker?.setMap(null)
      dropoffMarker?.setMap(null)
      renderer?.setMap(null)
    }
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, hasApiKey])

  if (!hasApiKey) return <div className='h-[300px] w-full rounded-2xl bg-[#1A1A2E] text-gray-300 flex items-center justify-center'>Map unavailable</div>
  if (loading) return <div className='h-[300px] w-full animate-pulse rounded-2xl bg-[#1A1A2E]' />
  return <div ref={mapNodeRef} className='h-[300px] w-full rounded-2xl' />
}
