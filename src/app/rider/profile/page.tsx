'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RiderProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } : { data: any } = await supabase.from('users').select('full_name, phone').eq('id', data.user.id).single()
      setName(profile?.full_name ?? '')
      setPhone(profile?.phone ?? '')
    })
  }, [supabase])

  return <main className='mx-auto max-w-md space-y-4 p-4'>
    <div className='rounded-lg bg-[#1A1A2E] p-4'><p className='text-sm text-gray-400'>Name</p><p>{name || '—'}</p><p className='mt-3 text-sm text-gray-400'>Phone</p><p>{phone || '—'}</p></div>
    <div className='rounded-lg bg-[#1A1A2E] p-4'><p className='text-gray-300'>Payment Methods</p><p className='text-sm text-gray-500'>Coming soon</p></div>
    <button type='button' className='w-full rounded-lg border border-[#2A2A44] p-3' onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Sign Out</button>
  </main>
}
