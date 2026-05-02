'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') === 'driver' ? 'driver' : 'rider'

  const [role, setRole] = useState<'rider' | 'driver'>(initialRole)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function sendOtp() {
    if (!agreed) { setError('Please accept the terms to continue.'); return }
    if (!name.trim()) { setError('Please enter your name.'); return }
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatted,
      options: { data: { full_name: name, role } },
    })
    if (error) setError(error.message)
    else setStep('otp')
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: 'sms',
    })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      // Ensure user profile exists (trigger may handle this)
      await (supabase.from('users') as any).upsert({
        id: data.user.id,
        email: data.user.email ?? '',
        phone: formatted,
        full_name: name,
        role,
      }, { onConflict: 'id' })

      if (role === 'driver') router.push('/driver/onboarding')
      else router.push('/rider')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#0F0F1A] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-full bg-[#7B5EA7] flex items-center justify-center font-bold text-lg">R</div>
          <span className="text-2xl font-bold">Moove</span>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">
          {step === 'info' ? 'Create your account' : 'Verify your number'}
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          {step === 'info' ? 'Join Moove in San Diego' : `We sent a code to ${phone}`}
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl p-3 text-sm mb-4">{error}</div>
        )}

        {step === 'info' ? (
          <>
            {/* Role toggle */}
            <div className="flex bg-[#1A1A2E] rounded-xl p-1 mb-5">
              <button
                onClick={() => setRole('rider')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${role === 'rider' ? 'bg-[#7B5EA7] text-white' : 'text-gray-400'}`}
              >
                I&apos;m a Rider
              </button>
              <button
                onClick={() => setRole('driver')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${role === 'driver' ? 'bg-[#7B5EA7] text-white' : 'text-gray-400'}`}
              >
                I&apos;m a Driver
              </button>
            </div>

            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-4 text-white placeholder-gray-600 text-base focus:outline-none focus:border-[#7B5EA7] mb-3"
            />
            <input
              type="tel"
              placeholder="(619) 555-0100"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-4 text-white placeholder-gray-600 text-base focus:outline-none focus:border-[#7B5EA7] mb-4"
            />

            <label className="flex gap-3 items-start mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1 accent-[#7B5EA7]"
              />
              <span className="text-gray-400 text-sm">
                I agree to the{' '}
                <span className="text-[#7B5EA7]">Terms of Service</span> and{' '}
                <span className="text-[#7B5EA7]">Privacy Policy</span>
              </span>
            </label>

            <button
              onClick={sendOtp}
              disabled={loading || !phone || !name || !agreed}
              className="w-full py-4 rounded-xl bg-[#7B5EA7] text-white font-semibold text-lg hover:bg-[#5A3E8A] transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Create Account'}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-4 text-white placeholder-gray-600 text-2xl text-center tracking-widest focus:outline-none focus:border-[#7B5EA7] mb-4"
              maxLength={6}
            />
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full py-4 rounded-xl bg-[#7B5EA7] text-white font-semibold text-lg hover:bg-[#5A3E8A] transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>
          </>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#7B5EA7] hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  )
}
