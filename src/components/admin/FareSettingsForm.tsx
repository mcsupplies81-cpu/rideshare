'use client'

import { useState } from 'react'

type Props = {
  initialFare: { base_fare: number; per_mile_rate: number; minimum_fare: number }
  onSave: (values: { base_fare: number; per_mile_rate: number; minimum_fare: number }) => Promise<void>
}

export function FareSettingsForm({ initialFare, onSave }: Props) {
  const [values, setValues] = useState(initialFare)

  return (
    <form
      className="space-y-3"
      onSubmit={async e => {
        e.preventDefault()
        await onSave(values)
      }}
    >
      {Object.entries(values).map(([key, value]) => (
        <label key={key} className="block text-sm text-slate-200">
          {key}
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2"
            value={value}
            onChange={e => setValues(v => ({ ...v, [key]: Number(e.target.value) }))}
          />
        </label>
      ))}
      <button className="rounded bg-purple-600 px-4 py-2 text-white">Save Fare Settings</button>
    </form>
  )
}
