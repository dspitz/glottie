'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LineBookmarkButtonProps {
  songId: string
  lineText: string
  lineTranslation: string
  lineIndex: number
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LineBookmarkButton({
  songId,
  lineText,
  lineTranslation,
  lineIndex,
  className,
  size = 'icon'
}: LineBookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if line is bookmarked on mount and when props change
  useEffect(() => {
    checkBookmarkStatus()
  }, [songId, lineIndex])

  const checkBookmarkStatus = () => {
    // Check localStorage
    const bookmarkedLines = getBookmarkedLinesFromLocalStorage()
    setIsBookmarked(
      bookmarkedLines.some(
        line => line.songId === songId && line.lineIndex === lineIndex
      )
    )
  }

  const getBookmarkedLinesFromLocalStorage = (): Array<{
    id: string
    songId: string
    lineText: string
    lineTranslation: string
    lineIndex: number
    bookmarkedAt: string
  }> => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('bookmarkedLines')
    return saved ? JSON.parse(saved) : []
  }

  const saveLineToLocalStorage = () => {
    const bookmarkedLines = getBookmarkedLinesFromLocalStorage()
    const exists = bookmarkedLines.some(
      line => line.songId === songId && line.lineIndex === lineIndex
    )

    if (!exists) {
      const newBookmark = {
        id: `${songId}-${lineIndex}-${Date.now()}`, // Temporary ID
        songId,
        lineText,
        lineTranslation,
        lineIndex,
        bookmarkedAt: new Date().toISOString()
      }
      bookmarkedLines.push(newBookmark)
      localStorage.setItem('bookmarkedLines', JSON.stringify(bookmarkedLines))
    }
  }

  const removeLineFromLocalStorage = () => {
    const bookmarkedLines = getBookmarkedLinesFromLocalStorage()
    const filtered = bookmarkedLines.filter(
      line => !(line.songId === songId && line.lineIndex === lineIndex)
    )
    localStorage.setItem('bookmarkedLines', JSON.stringify(filtered))
  }

  const toggleBookmark = async () => {
    setIsLoading(true)

    try {
      // Use localStorage for all users
      if (isBookmarked) {
        removeLineFromLocalStorage()
        setIsBookmarked(false)
        showToast('Line removed from bookmarks')
      } else {
        saveLineToLocalStorage()
        setIsBookmarked(true)
        showToast('Line bookmarked!')
      }

      // Also call API (without blocking UI)
      if (isBookmarked) {
        // DELETE existing bookmark
        const bookmarkedLines = getBookmarkedLinesFromLocalStorage()
        const existing = bookmarkedLines.find(
          line => line.songId === songId && line.lineIndex === lineIndex
        )
        if (existing?.id) {
          fetch(`/api/bookmarks/lines/${existing.id}`, { method: 'DELETE' }).catch(console.error)
        }
      } else {
        // POST new bookmark
        fetch('/api/bookmarks/lines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId,
            lineText,
            lineTranslation,
            lineIndex
          })
        }).catch(console.error)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
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
      onClick={toggleBookmark}
      disabled={isLoading}
      variant="ghost"
      size={size}
      className={cn(
        'transition-all',
        isBookmarked && 'text-blue-500 hover:text-blue-600',
        className
      )}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark line'}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-5 w-5 fill-current" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </Button>
  )
}
