'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const steps = [
  { id: 1, href: '/driver/onboarding/profile', label: 'Profile' },
  { id: 2, href: '/driver/onboarding/vehicle', label: 'Vehicle' },
  { id: 3, href: '/driver/onboarding/documents', label: 'Documents' },
  { id: 4, href: '/driver/onboarding/stripe', label: 'Stripe' },
]
export default function Onboarding() { const [step, setStep] = useState(1); useEffect(()=>{const saved=Number(localStorage.getItem('driver_onboarding_step')||'1'); setStep(saved)},[]); return <main className="space-y-4"><p>Step {step} of 4</p><div className="h-2 rounded bg-gray-200"><div className="h-2 rounded bg-purple-600" style={{width:`${(step/4)*100}%`}}/></div><div className="space-y-2">{steps.map(s=><Link key={s.id} href={s.href} className="block rounded border p-3">Step {s.id}: {s.label}</Link>)}</div></main> }
