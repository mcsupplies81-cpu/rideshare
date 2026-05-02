'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Coords = { lat: number | null; lng: number | null }

let latestCoords: Coords = { lat: null, lng: null }
const listeners = new Set<(coords: Coords) => void>()

function publish(coords: Coords) {
  latestCoords = coords
  listeners.forEach((listener) => listener(coords))
}

export function useDriverLocation() {
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const locationRef = useRef<Coords>({ lat: null, lng: null })

  const sendLocation = useCallback(async () => {
    const { lat, lng } = locationRef.current
    if (lat === null || lng === null) return
    await fetch('/api/drivers/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })
  }, [])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    watchIdRef.current = null
    intervalRef.current = null
  }, [])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        locationRef.current = coords
        publish(coords)
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )

    intervalRef.current = window.setInterval(() => {
      void sendLocation()
    }, 5000)
  }, [sendLocation])

  useEffect(() => () => stopTracking(), [stopTracking])

  return { startTracking, stopTracking, locationRef }
}

export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coords>(latestCoords)

  useEffect(() => {
    listeners.add(setCoords)
    return () => {
      listeners.delete(setCoords)
    }
  }, [])

  return coords
}
