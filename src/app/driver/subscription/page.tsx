'use client'

import { useEffect, useState } from 'react'

export default function DriverSubscriptionPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/subscriptions').then(async (r) => setData(await r.json()))
  }, [])

  const isPro = data?.current_plan === 'pro'

  const handleAction = async () => {
    const endpoint = isPro ? '/api/subscriptions/portal' : '/api/subscriptions/checkout'
    const res = await fetch(endpoint, { method: 'POST' })
    const body = await res.json()
    window.location.href = body.portal_url ?? body.checkout_url
  }

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Subscription</h1>
      <div>Current plan: <strong>{data?.current_plan ?? 'per_ride'}</strong> ({data?.subscription?.status ?? 'active'})</div>
      {data?.current_plan === 'trial' ? <div>{data?.trial_days_remaining} days remaining</div> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded border p-4 ${data?.current_plan !== 'trial' ? 'opacity-50' : ''}`}>Free Trial<br />First 30 days free</div>
        <div className="rounded border p-4">Pay Per Ride<br />$2.99 per completed ride · No monthly commitment</div>
        <div className="rounded border p-4"> <span className="rounded bg-purple-600 px-2 py-1 text-xs text-white">BEST VALUE</span><div>Pro — $69/mo</div><div>Unlimited rides · Best for active drivers · Break-even: 23 rides/month</div></div>
      </div>
      <button className="rounded bg-purple-600 px-4 py-2 text-white" onClick={handleAction}>{isPro ? 'Manage Subscription' : 'Upgrade to Pro'}</button>
    </main>
  )
}
