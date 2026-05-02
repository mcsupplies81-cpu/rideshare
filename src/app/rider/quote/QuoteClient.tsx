'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { VehicleSelector } from '@/components/rides/VehicleSelector'
import type { FareQuote } from '@/types/ride'

export function QuoteClient({ fares, queryParams }: { fares: FareQuote[]; queryParams: Record<string, string> }) {
  const router = useRouter()
  const [selected, setSelected] = useState('base')

  const selectedFare = useMemo(() => fares.find((fare) => fare.vehicle_type === selected) ?? fares[0], [fares, selected])

  return (
    <>
      <VehicleSelector fares={fares} selected={selected} onSelect={setSelected} />
      <button
        type='button'
        className='w-full rounded-lg bg-[#7B5EA7] p-3 font-semibold text-white'
        onClick={() => {
          const params = new URLSearchParams({ ...queryParams, vehicle_type: selectedFare.vehicle_type, estimated_fare: selectedFare.fare.toFixed(2) })
          router.push(`/rider/searching?${params.toString()}`)
        }}
      >
        Confirm Ride ${selectedFare.fare.toFixed(2)}
      </button>
    </>
  )
}
