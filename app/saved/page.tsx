'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useSavedSongs } from '@/hooks/useSavedSongs'
import { useBookmarkedLines } from '@/hooks/useBookmarkedLines'
import { SongModal } from '@/components/SongModal'
import { SongListItem } from '@/components/SongListItem'
import { BookmarkedLineItem } from '@/components/BookmarkedLineItem'
import { SharedTransitionProvider } from '@/contexts/SharedTransitionContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Bookmark, Music2, LogIn, Quote } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFloodColor, getSecondaryColor } from '@/lib/languageUtils'

function SavedPageContent() {
  const { data: session } = useSession()
  const { language } = useLanguage()
  const { savedSongs, isLoading, toggleSave, clearSavedSongs } = useSavedSongs()
  const { bookmarkedLines, removeBookmark } = useBookmarkedLines()
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    document.body.style.backgroundColor = getFloodColor(language)
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [language])

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

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="animate-pulse">Loading saved songs...</div>
        </div>
      </div>
    )
  }

  if (savedSongs.length === 0 && bookmarkedLines.length === 0) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-6 p-4 rounded-full bg-muted/20">
            <Bookmark className="h-16 w-16 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-4">No Saved Content Yet</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Start saving songs and bookmarking lyrics to access them quickly
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
        <div>
          <h1 className="text-center" style={{ fontSize: '44px', lineHeight: '52px', fontWeight: 500, color: getSecondaryColor(language), marginTop: '32px', marginBottom: '32px' }}>Saved</h1>
        </div>

        {/* Sign in prompt for unauthenticated users */}
        {!session && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <LogIn className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Sign in to sync your saved content</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Your saved songs and bookmarked lyrics are currently stored locally. Sign in to sync them across devices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="songs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="songs">
              <Music2 className="mr-2 h-4 w-4" />
              Songs ({savedSongs.length})
            </TabsTrigger>
            <TabsTrigger value="lyrics">
              <Quote className="mr-2 h-4 w-4" />
              Lyrics ({bookmarkedLines.length})
            </TabsTrigger>
          </TabsList>

          {/* Songs Tab */}
          <TabsContent value="songs" className="mt-6">
            {savedSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                <div className="mb-6 p-4 rounded-full bg-muted/20">
                  <Music2 className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Saved Songs</h3>
                <p className="text-muted-foreground mb-4">
                  Start saving your favorite songs to access them quickly
                </p>
                <Link href="/">
                  <Button>
                    <Music2 className="mr-2 h-4 w-4" />
                    Explore Songs
                  </Button>
                </Link>
              </div>
            ) : (
              <>
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
              </>
            )}
          </TabsContent>

          {/* Lyrics Tab */}
          <TabsContent value="lyrics" className="mt-6">
            {bookmarkedLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                <div className="mb-6 p-4 rounded-full bg-muted/20">
                  <Quote className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Bookmarked Lyrics</h3>
                <p className="text-muted-foreground mb-4">
                  Bookmark your favorite lyrics to review them later
                </p>
                <Link href="/">
                  <Button>
                    <Music2 className="mr-2 h-4 w-4" />
                    Explore Songs
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarkedLines.map((line, index) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                  >
                    <BookmarkedLineItem
                      id={line.id}
                      songId={line.songId}
                      songTitle={line.songTitle}
                      songArtist={line.songArtist}
                      lineText={line.lineText}
                      lineTranslation={line.lineTranslation}
                      lineIndex={line.lineIndex}
                      onDelete={removeBookmark}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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