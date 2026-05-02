'use client'

import { FareQuote } from '@/types/ride'

export function VehicleSelector({ fares, selected, onSelect }: { fares: FareQuote[]; selected: string; onSelect: (type: string) => void }) {
  return (
    <div className="space-y-3">
      {fares.map((fare) => (
        <button key={fare.vehicle_type} onClick={() => onSelect(fare.vehicle_type)} className={`w-full rounded-xl border p-4 text-left ${selected === fare.vehicle_type ? 'border-[#7B5EA7] bg-[#211c34]' : 'border-[#2D2D44] bg-[#1A1A2E]'}`}>
          <div className="flex items-center justify-between text-white"><span>{fare.display_name}</span><span>${fare.fare.toFixed(2)}</span></div>
          <p className="text-sm text-gray-400">4 min away</p>
        </button>
      ))}
    </div>
  )
}
