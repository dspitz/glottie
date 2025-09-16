'use client'

import React, { useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { SpotifyWebPlayer } from '@/components/SpotifyWebPlayer'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// Create context for global player ref
export const SpotifyPlayerContext = React.createContext<React.RefObject<any> | null>(null)

export function Providers({ children }: { children: React.ReactNode }) {
  const playerRef = useRef(null)

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SpotifyPlayerContext.Provider value={playerRef}>
          {/* Global Spotify Web Player - hidden but always available */}
          <SpotifyWebPlayer ref={playerRef} />
          {children}
        </SpotifyPlayerContext.Provider>
      </QueryClientProvider>
    </SessionProvider>
  )
}