'use client'

import { useEffect, useRef } from 'react'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

export function AddressAutocomplete({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (place: { address: string; lat: number; lng: number }) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { loaded } = useGoogleMaps()

  useEffect(() => {
    if (!loaded || !inputRef.current || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || !window.google?.maps?.places) return

    const bounds = new window.google.maps.LatLngBounds(
      { lat: 32.53, lng: -117.28 },
      { lat: 33.11, lng: -116.93 }
    )

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      bounds,
      strictBounds: true,
      fields: ['formatted_address', 'geometry'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const location = place.geometry?.location
      if (!location) return
      onChange({ address: place.formatted_address ?? inputRef.current?.value ?? '', lat: location.lat(), lng: location.lng() })
    })
  }, [loaded, onChange])

  return <input ref={inputRef} defaultValue={value} placeholder={placeholder} className="w-full rounded-xl border border-[#2D2D44] bg-[#1A1A2E] px-4 py-3 text-white placeholder:text-gray-400" />
}
