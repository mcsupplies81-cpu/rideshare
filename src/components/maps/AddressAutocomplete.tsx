'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getGoogleMaps } from '@/lib/maps/client'

type Suggestion = google.maps.places.AutocompletePrediction

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string, lat: number, lng: number) => void
  placeholder: string
  className?: string
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  const bounds = useMemo(
    () => new google.maps.LatLngBounds({ lat: 32.5, lng: -117.6 }, { lat: 33.3, lng: -116.7 }),
    []
  )

  useEffect(() => setInputValue(value), [value])

  useEffect(() => {
    getGoogleMaps()
      .then((maps) => {
        autocompleteRef.current = new maps.places.AutocompleteService()
        placesServiceRef.current = new maps.places.PlacesService(document.createElement('div'))
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Maps unavailable'))
  }, [])

  const fetchSuggestions = (query: string) => {
    const service = autocompleteRef.current
    if (!service || query.trim().length < 2) {
      setSuggestions([])
      return
    }

    service.getPlacePredictions(
      {
        input: query,
        bounds,
        componentRestrictions: { country: 'us' },
      },
      (results) => {
        setSuggestions(results ?? [])
        setOpen(Boolean(results?.length))
      }
    )
  }

  const handleSelect = (prediction: Suggestion) => {
    const placesService = placesServiceRef.current
    if (!placesService) return

    placesService.getDetails(
      { placeId: prediction.place_id, fields: ['formatted_address', 'geometry'] },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) return
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address ?? prediction.description
        setInputValue(address)
        setSuggestions([])
        setOpen(false)
        onChange(address, lat, lng)
      }
    )
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <input
        value={inputValue}
        onChange={(event) => {
          const next = event.target.value
          setInputValue(next)
          fetchSuggestions(next)
        }}
        onFocus={() => setOpen(suggestions.length > 0)}
        placeholder={placeholder}
        className='w-full bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7B5EA7]'
      />
      {open && suggestions.length > 0 ? (
        <div className='absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#2A2A3E] bg-[#1A1A2E] shadow-xl'>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type='button'
              className='w-full px-4 py-3 text-left text-sm text-gray-200 hover:bg-[#2A2A3E]'
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.description}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className='mt-1 text-xs text-red-300'>{error}</p> : null}
    </div>
  )
}
