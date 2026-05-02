'use client'

import { useEffect, useState } from 'react'

type DriverCountdownProps = {
  seconds: number
  onExpire: () => void
}

export function DriverCountdown({ seconds, onExpire }: DriverCountdownProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      onExpire()
      return
    }

    const timer = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [remaining, onExpire])

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = remaining / Math.max(seconds, 1)
  const dashOffset = circumference * (1 - progress)
  const isCritical = remaining <= 10

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} stroke="#1A1A2E" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={isCritical ? '#EF4444' : '#7B5EA7'}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.2s ease' }}
        />
      </svg>
      <div className={`absolute text-4xl font-bold ${isCritical ? 'text-red-400' : 'text-white'}`}>{remaining}</div>
    </div>
  )
}
