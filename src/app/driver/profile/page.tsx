import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { CopyButton } from '@/components/driver/CopyButton'

function makeReferralCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default async function ProfilePage() {
  const supabase = await createServiceClient() as any
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  const [{ data: profile }, { data: vehicle }, { data: driver }, { data: plan }] = await Promise.all([
    supabase.from('users').select('full_name,phone').eq('id', user.id).single(),
    supabase.from('vehicles').select('make,model,year,license_plate').eq('driver_id', user.id).maybeSingle(),
    supabase.from('drivers').select('stripe_connect_account_id').eq('id', user.id).maybeSingle(),
    supabase.from('driver_plans').select('plan_type').eq('driver_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  let { data: referralCode } = await supabase.from('referral_codes').select('id,code').eq('driver_id', user.id).maybeSingle()
  if (!referralCode) {
    for (let i = 0; i < 5; i++) {
      const code = makeReferralCode(8)
      const { data, error } = await supabase.from('referral_codes').insert({ driver_id: user.id, code }).select('id,code').single()
      if (!error) {
        referralCode = data
        break
      }
    }
  }

  let referralCount = 0
  if (referralCode?.id) {
    const { count } = await supabase.from('referral_events').select('*', { count: 'exact', head: true }).eq('referral_code_id', referralCode.id)
    referralCount = count ?? 0
  }

  const { count: completedRideCount } = await supabase.from('rides').select('*', { count: 'exact', head: true }).eq('driver_id', user.id).eq('status', 'completed')

  const stripeConnected = Boolean(driver?.stripe_connect_account_id)

  return (
    <main className='space-y-4'>
      <h1 className='text-2xl font-semibold'>Account</h1>
      <p>{profile?.full_name}</p>
      <p>{profile?.phone}</p>
      {vehicle && <p>{vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.license_plate}</p>}

      <section className='rounded border p-3'>
        <p className='mb-2 text-sm font-medium'>Referral code</p>
        <div className='flex items-center gap-2'>
          <code className='rounded bg-gray-100 px-2 py-1'>{referralCode?.code ?? 'Not available'}</code>
          {referralCode?.code && <CopyButton value={referralCode.code} />}
        </div>
        <p className='mt-2 text-sm text-gray-600'>{referralCount} drivers referred</p>
      </section>

      {(completedRideCount ?? 0) === 0 && (
        <section className='rounded border p-3'>
          <p className='mb-2 text-sm font-medium'>Enter referral code</p>
          <p className='mb-2 text-xs text-gray-500'>Apply referral codes from onboarding or via the API.</p>
          <form action='/driver/onboarding/profile' className='flex gap-2'>
            <input name='code' className='rounded border px-3 py-2 text-sm' placeholder='Referral code' />
            <button className='rounded bg-black px-3 py-2 text-sm text-white'>Save for onboarding</button>
          </form>
        </section>
      )}

      <section className='rounded border p-3 text-sm'>
        <p>Stripe Connect: {stripeConnected ? 'Connected' : 'Disconnected'}</p>
        {!stripeConnected && <Link className='mt-2 inline-block rounded border px-3 py-2' href='/driver/onboarding/stripe'>Reconnect</Link>}
      </section>

      <section className='rounded border p-3 text-sm'>
        <p>Plan: {plan?.plan_type ?? 'per_ride'}</p>
        <Link href='/driver/subscription' className='text-blue-600 underline'>Manage subscription</Link>
      </section>

      <form action='/auth/signout' method='post'>
        <button className='rounded border px-4 py-2'>Sign Out</button>
      </form>
    </main>
  )
}
