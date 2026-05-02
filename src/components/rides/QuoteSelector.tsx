'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FareQuote } from '@/types/ride'
import { VehicleSelector } from '@/components/rides/VehicleSelector'

export function QuoteSelector({ fares, params }: { fares: FareQuote[]; params: Record<string, string> }) {
  const router = useRouter()
  const [selected, setSelected] = useState('base')
  const chosen = useMemo(() => fares.find((f) => f.vehicle_type === selected) ?? fares[0], [fares, selected])

  const confirm = () => {
    const search = new URLSearchParams({ ...params, vehicle_type: chosen.vehicle_type, estimated_fare: String(chosen.fare) })
    router.push(`/rider/searching?${search.toString()}`)
  }

  return <div className="space-y-4"><VehicleSelector fares={fares} selected={selected} onSelect={setSelected} /><button onClick={confirm} className="w-full rounded-xl bg-[#7B5EA7] py-3 font-semibold text-white">Confirm Ride ${chosen.fare.toFixed(2)}</button></div>
}
