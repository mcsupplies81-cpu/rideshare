'use client'
import { useState } from 'react'

export default function QuickActions({ defaultRegionId }: { defaultRegionId: string }) {
  const [showSurge, setShowSurge] = useState(false)
  const [showPromo, setShowPromo] = useState(false)
  return <div className='space-y-3 rounded-xl bg-[#1A1A2E] p-4 text-white'>
    <div className='flex gap-2'><button onClick={() => setShowSurge((s) => !s)} className='rounded bg-purple-600 px-4 py-2'>Set Surge</button><button onClick={() => setShowPromo(true)} className='rounded bg-slate-700 px-4 py-2'>Create Promo</button></div>
    {showSurge && <form className='flex items-center gap-2' action='/api/admin/surge' method='post'><input type='hidden' name='region_id' value={defaultRegionId} /><input name='multiplier' type='number' min='1' max='3' step='0.1' defaultValue='1' className='rounded bg-slate-900 p-2' /><button className='rounded bg-purple-600 px-3 py-2'>Save</button></form>}
    {showPromo && <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'><div className='w-full max-w-md rounded-xl bg-[#1A1A2E] p-4'><h3 className='mb-3 text-lg font-semibold'>Create Promo Code</h3><form className='space-y-2' action='/api/admin/promo-codes' method='post'><input name='code' placeholder='Code' className='w-full rounded bg-slate-900 p-2' /><input name='discount_percent' type='number' min='1' max='100' placeholder='Discount %' className='w-full rounded bg-slate-900 p-2' /><div className='flex justify-end gap-2'><button type='button' onClick={() => setShowPromo(false)} className='rounded bg-slate-700 px-3 py-2'>Cancel</button><button className='rounded bg-purple-600 px-3 py-2'>Create</button></div></form></div></div>}
  </div>
}
