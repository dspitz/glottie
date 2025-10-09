'use client'

import React, { useRef, useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, useSession } from 'next-auth/react'
import { SpotifyWebPlayer } from '@/components/SpotifyWebPlayer'
import { SpotifyAuthModal } from '@/components/SpotifyAuthModal'
import { LanguageProvider } from '@/contexts/LanguageContext'

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

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const playerRef = useRef(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Show auth modal if user is not authenticated after loading
    if (status === 'unauthenticated') {
      setShowAuthModal(true)
    } else if (status === 'authenticated') {
      setShowAuthModal(false)
    }
  }, [status])

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <SpotifyPlayerContext.Provider value={playerRef}>
          {/* Global Spotify Web Player - hidden but always available */}
          <SpotifyWebPlayer ref={playerRef} />

          {/* Spotify Auth Modal */}
          <SpotifyAuthModal
            open={showAuthModal}
            onOpenChange={setShowAuthModal}
          />

          {children}
        </SpotifyPlayerContext.Provider>
      </QueryClientProvider>
    </LanguageProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProvidersContent>
        {children}
      </ProvidersContent>
    </SessionProvider>
  )
}