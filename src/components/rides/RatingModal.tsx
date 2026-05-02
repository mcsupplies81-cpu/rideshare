'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface RatingModalProps {
  rideId: string
  onComplete: () => void
  onSkip: () => void
}

export default function RatingModal({ rideId, onComplete, onSkip }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const submitRating = async () => {
    if (!rating || submitting) return
    setSubmitting(true)
    try {
      await fetch(`/api/rides/${rideId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, rated_by: 'rider' }),
      })
    } finally {
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-md animate-[slideUp_300ms_ease-out] rounded-2xl border border-[#2A2A44] bg-[#151525] p-6 text-white shadow-2xl">
        <h2 className="mb-2 text-2xl font-semibold">How was your ride?</h2>
        <p className="mb-5 text-sm text-gray-300">Tap a star to leave a rating.</p>
        <div className="mb-6 flex items-center justify-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded p-1"
                aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
              >
                <Star className={`h-9 w-9 ${value <= rating ? 'fill-[#7B5EA7] text-[#7B5EA7]' : 'text-gray-500'}`} />
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={submitRating}
          disabled={!rating || submitting}
          className="w-full rounded-lg bg-[#7B5EA7] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </button>
        <button type="button" onClick={onSkip} className="mt-3 w-full text-sm text-gray-300 underline underline-offset-4">
          Skip
        </button>
      </div>
    </div>
  )
}
