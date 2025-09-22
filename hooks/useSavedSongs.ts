'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
  const [localSavedSongs, setLocalSavedSongs] = useState<SavedSong[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedSongs')
      if (saved) {
        try {
          setLocalSavedSongs(JSON.parse(saved))
        } catch (error) {
          console.error('Error parsing saved songs from localStorage:', error)
        }
      }
    }
  }, [])

  // For now, we're only using localStorage
  // This query is disabled but kept for future authentication implementation
  const { data: dbSavedSongs = [], isLoading } = useQuery({
    queryKey: ['savedSongs'],
    queryFn: async () => {
      const response = await fetch('/api/saved')
      if (!response.ok) {
        throw new Error('Failed to fetch saved songs')
      }
      return response.json() as Promise<SavedSong[]>
    },
    enabled: false // Disabled until auth is implemented
  })

  // Use localStorage for all users
  const savedSongs = localSavedSongs

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

    // Use localStorage for all users
    if (isSaved) {
      const filtered = localSavedSongs.filter(s => s.id !== song.id)
      setLocalSavedSongs(filtered)
      localStorage.setItem('savedSongs', JSON.stringify(filtered))
    } else {
      const newSong: SavedSong = {
        ...song,
        savedAt: new Date().toISOString()
      }
      const updated = [...localSavedSongs, newSong]
      setLocalSavedSongs(updated)
      localStorage.setItem('savedSongs', JSON.stringify(updated))
    }

    // Also call API (non-blocking)
    try {
      const method = isSaved ? 'DELETE' : 'POST'
      await fetch(`/api/saved/${song.id}`, { method })
    } catch (error) {
      console.error('API call failed:', error)
    }
  }

  // Clear all saved songs
  const clearSavedSongs = () => {
    setLocalSavedSongs([])
    localStorage.removeItem('savedSongs')
  }

  return {
    savedSongs,
    isLoading,
    isSongSaved,
    toggleSave,
    clearSavedSongs
  }
}