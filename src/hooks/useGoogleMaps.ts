'use client'

import { useEffect, useState } from 'react'
import { loadGoogleMaps } from '@/lib/maps/client'

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadGoogleMaps().then(() => setLoaded(true))
  }, [])

  return { loaded }
}
