'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeContextValue {
  subscribe: (channelName: string, callback: (payload: unknown) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const supabase = createClient()

  useEffect(() => {
    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [supabase])

  function subscribe(channelName: string, callback: (payload: unknown) => void) {
    const existing = channelsRef.current.get(channelName)
    if (existing) {
      supabase.removeChannel(existing)
    }

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, ({ payload }) => callback(payload))
      .subscribe()

    channelsRef.current.set(channelName, channel)

    return () => {
      supabase.removeChannel(channel)
      channelsRef.current.delete(channelName)
    }
  }

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}
