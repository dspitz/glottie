'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useSavedSongs } from '@/hooks/useSavedSongs'
import { SongModal } from '@/components/SongModal'
import { SongListItem } from '@/components/SongListItem'
import { SharedTransitionProvider } from '@/contexts/SharedTransitionContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bookmark, Music2, LogIn } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFloodColor, getSecondaryColor } from '@/lib/languageUtils'

function SavedPageContent() {
  const { data: session } = useSession()
  const { language } = useLanguage()
  const { savedSongs, isLoading, isFetching, toggleSave, clearSavedSongs } = useSavedSongs()
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showShimmer, setShowShimmer] = useState(false)

  useEffect(() => {
    document.body.style.backgroundColor = getFloodColor(language)
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [language])

  // Delay showing shimmer state by 300ms
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowShimmer(true)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setShowShimmer(false)
    }
  }, [isLoading])

  // Debug logging
  useEffect(() => {
    console.log('💾 SavedPage render:', {
      language,
      savedSongsCount: savedSongs.length,
      isLoading,
      savedSongs: savedSongs.map(s => ({ id: s.id, title: s.title, artist: s.artist }))
    })
  }, [savedSongs, language, isLoading])

  const openSongModal = (songId: string) => {
    setSelectedSongId(songId)
    setIsModalOpen(true)
  }

  const closeSongModal = () => {
    setIsModalOpen(false)
    setSelectedSongId(null)
  }

  // Shimmer card component - matches SongListItem exactly
  const ShimmerCard = () => (
    <Card className="border-0" style={{ borderRadius: '24px', backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}>
      <CardContent className="flex items-center p-3" style={{ gap: '16px' }}>
        {/* Album art placeholder - 88x88 to match SongListItem */}
        <div
          className="bg-muted/20 rounded-lg flex-shrink-0 animate-pulse"
          style={{ width: '88px', height: '88px' }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <div className="h-5 bg-muted/30 animate-pulse rounded w-3/4" />
          {/* Artist */}
          <div className="h-4 bg-muted/30 animate-pulse rounded w-1/2" style={{ marginTop: '8px' }} />
          {/* Genre and word count */}
          <div className="flex items-center gap-1 mt-1">
            <div className="h-3 bg-muted/30 animate-pulse rounded w-20" />
            <span className="text-black/50">•</span>
            <div className="h-3 bg-muted/30 animate-pulse rounded w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading && showShimmer) {
    return (
      <div className="container px-6 py-8 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center">
            <h1 className="text-center" style={{ fontSize: '18px', lineHeight: '24px', fontWeight: 500, color: getSecondaryColor(language), marginBottom: '24px' }}>Saved</h1>
            <Image
              src={language === 'es' ? '/images/bookmark_no_bg_spanish.png' : '/images/bookmark_no_bg_french.png'}
              alt="Bookmark"
              width={202}
              height={202}
              className="h-[202px] w-[202px] mb-8"
            />
          </div>

          {/* Shimmer Cards */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <ShimmerCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (savedSongs.length === 0 && !isFetching && !isLoading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-6 p-4 rounded-full bg-muted/20">
            <Bookmark className="h-16 w-16 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-4">No Saved Songs Yet</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Start saving your favorite songs to access them quickly
          </p>
          <Link href="/">
            <Button className="mt-4">
              <Music2 className="mr-2 h-4 w-4" />
              Explore Songs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-6 py-8 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center">
          <h1 className="text-center" style={{ fontSize: '18px', lineHeight: '24px', fontWeight: 500, color: getSecondaryColor(language), marginBottom: '24px' }}>Saved</h1>
          <Image
            src={language === 'es' ? '/images/bookmark_no_bg_spanish.png' : '/images/bookmark_no_bg_french.png'}
            alt="Bookmark"
            width={202}
            height={202}
            className="h-[202px] w-[202px] mb-8"
          />
        </div>

        {/* Songs List */}
        <div className="space-y-4">
          {savedSongs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <SongListItem
                id={song.id}
                title={song.title}
                artist={song.artist}
                album={song.album}
                level={song.level}
                difficultyScore={song.difficultyScore || 0}
                spotifyUrl={song.spotifyUrl}
                albumArt={song.albumArt}
                albumArtSmall={song.albumArtSmall}
                wordCount={song.wordCount}
                verbDensity={song.verbDensity}
                genres={song.genres}
                onClick={() => openSongModal(song.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Song Modal */}
      <SongModal
        songId={selectedSongId}
        isOpen={isModalOpen}
        onClose={closeSongModal}
      />
    </div>
  )
}

export default function SavedPage() {
  return (
    <SharedTransitionProvider>
      <SavedPageContent />
    </SharedTransitionProvider>
  )
}