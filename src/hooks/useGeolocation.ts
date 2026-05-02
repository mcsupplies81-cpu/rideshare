'use client'

import { useEffect, useState } from 'react'

const SAN_DIEGO_DEFAULT = { lat: 32.7157, lng: -117.1611 }

export function useGeolocation(): { lat: number | null; lng: number | null; loading: boolean; error: string | null } {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      setLat(SAN_DIEGO_DEFAULT.lat)
      setLng(SAN_DIEGO_DEFAULT.lng)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setLoading(false)
      },
      (geoError) => {
        setError(geoError.message)
        setLat(SAN_DIEGO_DEFAULT.lat)
        setLng(SAN_DIEGO_DEFAULT.lng)
        setLoading(false)
      }
    )
  }, [])

  return { lat, lng, loading, error }
}
