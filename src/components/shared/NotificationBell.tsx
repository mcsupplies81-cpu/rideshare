'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])

  async function load() {
    const res = await fetch('/api/notifications')
    if (!res.ok) return
    const data = await res.json()
    setItems(data.notifications ?? [])
  }

  useEffect(() => {
    load()
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div className='relative'>
      <button onClick={() => setOpen((v) => !v)} className='relative rounded border px-3 py-1 text-sm'>
        🔔
        {unreadCount > 0 && (
          <span className='absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-xs text-white'>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute right-0 z-20 mt-2 w-80 rounded border bg-white p-2 text-black shadow'>
          <p className='mb-2 text-sm font-semibold'>Notifications</p>
          {items.length === 0 && <p className='text-sm text-gray-500'>No notifications.</p>}
          <ul className='max-h-80 space-y-2 overflow-auto'>
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => markRead(item.id)}
                  className={`w-full rounded border p-2 text-left text-sm ${item.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                >
                  <p className='font-medium'>{item.title}</p>
                  <p>{item.body}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
