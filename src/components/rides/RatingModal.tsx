'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

export default function RatingModal({ onSubmit, driverName }: { onSubmit: (rating: number) => void; driverName: string }) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <h3 className="text-lg font-semibold">Rate {driverName}</h3>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, idx) => {
          const value = idx + 1
          const active = value <= (hovered || selected)
          return (
            <button key={value} onMouseEnter={() => setHovered(value)} onMouseLeave={() => setHovered(0)} onClick={() => setSelected(value)}>
              <Star className={active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} />
            </button>
          )
        })}
      </div>
      <button className="rounded bg-purple-600 px-3 py-2 text-white" disabled={!selected} onClick={() => onSubmit(selected)}>
        Submit Rating
      </button>
    </div>
  )
}
