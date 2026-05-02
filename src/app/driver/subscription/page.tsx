import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DriverSubscriptionPage() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id

  if (!userId) redirect('/login')

  const [{ data: activePlan }, { data: subscription }, { data: driver }] = await Promise.all([
    serviceSupabase
      .from('driver_plans')
      .select('plan_type,is_active,stripe_subscription_id')
      .eq('driver_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .maybeSingle(),
    (serviceSupabase as any)
      .from('subscriptions')
      .select('status,stripe_subscription_id')
      .eq('driver_id', userId)
      .order('updated_at', { ascending: false })
      .maybeSingle(),
    serviceSupabase.from('drivers').select('trial_ends_at,stripe_connect_onboarded').eq('id', userId).single(),
  ])

  const currentPlan = activePlan?.plan_type ?? 'per_ride'
  const trialEndsAt = driver?.trial_ends_at
  const trialDaysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0
  const isTrial = currentPlan === 'trial' && trialDaysRemaining > 0
  const isPro = currentPlan === 'pro' && Boolean(activePlan?.stripe_subscription_id)

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-white">Subscription</h1>
      <p className="text-[#B2A6CC]">Current plan: <span className="capitalize text-white">{currentPlan.replace('_', ' ')}</span></p>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[#2A2540] bg-[#121024] p-4 text-white">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="font-semibold">Trial</h2>
            {isTrial ? <span className="rounded bg-purple-600 px-2 py-0.5 text-xs">Active</span> : null}
          </div>
          <p className="text-sm text-[#B2A6CC]">Free</p>
          <p className="mt-1 text-sm text-[#B2A6CC]">{isTrial ? `${trialDaysRemaining} days remaining` : 'No active trial'}</p>
        </div>

        <div className="rounded-xl border border-[#2A2540] bg-[#121024] p-4 text-white">
          <h2 className="font-semibold">Per Ride</h2>
          <p className="text-sm text-[#B2A6CC]">$2.99 / ride</p>
          {!activePlan || currentPlan === 'per_ride' ? <p className="mt-1 text-xs text-purple-300">Default plan</p> : null}
        </div>

        <div className="rounded-xl border border-[#2A2540] bg-[#121024] p-4 text-white">
          <h2 className="font-semibold">Pro</h2>
          <p className="text-sm text-[#B2A6CC]">$69 / month</p>
          <form action={isPro ? '/api/subscriptions/portal' : '/api/subscriptions/checkout'} method="POST" className="mt-3">
            <button className="rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white" type="submit">
              {isPro ? 'Manage' : 'Subscribe'}
            </button>
          </form>
          {subscription?.status ? <p className="mt-2 text-xs text-[#B2A6CC]">Subscription status: {subscription.status}</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-[#2A2540] bg-[#121024] p-4 text-white">
        <h2 className="mb-2 text-lg font-semibold">Stripe Connect</h2>
        <p className="text-sm text-[#B2A6CC]">Status: {driver?.stripe_connect_onboarded ? 'Connected' : 'Not connected'}</p>
        {!driver?.stripe_connect_onboarded ? (
          <form action="/api/connect/onboard" method="POST" className="mt-3">
            <button type="submit" className="rounded bg-purple-600 px-3 py-2 text-sm font-medium">Connect Stripe</button>
          </form>
        ) : null}
      </section>
    </main>
  )
}
