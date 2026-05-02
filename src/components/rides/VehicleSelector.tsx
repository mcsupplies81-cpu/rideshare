'use client'

import type { FareQuote } from '@/types/ride'

export function VehicleSelector({ fares, selected, onSelect }: { fares: FareQuote[]; selected: string; onSelect: (type: string) => void }) {
  return (
    <div className='space-y-3'>
      {fares.map((fare) => (
        <button key={fare.vehicle_type} type='button' onClick={() => onSelect(fare.vehicle_type)} className={`w-full rounded-lg border bg-[#1A1A2E] p-4 text-left ${selected === fare.vehicle_type ? 'border-[#7B5EA7]' : 'border-[#2A2A44]'}`}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium text-white'>{fare.display_name}</p>
              <p className='text-sm text-gray-400'>4 min away</p>
            </div>
            <p className='text-lg font-semibold text-white'>${fare.fare.toFixed(2)}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
