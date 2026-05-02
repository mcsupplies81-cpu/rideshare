'use client'

import { useState } from 'react'

export function QuickActions({ defaultRegionId }: { defaultRegionId?: string }) {
  const [showSurge, setShowSurge] = useState(false)
  const [showPromo, setShowPromo] = useState(false)

  return <div className='space-y-3'>
    <div className='flex gap-2'>
      <button onClick={() => setShowSurge((v) => !v)} className='rounded bg-purple-600 px-3 py-2 text-sm'>Set Surge</button>
      <button onClick={() => setShowPromo(true)} className='rounded bg-slate-800 px-3 py-2 text-sm'>Create Promo</button>
    </div>
    {showSurge && <form action='/api/admin/surge' method='post' className='flex items-center gap-2 rounded bg-[#1A1A2E] p-3'><input type='hidden' name='region_id' value={defaultRegionId} /><input type='number' min='1' max='3' step='0.1' name='multiplier' defaultValue='1' className='rounded bg-slate-900 p-2' /><button className='rounded bg-purple-600 px-3 py-2'>Save Surge</button></form>}
    {showPromo && <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'><div className='w-full max-w-md rounded-xl bg-[#1A1A2E] p-4'><h3 className='mb-3 text-lg font-semibold'>Create Promo</h3><form action='/api/admin/promo-codes' method='post' className='space-y-2'><input name='code' placeholder='Code' className='w-full rounded bg-slate-900 p-2' /><input name='discount_percent' type='number' placeholder='Discount %' className='w-full rounded bg-slate-900 p-2' /><button className='rounded bg-purple-600 px-3 py-2'>Create</button><button type='button' onClick={() => setShowPromo(false)} className='ml-2 rounded bg-slate-700 px-3 py-2'>Close</button></form></div></div>}
  </div>
}
