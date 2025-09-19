'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'

interface DevRatingProps {
  songId: string
  initialRating?: number | null
}

export default function DevRating({ songId, initialRating }: DevRatingProps) {
  const [rating, setRating] = useState(initialRating || 0)
  const [hover, setHover] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleRatingChange = async (newRating: number) => {
    // If clicking the same star, toggle it off
    const finalRating = newRating === rating ? 0 : newRating

    setRating(finalRating)
    setIsSaving(true)

    try {
      const response = await fetch('/api/dev/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId,
          rating: finalRating === 0 ? null : finalRating,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save rating')
      }
    } catch (error) {
      console.error('Error saving rating:', error)
      // Revert on error
      setRating(initialRating || 0)
    } finally {
      setIsSaving(false)
      setTimeout(() => setIsOpen(false), 500)
    }
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Dev Rating"
      >
        <Star
          className={`w-5 h-5 ${rating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
        />
        {rating > 0 && (
          <span className="absolute -top-1 -right-1 text-xs bg-yellow-400 text-white rounded-full w-4 h-4 flex items-center justify-center">
            {rating}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Dev Rating</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                disabled={isSaving}
                className="p-1 transition-transform hover:scale-110 disabled:opacity-50"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hover || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {rating === 0 ? 'Not rated' : `${rating} star${rating !== 1 ? 's' : ''}`}
          </div>
          {rating > 0 && (
            <button
              onClick={() => handleRatingChange(0)}
              className="text-xs text-red-500 hover:text-red-600 mt-1"
              disabled={isSaving}
            >
              Clear rating
            </button>
          )}
        </div>
      )}
    </div>
  )
}