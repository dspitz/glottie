'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { SongHeader } from '@/components/SongHeader'
import { LyricsView } from '@/components/LyricsView'
import { Button } from '@/components/ui/button'
import { fetchLyrics } from '@/lib/client'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

interface SongModalProps {
  songId: string | null
  level?: number
  isOpen: boolean
  onClose: () => void
}

export function SongModal({ songId, level, isOpen, onClose }: SongModalProps) {
  const [pageBackgroundColor, setPageBackgroundColor] = useState('rgb(59, 130, 246)')

  // React Query for lyrics data
  const { data: lyricsData, isLoading, error } = useQuery({
    queryKey: ['lyrics', songId],
    queryFn: () => fetchLyrics(songId!),
    enabled: !!songId && isOpen,
  })

  // Handle color change from SongHeader
  const handleColorChange = (color: string) => {
    setPageBackgroundColor(color)
  }

  // Debug logging
  console.log('SongModal render:', { songId, isOpen, hasOnClose: !!onClose })

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!songId) return null

  const backText = level ? `Back to Level ${level}` : 'Back to Levels'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content 
          className="max-w-none w-full h-full m-0 p-0 rounded-none border-0 bg-transparent overflow-y-auto fixed inset-0 z-50"
          style={{ backgroundColor: pageBackgroundColor }}
        >

        {/* Modal content with entrance animation */}
        <motion.div
          className="container py-8 min-h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12 min-h-screen">
              <motion.div
                className="flex items-center text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Loading song...</span>
              </motion.div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center min-h-screen">
              <motion.div
                className="text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <AlertCircle className="mb-4 h-12 w-12 text-red-400 mx-auto" />
                <h2 className="text-xl font-semibold mb-2">Song Not Found</h2>
                <p className="text-white/70 mb-4">
                  The requested song could not be loaded.
                </p>
                <Button onClick={onClose} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backText}
                </Button>
              </motion.div>
            </div>
          ) : lyricsData ? (
            <>
              {/* Enhanced Song Header */}
              <SongHeader
                track={{
                  id: lyricsData.trackId || songId,
                  title: lyricsData.title,
                  artist: lyricsData.artist,
                  album: lyricsData.album,
                  spotifyUrl: lyricsData.spotifyUrl,
                  previewUrl: lyricsData.previewUrl,
                  albumArt: lyricsData.albumArt,
                  albumArtSmall: lyricsData.albumArtSmall
                }}
                backHref="#"
                backText={backText}
                level={lyricsData.level}
                difficultyScore={lyricsData.difficultyScore}
                onColorChange={handleColorChange}
                onBackClick={onClose}
              />

              {/* Main Content */}
              <motion.div 
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
              >
                <LyricsView
                  lines={lyricsData.lines || []}
                  translations={lyricsData.translations}
                  spotifyUrl={lyricsData.spotifyUrl}
                  title={lyricsData.title}
                  artist={lyricsData.artist}
                  isDemo={lyricsData.mode === 'demo'}
                  backgroundColor={pageBackgroundColor}
                  synchronized={lyricsData.synchronized}
                  track={{
                    id: lyricsData.trackId || songId,
                    title: lyricsData.title,
                    artist: lyricsData.artist,
                    album: lyricsData.album,
                    spotifyId: lyricsData.spotifyId,
                    spotifyUrl: lyricsData.spotifyUrl,
                    previewUrl: lyricsData.previewUrl,
                    albumArt: lyricsData.albumArt,
                    albumArtSmall: lyricsData.albumArtSmall
                  }}
                />
              </motion.div>
            </>
          ) : null}
        </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}