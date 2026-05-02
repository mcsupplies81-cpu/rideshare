'use client'

import { useEffect, useState } from 'react'
import { loadGoogleMaps } from '@/lib/maps/client'

export function useGoogleMaps(): { loaded: boolean; error: string | null } {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    loadGoogleMaps()
      .then(() => {
        if (!active) return
        setLoaded(true)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps')
      })

    return () => {
      active = false
    }
  }, [])

  return { loaded, error }
}
