'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/rider', label: 'Home' },
  { href: '/rider/history', label: 'History' },
  { href: '/rider/profile', label: 'Profile' },
]

export function RiderNav() {
  const pathname = usePathname()
  return <nav className='fixed inset-x-0 bottom-0 border-t border-[#2A2A44] bg-[#1A1A2E]'>
    <div className='mx-auto grid max-w-md grid-cols-3'>
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return <Link key={tab.href} href={tab.href} className={`p-4 text-center text-sm ${active ? 'border-t-2 border-[#7B5EA7] text-white' : 'text-gray-400'}`}>{tab.label}</Link>
      })}
    </div>
  </nav>
}
