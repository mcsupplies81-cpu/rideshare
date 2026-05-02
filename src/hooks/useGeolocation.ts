'use client'

import { useEffect, useState } from 'react'

export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
  }, [])

  return { coords, loading, error }
}
