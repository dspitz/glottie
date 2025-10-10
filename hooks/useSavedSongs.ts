'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '@/contexts/LanguageContext'

interface SavedSong {
  id: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  albumArtSmall?: string
  level?: number
  levelName?: string
  difficultyScore?: number
  spotifyUrl?: string
  genres?: string
  popularity?: number
  wordCount?: number
  verbDensity?: number
  savedAt?: string
}

export function useSavedSongs() {
  const queryClient = useQueryClient()
  const { language } = useLanguage()
  const [localSavedSongs, setLocalSavedSongs] = useState<SavedSong[]>([])

  // Load from localStorage on mount and when language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `savedSongs_${language}`
      let saved = localStorage.getItem(storageKey)

      console.log('💾 useSavedSongs: Loading saved songs for language:', language)
      console.log('💾 Storage key:', storageKey)
      console.log('💾 Raw localStorage value:', saved ? saved.substring(0, 100) + '...' : 'null')

      // MIGRATION: If no language-specific saved songs exist, check for old 'savedSongs' key
      if (!saved && language === 'es') {
        const oldSaved = localStorage.getItem('savedSongs')
        if (oldSaved) {
          console.log('💾 Migrating saved songs from old key to savedSongs_es')
          // Copy to new key
          localStorage.setItem(storageKey, oldSaved)
          saved = oldSaved
        }
      }

      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          console.log('💾 Parsed saved songs:', parsed.length, 'songs')
          console.log('💾 Songs:', parsed.map((s: any) => ({ id: s.id, title: s.title, artist: s.artist })))
          setLocalSavedSongs(parsed)
        } catch (error) {
          console.error('💾 Error parsing saved songs from localStorage:', error)
        }
      } else {
        console.log('💾 No saved songs found for', language)
        setLocalSavedSongs([])
      }
    }
  }, [language])

  // Fetch from database for authenticated users
  const { data: dbSavedSongs = [], isLoading, isFetching } = useQuery({
    queryKey: ['savedSongs'],
    queryFn: async () => {
      const response = await fetch('/api/saved')
      if (!response.ok) {
        throw new Error('Failed to fetch saved songs')
      }
      return response.json() as Promise<SavedSong[]>
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (renamed from cacheTime in React Query v5)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component remount if data exists
  })

  // Merge localStorage and database songs, removing duplicates and filtering by language
  const savedSongs = React.useMemo(() => {
    // Filter database songs by current language
    const filteredDbSongs = dbSavedSongs.filter((song: any) =>
      !song.language || song.language === language
    )

    const merged = [...filteredDbSongs]

    // Add localStorage songs that aren't in the database
    localSavedSongs.forEach(local => {
      const exists = merged.some(db => db.id === local.id)
      if (!exists) {
        merged.push(local)
      }
    })

    console.log('💾 Merged saved songs:', {
      dbCount: filteredDbSongs.length,
      localCount: localSavedSongs.length,
      totalCount: merged.length,
      language
    })

    // Sort by savedAt (most recent first)
    return merged.sort((a, b) => {
      const aTime = a.savedAt ? new Date(a.savedAt).getTime() : 0
      const bTime = b.savedAt ? new Date(b.savedAt).getTime() : 0
      return bTime - aTime
    })
  }, [dbSavedSongs, localSavedSongs, language])

  // Check if a song is saved
  const isSongSaved = (songId: string): boolean => {
    return savedSongs.some(song => song.id === songId)
  }

  // Toggle save mutation for authenticated users
  const toggleSaveMutation = useMutation({
    mutationFn: async ({ songId, isSaved }: { songId: string; isSaved: boolean }) => {
      const method = isSaved ? 'DELETE' : 'POST'
      const response = await fetch(`/api/saved/${songId}`, { method })
      if (!response.ok) {
        throw new Error('Failed to toggle save')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate the saved songs query to refetch
      queryClient.invalidateQueries({ queryKey: ['savedSongs'] })
    }
  })

  // Toggle save function
  const toggleSave = async (song: {
    id: string
    title: string
    artist: string
    album?: string
    albumArt?: string
    albumArtSmall?: string
    level?: number
    levelName?: string
    difficultyScore?: number
    spotifyUrl?: string
    genres?: string
    popularity?: number
    wordCount?: number
    verbDensity?: number
  }) => {
    const isSaved = isSongSaved(song.id)
    const storageKey = `savedSongs_${language}`

    console.log('💾 toggleSave:', {
      action: isSaved ? 'REMOVE' : 'ADD',
      songId: song.id,
      title: song.title,
      language: language,
      storageKey: storageKey
    })

    // Use localStorage for all users
    if (isSaved) {
      const filtered = localSavedSongs.filter(s => s.id !== song.id)
      console.log('💾 Removing song. New count:', filtered.length)
      setLocalSavedSongs(filtered)
      localStorage.setItem(storageKey, JSON.stringify(filtered))
    } else {
      const newSong: SavedSong = {
        ...song,
        savedAt: new Date().toISOString()
      }
      const updated = [...localSavedSongs, newSong]
      console.log('💾 Adding song. New count:', updated.length)
      setLocalSavedSongs(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }

    // Also call API (non-blocking)
    try {
      const method = isSaved ? 'DELETE' : 'POST'
      await fetch(`/api/saved/${song.id}`, { method })
    } catch (error) {
      // console.error('API call failed:', error)
    }
  }

  // Clear all saved songs for current language
  const clearSavedSongs = () => {
    const storageKey = `savedSongs_${language}`
    setLocalSavedSongs([])
    localStorage.removeItem(storageKey)
  }

  // Only show loading if we have NO data (not even from localStorage)
  // This prevents blocking the UI when we have localStorage data
  const showLoading = isLoading && localSavedSongs.length === 0 && dbSavedSongs.length === 0

  return {
    savedSongs,
    isLoading: showLoading,
    isFetching, // Background fetching indicator
    isSongSaved,
    toggleSave,
    clearSavedSongs
  }
}