'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface BookmarkedLine {
  id: string
  songId: string
  songTitle?: string
  songArtist?: string
  lineText: string
  lineTranslation: string
  lineIndex: number
  bookmarkedAt: string
}

export function useBookmarkedLines() {
  const queryClient = useQueryClient()
  const [localBookmarkedLines, setLocalBookmarkedLines] = useState<BookmarkedLine[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookmarkedLines')
      if (saved) {
        try {
          setLocalBookmarkedLines(JSON.parse(saved))
        } catch (error) {
          console.error('Error parsing bookmarked lines from localStorage:', error)
        }
      }
    }
  }, [])

  // For now, we're only using localStorage
  // This query is disabled but kept for future authentication implementation
  const { data: dbBookmarkedLines = [], isLoading } = useQuery({
    queryKey: ['bookmarkedLines'],
    queryFn: async () => {
      const response = await fetch('/api/bookmarks/lines')
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarked lines')
      }
      return response.json() as Promise<BookmarkedLine[]>
    },
    enabled: false // Disabled until auth is implemented
  })

  // Use localStorage for all users
  const bookmarkedLines = localBookmarkedLines

  // Check if a line is bookmarked
  const isLineBookmarked = (songId: string, lineIndex: number): boolean => {
    return bookmarkedLines.some(
      line => line.songId === songId && line.lineIndex === lineIndex
    )
  }

  // Add bookmark
  const addBookmark = (line: Omit<BookmarkedLine, 'id' | 'bookmarkedAt'>) => {
    const newBookmark: BookmarkedLine = {
      ...line,
      id: `${line.songId}-${line.lineIndex}-${Date.now()}`,
      bookmarkedAt: new Date().toISOString()
    }

    const updated = [...localBookmarkedLines, newBookmark]
    setLocalBookmarkedLines(updated)
    localStorage.setItem('bookmarkedLines', JSON.stringify(updated))

    // Also call API (non-blocking)
    fetch('/api/bookmarks/lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(line)
    }).catch(() => {}) // Silent fail for non-blocking API call
  }

  // Remove bookmark
  const removeBookmark = (id: string) => {
    const filtered = localBookmarkedLines.filter(line => line.id !== id)
    setLocalBookmarkedLines(filtered)
    localStorage.setItem('bookmarkedLines', JSON.stringify(filtered))

    // Also call API (non-blocking)
    fetch(`/api/bookmarks/lines/${id}`, { method: 'DELETE' }).catch(() => {}) // Silent fail for non-blocking API call
  }

  // Remove bookmark by song and line index
  const removeBookmarkByLine = (songId: string, lineIndex: number) => {
    const bookmark = localBookmarkedLines.find(
      line => line.songId === songId && line.lineIndex === lineIndex
    )
    if (bookmark) {
      removeBookmark(bookmark.id)
    }
  }

  // Clear all bookmarks
  const clearBookmarks = () => {
    setLocalBookmarkedLines([])
    localStorage.removeItem('bookmarkedLines')
  }

  return {
    bookmarkedLines,
    isLoading,
    isLineBookmarked,
    addBookmark,
    removeBookmark,
    removeBookmarkByLine,
    clearBookmarks
  }
}
