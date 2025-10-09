'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { cn } from "@/lib/utils"
import { SongHeader } from '@/components/SongHeader'
import { LyricsView } from '@/components/LyricsView'
import { Button } from '@/components/ui/button'
import { LanguageToggle } from '@/components/LanguageToggle'
import { fetchLyrics } from '@/lib/client'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

interface SongModalProps {
  songId: string | null
  level?: number
  isOpen: boolean
  onClose: () => void
  onSongChange?: (songId: string) => void
}

export function SongModal({ songId, level, isOpen, onClose, onSongChange }: SongModalProps) {
  const [pageBackgroundColor, setPageBackgroundColor] = useState('rgb(59, 130, 246)')
  const [displayLanguage, setDisplayLanguage] = useState<'spanish' | 'english' | 'both'>('spanish')
  const [currentSongId, setCurrentSongId] = useState(songId)
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false)

  // Debug translation modal state
  useEffect(() => {
    // console.log('🔍 SongModal: Translation modal state changed:', isTranslationModalOpen)
  }, [isTranslationModalOpen])

  // Update current song when prop changes
  useEffect(() => {
    setCurrentSongId(songId)
  }, [songId])

  // React Query for lyrics data
  const { data: lyricsData, isLoading, error } = useQuery({
    queryKey: ['lyrics', currentSongId],
    queryFn: () => fetchLyrics(currentSongId!),
    enabled: !!currentSongId && isOpen,
  })

  // Determine the effective level
  const effectiveLevel = level || lyricsData?.level || lyricsData?.song?.level

  // Fetch songs from the same level for navigation
  const { data: levelSongs } = useQuery({
    queryKey: ['levelSongs', effectiveLevel],
    queryFn: async () => {
      if (!effectiveLevel) return []
      // console.log('🎵 Modal: Fetching songs for level:', effectiveLevel)
      const response = await fetch(`/api/songs/level/${effectiveLevel}`)
      if (!response.ok) return []
      const songs = await response.json()
      // console.log('🎵 Modal: Fetched', songs.length, 'songs for level', effectiveLevel)
      return songs
    },
    enabled: !!effectiveLevel && isOpen,
  })

  // Calculate previous and next songs
  const { prevSong, nextSong } = useMemo(() => {
    if (!levelSongs || !currentSongId) {
      // console.log('🎵 Modal: No level songs or current song ID')
      return { prevSong: null, nextSong: null }
    }

    const currentIndex = levelSongs.findIndex((song: any) => song.id === currentSongId)
    // console.log('🎵 Modal: Current song index:', currentIndex, 'of', levelSongs.length)

    if (currentIndex === -1) {
      // console.log('🎵 Modal: Current song not found in level songs')
      return { prevSong: null, nextSong: null }
    }

    const result = {
      prevSong: currentIndex > 0 ? levelSongs[currentIndex - 1] : null,
      nextSong: currentIndex < levelSongs.length - 1 ? levelSongs[currentIndex + 1] : null,
    }

    // console.log('🎵 Modal: Navigation ready:', {
    //   hasPrev: !!result.prevSong,
    //   hasNext: !!result.nextSong,
    //   prevTitle: result.prevSong?.title,
    //   nextTitle: result.nextSong?.title
    // })

    return result
  }, [levelSongs, currentSongId])

  // Handle color change from SongHeader
  const handleColorChange = (color: string) => {
    setPageBackgroundColor(color)
  }

  // Navigation handlers
  const handlePrevious = () => {
    // console.log('🎵 Modal: Previous clicked', { prevSong })
    if (prevSong) {
      setCurrentSongId(prevSong.id)
      if (onSongChange) {
        onSongChange(prevSong.id)
      }
    }
  }

  const handleNext = () => {
    // console.log('🎵 Modal: Next clicked', { nextSong })
    if (nextSong) {
      setCurrentSongId(nextSong.id)
      if (onSongChange) {
        onSongChange(nextSong.id)
      }
    }
  }

  // Debug logging
  // console.log('SongModal render:', {
  //   songId,
  //   currentSongId,
  //   isOpen,
  //   hasOnClose: !!onClose,
  //   effectiveLevel,
  //   hasPrev: !!prevSong,
  //   hasNext: !!nextSong
  // })

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
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogPortal>
            <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
            <DialogPrimitive.Content
              className="max-w-none w-full h-full m-0 p-0 rounded-none border-0 bg-transparent overflow-y-auto fixed inset-0 z-50"
              style={{ backgroundColor: pageBackgroundColor }}
            >
            <VisuallyHidden.Root>
              <DialogTitle>
                {lyricsData ? `${lyricsData.title} by ${lyricsData.artist}` : 'Song Details'}
              </DialogTitle>
            </VisuallyHidden.Root>
            <motion.div
              key="modal-content"
              className="px-6 py-8 min-h-full max-w-7xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: 10,
                transition: {
                  type: "spring",
                  stiffness: 600,
                  damping: 60
                }
              }}
              transition={{
                type: "spring",
                stiffness: 600,
                damping: 40
              }}
            >
          {isLoading ? (
            <div className="flex items-center justify-center py-12 min-h-screen">
              <motion.div
                className="flex items-center text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 600,
                  damping: 40,
                  delay: 0.1
                }}
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
                transition={{
                  type: "spring",
                  stiffness: 600,
                  damping: 40,
                  delay: 0.1
                }}
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
              {console.log('🎵 SongModal lyricsData:', {
                title: lyricsData.title,
                artist: lyricsData.artist,
                songSummary: lyricsData.songSummary,
                hasSummary: !!lyricsData.songSummary
              })}
              <SongHeader
                track={{
                  id: lyricsData.trackId || currentSongId,
                  title: lyricsData.title,
                  artist: lyricsData.artist,
                  album: lyricsData.album,
                  spotifyId: lyricsData.spotifyId,
                  spotifyUrl: lyricsData.spotifyUrl,
                  previewUrl: lyricsData.previewUrl,
                  albumArt: lyricsData.albumArt,
                  albumArtSmall: lyricsData.albumArtSmall,
                  songSummary: lyricsData.songSummary
                }}
                backHref="#"
                backText={backText}
                level={lyricsData.level}
                levelName={lyricsData.levelName}
                difficultyScore={lyricsData.difficultyScore}
                genres={lyricsData.genres}
                wordCount={lyricsData.wordCount}
                verbDensity={lyricsData.verbDensity}
                devRating={lyricsData.devRating}
                userRating={lyricsData.userRating}
                hasLyrics={lyricsData.hasLyrics}
                hasTranslations={lyricsData.hasTranslations}
                synced={lyricsData.synced}
                onColorChange={handleColorChange}
                onBackClick={onClose}
                onPrevious={prevSong ? handlePrevious : undefined}
                onNext={nextSong ? handleNext : undefined}
                hideNavigation={isTranslationModalOpen}
              />

              {/* Language Toggle */}
              <div className="flex justify-center mb-6">
                <LanguageToggle
                  value={displayLanguage}
                  onChange={setDisplayLanguage}
                  language={(() => {
                    const lang = lyricsData?.song?.language || lyricsData?.language || 'es'
                    console.log('🎵 SongModal language data:', {
                      songLanguage: lyricsData?.song?.language,
                      directLanguage: lyricsData?.language,
                      finalLang: lang,
                      lyricsDataKeys: lyricsData ? Object.keys(lyricsData) : []
                    })
                    return lang
                  })()}
                />
              </div>

              {/* Main Content */}
              <motion.div
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 600,
                  damping: 40,
                  delay: 0.2
                }}
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
                  displayLanguage={displayLanguage}
                  track={{
                    id: lyricsData.trackId || songId,
                    title: lyricsData.title,
                    artist: lyricsData.artist,
                    album: lyricsData.album,
                    language: lyricsData.language,
                    spotifyId: lyricsData.spotifyId,
                    spotifyUrl: lyricsData.spotifyUrl,
                    previewUrl: lyricsData.previewUrl,
                    albumArt: lyricsData.albumArt,
                    albumArtSmall: lyricsData.albumArtSmall
                  }}
                  onPlayPauseReady={(fn) => {
                    // console.log('🎮 SongModal: Received play/pause function from LyricsView')
                  }}
                  onTranslationModalChange={setIsTranslationModalOpen}
                />
              </motion.div>
            </>
          ) : null}
            </motion.div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
    </AnimatePresence>
  )
}