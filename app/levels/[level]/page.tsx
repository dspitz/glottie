'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { LayoutGroup } from 'framer-motion'
import { SharedTransitionProvider, useSharedTransition } from '@/contexts/SharedTransitionContext'
import { SongListItem } from '@/components/SongListItem'
import { SongModal } from '@/components/SongModal'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fetchLevels } from '@/lib/client'
import { getLevelDescription } from '@/lib/utils'
import { getLevelTags } from '@/lib/levelTags'
import { Loader2, AlertCircle, ArrowLeft, ChevronDown, BookOpen } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getLanguageName, getFloodColor, getSecondaryColor } from '@/lib/languageUtils'
import { TenseModal } from '@/components/TenseModal'

function LevelPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const level = parseInt(params?.level as string, 10) || 1
  const { language } = useLanguage()
  const languageName = getLanguageName(language)

  // Modal state
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTenseModalOpen, setIsTenseModalOpen] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  // Set background color based on language
  useEffect(() => {
    document.body.style.backgroundColor = getFloodColor(language)

    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [language])

  const { data: levelsData, isLoading, error } = useQuery({
    queryKey: ['levels', language],
    queryFn: () => fetchLevels(language),
  })

  // Delay showing loading indicator by 300ms
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowLoading(true)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
    }
  }, [isLoading])

  // Handle URL synchronization for direct song links
  useEffect(() => {
    const songParam = searchParams.get('song')
    if (songParam && !isModalOpen) {
      setSelectedSongId(songParam)
      setIsModalOpen(true)
    }
  }, [searchParams, isModalOpen])

  // Handle opening song modal
  const handleSongClick = (songId: string) => {
    setSelectedSongId(songId)
    setIsModalOpen(true)
    // Update URL to include song parameter
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('song', songId)
    window.history.pushState({}, '', currentUrl.toString())
  }

  const { setIsExiting } = useSharedTransition()

  // Handle closing modal
  const handleCloseModal = () => {
    setIsExiting(true)
    setIsModalOpen(false)
    setSelectedSongId(null)
    // Remove song parameter from URL
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('song')
    window.history.pushState({}, '', currentUrl.toString())
    // Reset exiting state after animation
    setTimeout(() => setIsExiting(false), 1000)
  }

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const songParam = new URLSearchParams(window.location.search).get('song')
      if (!songParam && isModalOpen) {
        // Back button pressed, close modal
        setIsModalOpen(false)
        setSelectedSongId(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isModalOpen])

  if (isLoading && showLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading songs...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Songs</h2>
          <p className="text-muted-foreground">
            There was an error loading the songs for this level.
          </p>
        </div>
      </div>
    )
  }

  if (isNaN(level) || level < 1 || level > 10) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Invalid Level</h2>
          <p className="text-muted-foreground mb-4">
            Level must be between 1 and 10.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Levels
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const levelSongs = levelsData?.levels[level.toString()] || []
  const stats = levelsData?.stats || {}
  const tags = getLevelTags(level)

  return (
    <div className="px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="mb-4 text-center whitespace-pre-line" style={{ fontSize: '40px', lineHeight: '44px', color: getSecondaryColor(language) }}>
            {getLevelDescription(level)}
          </h2>

          {/* Level 1: Present Tense Button */}
          {level === 1 && (
            <div className="flex justify-center mt-6">
              <Button
                size="sm"
                className="gap-2 rounded-xl border-0 px-4 py-3 h-auto bg-black/[0.08] hover:bg-black/[0.12] text-white"
                onClick={() => setIsTenseModalOpen(true)}
              >
                <BookOpen className="h-4 w-4" />
                Learn Present Tense
              </Button>
            </div>
          )}

          {/* Level 2: Past Tense Button */}
          {level === 2 && (
            <div className="flex justify-center mt-6">
              <Button
                size="sm"
                className="gap-2 rounded-xl border-0 px-4 py-3 h-auto bg-black/[0.08] hover:bg-black/[0.12] text-white"
                onClick={() => setIsTenseModalOpen(true)}
              >
                <BookOpen className="h-4 w-4" />
                Learn Past Tense
              </Button>
            </div>
          )}

          {/* Level 3: Future Tense Button */}
          {level === 3 && (
            <div className="flex justify-center mt-6">
              <Button
                size="sm"
                className="gap-2 rounded-xl border-0 px-4 py-3 h-auto bg-black/[0.08] hover:bg-black/[0.12] text-white"
                onClick={() => setIsTenseModalOpen(true)}
              >
                <BookOpen className="h-4 w-4" />
                Learn Future Tense
              </Button>
            </div>
          )}
      </div>

      {/* Songs List */}
      {levelSongs.length > 0 ? (
        <LayoutGroup>
          <div className="space-y-3">
            {levelSongs.map((song) => (
              <SongListItem
                key={song.id}
                id={song.id}
                title={song.title}
                artist={song.artist}
                album={song.album}
                level={level}
                difficultyScore={song.difficultyScore}
                spotifyUrl={song.spotifyUrl}
                previewUrl={song.previewUrl}
                albumArt={song.albumArt}
                albumArtSmall={song.albumArtSmall}
                wordCount={song.metrics?.wordCount}
                verbDensity={song.metrics?.verbDensity}
                genres={song.genres}
                difficultyScore={song.metrics?.difficultyScore || song.difficultyScore}
                onClick={() => handleSongClick(song.id)}
              />
            ))}
          </div>
        </LayoutGroup>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold mb-2">No Songs Yet</h3>
          <p className="text-muted-foreground mb-4">
            There are no songs available for {languageName} {level} at the moment.
          </p>
          <p className="text-sm text-muted-foreground">
            Try seeding more data or check other levels.
          </p>
        </div>
      )}

      {/* Song Modal */}
      <SongModal
        songId={selectedSongId}
        level={level}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Tense Modal */}
      <TenseModal
        tenseId={level === 1 ? "present" : level === 2 ? "preterite" : "future"}
        isOpen={isTenseModalOpen}
        onClose={() => setIsTenseModalOpen(false)}
      />

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between gap-4 mt-12 pt-8 border-t">

        {/* Previous Level or Home */}
        {level === 1 ? (
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Levels
            </Button>
          </Link>
        ) : (
          <Link href={`/levels/${level - 1}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {languageName} {level - 1}
            </Button>
          </Link>
        )}

        {/* Next Level */}
        {level < 5 ? (
          <Link href={`/levels/${level + 1}`}>
            <Button variant="outline" size="sm">
              {languageName} {level + 1}
              <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </Button>
          </Link>
        ) : (
          <div /> // Empty div to maintain spacing when there's no next level
        )}
      </div>
      </div>
    </div>
  )
}

export default function LevelPage() {
  return (
    <SharedTransitionProvider>
      <LevelPageContent />
    </SharedTransitionProvider>
  )
}