'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface BookmarkButtonProps {
  songId: string
  songTitle: string
  songArtist: string
  songAlbum?: string
  songAlbumArt?: string
  songAlbumArtSmall?: string
  songLevel?: number
  songLevelName?: string
  songDifficultyScore?: number
  songGenres?: string
  songWordCount?: number
  songVerbDensity?: number
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function BookmarkButton({
  songId,
  songTitle,
  songArtist,
  songAlbum,
  songAlbumArt,
  songAlbumArtSmall,
  songLevel,
  songLevelName,
  songDifficultyScore,
  songGenres,
  songWordCount,
  songVerbDensity,
  className,
  size = 'icon'
}: BookmarkButtonProps) {
  const { language } = useLanguage()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if song is saved on mount and when songId or language changes
  useEffect(() => {
    checkSavedStatus()
  }, [songId, language])

  const checkSavedStatus = () => {
    // Check localStorage
    const savedSongs = getSavedSongsFromLocalStorage()
    setIsSaved(savedSongs.some(song => song.id === songId))
  }

  const getSavedSongsFromLocalStorage = (): Array<{
    id: string;
    title: string;
    artist: string;
    album?: string;
    albumArt?: string;
    albumArtSmall?: string;
    level?: number;
    levelName?: string;
    difficultyScore?: number;
    genres?: string;
    wordCount?: number;
    verbDensity?: number;
    savedAt: string
  }> => {
    if (typeof window === 'undefined') return []
    const storageKey = `savedSongs_${language}`
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : []
  }

  const saveSongToLocalStorage = () => {
    const storageKey = `savedSongs_${language}`
    const savedSongs = getSavedSongsFromLocalStorage()
    if (!savedSongs.some(song => song.id === songId)) {
      savedSongs.push({
        id: songId,
        title: songTitle,
        artist: songArtist,
        album: songAlbum,
        albumArt: songAlbumArt,
        albumArtSmall: songAlbumArtSmall,
        level: songLevel,
        levelName: songLevelName,
        difficultyScore: songDifficultyScore,
        genres: songGenres,
        wordCount: songWordCount,
        verbDensity: songVerbDensity,
        savedAt: new Date().toISOString()
      })
      console.log('💾 BookmarkButton: Saving to', storageKey, '- Song:', songTitle)
      localStorage.setItem(storageKey, JSON.stringify(savedSongs))
    }
  }

  const removeSongFromLocalStorage = () => {
    const storageKey = `savedSongs_${language}`
    const savedSongs = getSavedSongsFromLocalStorage()
    const filtered = savedSongs.filter(song => song.id !== songId)
    console.log('💾 BookmarkButton: Removing from', storageKey, '- Song:', songTitle)
    localStorage.setItem(storageKey, JSON.stringify(filtered))
  }

  const toggleSave = async () => {
    setIsLoading(true)

    try {
      const newSavedState = !isSaved

      // Update localStorage immediately for responsive UI
      if (newSavedState) {
        saveSongToLocalStorage()
        setIsSaved(true)
        showToast('Song saved!')
      } else {
        removeSongFromLocalStorage()
        setIsSaved(false)
        showToast('Song removed from saved')
      }

      // Also update database for authenticated users (non-blocking)
      const method = newSavedState ? 'POST' : 'DELETE'
      fetch(`/api/saved/${songId}`, { method }).catch(console.error)
    } catch (error) {
      console.error('Error toggling save:', error)
      showToast('An error occurred', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Create a simple toast notification
    const toast = document.createElement('div')
    toast.className = cn(
      'fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-white z-50 transition-all',
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    )
    toast.textContent = message
    document.body.appendChild(toast)

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1'
    }, 10)

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 3000)
  }

  return (
    <Button
      onClick={toggleSave}
      disabled={isLoading}
      variant="ghost"
      size={size}
      className={cn(
        'transition-all',
        isSaved && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
      aria-label={isSaved ? 'Remove from saved' : 'Save song'}
    >
      {isSaved ? (
        <BookmarkCheck className="h-5 w-5 fill-current" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </Button>
  )
}