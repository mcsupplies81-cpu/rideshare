'use client'

import { useState } from 'react'

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={onCopy} className='rounded border px-3 py-2 text-sm'>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
