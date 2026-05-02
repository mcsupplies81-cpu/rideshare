'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RiderProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('full_name,phone').eq('id', user.id).single()
      setName(data?.full_name ?? 'Unknown')
      setPhone(data?.phone ?? 'Not set')
    }
    void load()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return <main className="space-y-4 p-4 text-white"><div className="rounded-xl bg-[#1A1A2E] p-4"><p>{name}</p><p className="text-gray-400">{phone}</p></div><div className="rounded-xl bg-[#1A1A2E] p-4"><p className="font-semibold">Payment Methods</p><p className="text-gray-400">Coming soon</p></div><button onClick={signOut} className="w-full rounded-xl bg-[#7B5EA7] py-3">Sign Out</button></main>
}
