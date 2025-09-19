'use client'

import { useState, useEffect } from 'react'
import { Star, Check, X } from 'lucide-react'

interface UserFeedbackProps {
  songId: string
  initialRating?: number | null
  initialHasLyrics?: boolean
  initialHasTranslations?: boolean
  initialSynced?: boolean
}

export default function UserFeedback({
  songId,
  initialRating,
  initialHasLyrics = true,
  initialHasTranslations = true,
  initialSynced = true
}: UserFeedbackProps) {
  const [rating, setRating] = useState(initialRating || 0)
  const [hover, setHover] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Checkbox states
  const [hasLyrics, setHasLyrics] = useState(initialHasLyrics)
  const [hasTranslations, setHasTranslations] = useState(initialHasTranslations)
  const [synced, setSynced] = useState(initialSynced)

  const updateFeedback = async (updates: {
    userRating?: number | null
    hasLyrics?: boolean
    hasTranslations?: boolean
    synced?: boolean
  }) => {
    setIsSaving(true)

    try {
      const response = await fetch(`/api/song/${songId}/feedback`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update feedback')
      }

      const data = await response.json()
      if (data.success) {
        // Update local state with server response
        if (updates.userRating !== undefined) {
          setRating(data.feedback.userRating || 0)
        }
        if (updates.hasLyrics !== undefined) {
          setHasLyrics(data.feedback.hasLyrics)
        }
        if (updates.hasTranslations !== undefined) {
          setHasTranslations(data.feedback.hasTranslations)
        }
        if (updates.synced !== undefined) {
          setSynced(data.feedback.synced)
        }
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      // Revert on error
      if (updates.userRating !== undefined) {
        setRating(initialRating || 0)
      }
      if (updates.hasLyrics !== undefined) {
        setHasLyrics(initialHasLyrics)
      }
      if (updates.hasTranslations !== undefined) {
        setHasTranslations(initialHasTranslations)
      }
      if (updates.synced !== undefined) {
        setSynced(initialSynced)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleRatingChange = async (newRating: number) => {
    // If clicking the same star, toggle it off
    const finalRating = newRating === rating ? 0 : newRating
    setRating(finalRating)
    await updateFeedback({ userRating: finalRating === 0 ? null : finalRating })
  }

  const handleCheckboxChange = async (type: 'hasLyrics' | 'hasTranslations' | 'synced', value: boolean) => {
    // Update local state immediately for responsive UI
    switch (type) {
      case 'hasLyrics':
        setHasLyrics(value)
        break
      case 'hasTranslations':
        setHasTranslations(value)
        break
      case 'synced':
        setSynced(value)
        break
    }

    // Send update to server
    await updateFeedback({ [type]: value })
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Feedback"
      >
        <Star
          className={`w-5 h-5 ${rating > 0 ? 'fill-blue-400 text-blue-400' : 'text-gray-400'}`}
        />
        {rating > 0 && (
          <span className="absolute -top-1 -right-1 text-xs bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center">
            {rating}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[200px]">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">Rate this song</div>

          {/* Star Rating */}
          <div className="flex gap-1 mb-4">
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
                      ? 'fill-blue-400 text-blue-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            {rating === 0 ? 'Not rated' : `${rating} star${rating !== 1 ? 's' : ''}`}
          </div>

          {rating > 0 && (
            <button
              onClick={() => handleRatingChange(0)}
              className="text-xs text-red-500 hover:text-red-600 mb-4 block"
              disabled={isSaving}
            >
              Clear rating
            </button>
          )}

          {/* Checkboxes */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Status</div>

            {/* Has Lyrics */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={hasLyrics}
                  onChange={(e) => handleCheckboxChange('hasLyrics', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  hasLyrics
                    ? 'bg-green-500 border-green-500'
                    : 'bg-transparent border-gray-300 dark:border-gray-600'
                }`}>
                  {hasLyrics && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Has lyrics</span>
            </label>

            {/* Has Translations */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={hasTranslations}
                  onChange={(e) => handleCheckboxChange('hasTranslations', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  hasTranslations
                    ? 'bg-green-500 border-green-500'
                    : 'bg-transparent border-gray-300 dark:border-gray-600'
                }`}>
                  {hasTranslations && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Has translations</span>
            </label>

            {/* Synced */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={synced}
                  onChange={(e) => handleCheckboxChange('synced', e.target.checked)}
                  disabled={isSaving}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  synced
                    ? 'bg-green-500 border-green-500'
                    : 'bg-transparent border-gray-300 dark:border-gray-600'
                }`}>
                  {synced && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Synced</span>
            </label>
          </div>

          {isSaving && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Saving...
            </div>
          )}
        </div>
      )}
    </div>
  )
}