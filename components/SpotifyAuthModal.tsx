'use client'

import React from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
)

interface SpotifyAuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SpotifyAuthModal({ open, onOpenChange }: SpotifyAuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md rounded-[24px] w-[calc(100%-48px)] max-w-[calc(100%-48px)] sm:w-full sm:max-w-md pt-10 pb-8 border-white/50"
        style={{ backgroundColor: '#ffffff2e' }}
        overlayClassName="bg-black/10"
        overlayStyle={{ backdropFilter: 'blur(64px)', WebkitBackdropFilter: 'blur(64px)' }}
        hideClose
      >
        <DialogHeader>
          <div className="flex justify-center mb-6">
            <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.66)' }}>
              <SpotifyIcon className="w-[57.6px] h-[57.6px] text-[#1DB954]" />
            </div>
          </div>
          <DialogTitle className="text-center text-black" style={{ fontSize: '28px' }}>
            Continue with Spotify
          </DialogTitle>
          <DialogDescription className="text-center pt-2 text-black" style={{ fontSize: '14px', lineHeight: '22px' }}>
            In order to listen to songs on diddydum, you'll need to connect your Spotify Premium account. This will allow you to follow along and learn lyrics from another language.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 pt-4">
          <Button
            onClick={() => signIn('spotify')}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base"
          >
            Sign in with Spotify
          </Button>
          <p className="text-xs text-center text-black px-4">
            By signing in, you agree to connect your Spotify account to diddydum for music playback.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
