'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role')

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function sendOtp() {
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
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
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const userRole = profile?.role ?? 'rider'
      if (userRole === 'admin') router.push('/admin')
      else if (userRole === 'driver') router.push('/driver')
      else router.push('/rider')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#0F0F1A] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-full bg-[#7B5EA7] flex items-center justify-center font-bold text-lg">
            R
          </div>
          <span className="text-2xl font-bold">Rideo</span>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">
          {step === 'phone' ? 'Welcome back' : 'Enter your code'}
        </h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          {step === 'phone'
            ? 'Sign in with your phone number'
            : `We sent a 6-digit code to ${phone}`}
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl p-3 text-sm mb-4">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <>
            <input
              type="tel"
              placeholder="(619) 555-0100"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl px-4 py-4 text-white placeholder-gray-600 text-lg focus:outline-none focus:border-[#7B5EA7] mb-4"
            />
            <button
              onClick={sendOtp}
              disabled={loading || !phone}
              className="w-full py-4 rounded-xl bg-[#7B5EA7] text-white font-semibold text-lg hover:bg-[#5A3E8A] transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Code'}
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
            <button
              onClick={() => setStep('phone')}
              className="w-full py-3 text-gray-400 text-sm mt-2 hover:text-white transition-colors"
            >
              Use a different number
            </button>
          </>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link
            href={`/signup${role ? `?role=${role}` : ''}`}
            className="text-[#7B5EA7] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
