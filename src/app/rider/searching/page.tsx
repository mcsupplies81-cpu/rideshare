'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRideStatus } from '@/hooks/useRideStatus'

const TERMINAL_STATUSES = new Set([
  'completed',
  'cancelled_by_rider',
  'cancelled_by_driver',
  'no_driver_found',
  'payment_failed',
])

export default function SearchingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rideId = searchParams.get('rideId')
  const { ride, loading } = useRideStatus(rideId)
  const [cancelling, setCancelling] = useState(false)
  const [dots, setDots] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setDots((d) => (d % 3) + 1), 600)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (!ride) return
    if (ride.status === 'accepted' || ride.status === 'driver_arrived') {
      router.push(`/rider/trip/${rideId}`)
      return
    }
    if (TERMINAL_STATUSES.has(ride.status)) {
      router.push('/rider')
    }
  }, [ride, rideId, router])

  async function cancelRide() {
    if (!rideId || cancelling) return
    setCancelling(true)
    try {
      await fetch(`/api/rides/${rideId}/cancel`, { method: 'POST' })
      router.push('/rider')
    } catch {
      setCancelling(false)
    }
  }

  if (!rideId) {
    router.push('/rider')
    return null
  }

  return (
    <main className="min-h-screen bg-[#0F0F1A] flex flex-col items-center justify-center px-6 text-white">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="relative flex items-center justify-center w-40 h-40">
          <span className="absolute inset-0 rounded-full border-2 border-[#7B5EA7] animate-ping opacity-30" />
          <span className="absolute inset-4 rounded-full border-2 border-[#7B5EA7] animate-ping opacity-20" />
          <div className="relative w-20 h-20 rounded-full bg-[#7B5EA7] flex items-center justify-center shadow-lg shadow-purple-900/50">
            <span className="text-3xl">🚗</span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            Finding your driver{'.'.repeat(dots)}
          </h1>
          <p className="text-gray-400 text-sm">
            {loading ? 'Connecting…' : 'Searching nearby drivers for you'}
          </p>
        </div>

        {ride && (
          <div className="w-full bg-[#1A1A2E] rounded-2xl p-4 text-sm text-gray-300 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="capitalize">{ride.status.replace(/_/g, ' ')}</span>
            </div>
          </div>
        )}

        <button
          onClick={cancelRide}
          disabled={cancelling || loading}
          className="w-full py-4 rounded-xl border border-red-700 text-red-400 font-semibold hover:bg-red-900/20 transition-colors disabled:opacity-40"
        >
          {cancelling ? 'Cancelling…' : 'Cancel Ride'}
        </button>
      </div>
    </main>
  )
}
