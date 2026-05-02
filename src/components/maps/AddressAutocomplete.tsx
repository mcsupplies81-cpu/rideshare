'use client'

import { useEffect, useRef } from 'react'
import { loadGoogleMaps } from '@/lib/maps/client'

type Place = { address: string; lat: number; lng: number }

export function AddressAutocomplete({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (place: Place) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let mounted = true
    const bounds = new google.maps.LatLngBounds(
      { lat: 32.53, lng: -117.28 },
      { lat: 33.11, lng: -116.93 }
    )

    loadGoogleMaps().then(() => {
      if (!mounted || !inputRef.current) return
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        bounds,
        strictBounds: true,
        fields: ['formatted_address', 'geometry'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        const lat = place.geometry?.location?.lat()
        const lng = place.geometry?.location?.lng()
        const address = place.formatted_address
        if (!lat || !lng || !address) return
        onChange({ address, lat, lng })
      })
    }).catch(() => {})

    return () => {
      mounted = false
    }
  }, [onChange])

  return <input ref={inputRef} value={value} placeholder={placeholder} onChange={(event) => {
        const value = event.target.value
        onChange({ address: value, lat: 0, lng: 0 })
      }} className='w-full rounded-lg border border-[#2A2A44] bg-[#1A1A2E] p-3 text-white placeholder:text-gray-400 focus:border-[#7B5EA7] focus:outline-none' />
}
