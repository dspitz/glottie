'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { useSavedSongs } from '@/hooks/useSavedSongs'
import { SongModal } from '@/components/SongModal'
import { SongListItem } from '@/components/SongListItem'
import { SharedTransitionProvider } from '@/contexts/SharedTransitionContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bookmark, Music2, LogIn, Trash2 } from 'lucide-react'

function SavedPageContent() {
  const { data: session } = useSession()
  const { savedSongs, isLoading, toggleSave, clearSavedSongs } = useSavedSongs()
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  if (savedSongs.length === 0) {
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
    <div className="container py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Saved Songs</h1>
          <p className="text-muted-foreground">
            {savedSongs.length} {savedSongs.length === 1 ? 'song' : 'songs'} saved
          </p>
        </div>

        {/* Sign in prompt for unauthenticated users */}
        {!session && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <LogIn className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Sign in to sync your saved songs</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Your saved songs are currently stored locally. Sign in with Spotify to sync them across devices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved songs list */}
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
              className="relative group"
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
              {/* Remove button overlay */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  toggleSave(song)
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Clear all button for localStorage */}
        {!session && savedSongs.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to clear all saved songs?')) {
                  clearSavedSongs()
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Saved Songs
            </Button>
          </div>
        )}
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