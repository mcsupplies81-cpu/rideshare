'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useDriverLocation() {
  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    watchIdRef.current = null
    setIsTracking(false)
  }, [])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        await fetch('/api/drivers/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
          }),
        })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )
    setIsTracking(true)
  }, [])

  useEffect(() => () => stopTracking(), [stopTracking])

  return { startTracking, stopTracking, isTracking }
}
