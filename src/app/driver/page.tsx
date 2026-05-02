'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnlineToggle } from '@/components/driver/OnlineToggle'
import { useDriverLocation } from '@/hooks/useDriverLocation'

export default function DriverDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { startTracking, stopTracking } = useDriverLocation()
  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('Driver')
  const [summary, setSummary] = useState({ rides: 0, earnings: 0, hours: 0 })
  const [trialDays, setTrialDays] = useState<number | null>(null)
  const [canGoOnline, setCanGoOnline] = useState(true)
  const [onlineReason, setOnlineReason] = useState('')
  useEffect(() => { void (async () => { const { data: u } = await supabase.auth.getUser(); if (!u.user) return; const [{ data: userRow }, { data: driverRow }] = await Promise.all([(supabase as any).from('users').select('full_name').eq('id', u.user.id).single(), (supabase as any).from('drivers').select('is_online,trial_ends_at,stripe_connect_onboarded,approval_status').eq('id', u.user.id).single()]); setName(userRow?.full_name?.split(' ')[0] || 'Driver'); setIsOnline(!!driverRow?.is_online);
      if (!driverRow?.stripe_connect_onboarded) { setCanGoOnline(false); setOnlineReason('Connect Stripe to go online') }
      else if (driverRow?.approval_status !== 'approved') { setCanGoOnline(false); setOnlineReason('Account pending approval') }
      else { setCanGoOnline(true); setOnlineReason('') } if (driverRow?.trial_ends_at) { const d = Math.ceil((new Date(driverRow.trial_ends_at).getTime() - Date.now()) / 86400000); if (d > 0) setTrialDays(d) } const { data: rides } = await (supabase as any).from('rides').select('final_fare,created_at,status').eq('driver_id', u.user.id).gte('created_at', new Date().toISOString().slice(0,10)).eq('status','completed'); const earnings = (rides || []).reduce((a: number,r: any)=>a+Number(r.final_fare||0),0); setSummary({rides: rides?.length || 0, earnings, hours: isOnline ? 1 : 0}) })() }, [supabase,isOnline])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    void (async () => {
      const { data } = await supabase.auth.getUser(); const userId = data.user?.id; if (!userId || !isOnline) return
      channel = supabase.channel(`driver:${userId}`).on('broadcast', { event: 'ride_request' }, (payload) => {
        const data = payload.payload as { type?: string; ride?: { id?: string } }
        if (data?.type === 'ride_request' && data.ride?.id) router.push(`/driver/request/${data.ride.id}`)
      }).subscribe()
    })()
    return () => { if (channel) void supabase.removeChannel(channel) }
  }, [isOnline, router, supabase])

  async function toggle(v: boolean) {
    setLoading(true)
    const res = await fetch('/api/drivers/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_online: v }) })
    if (res.ok) { setIsOnline(v); if (v) startTracking(); else stopTracking() }
    setLoading(false)
  }

  return <main className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Good morning, {name}!</h1><span className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} /></div><OnlineToggle isOnline={isOnline} onChange={toggle} loading={loading || !canGoOnline} />{!canGoOnline ? <p className="text-sm text-amber-300">{onlineReason}</p> : null}{isOnline && <p className="flex items-center gap-2 text-green-300"><span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />Waiting for rides...</p>}{trialDays ? <div className="rounded-lg bg-purple-100 p-3 text-purple-900">First 100 Drivers — 1 MONTH FREE · {trialDays} days remaining</div> : null}<div className="rounded-lg border p-4"><h2 className="mb-2 font-semibold">Today's Summary</h2><p>Rides: {summary.rides} | Earnings: ${summary.earnings.toFixed(2)} | Hours: {summary.hours}</p></div><Link href="/driver/earnings" className="text-purple-700 underline">View Earnings</Link></main>
}
