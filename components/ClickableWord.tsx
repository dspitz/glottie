import React, { useState } from 'react'
import { WordPopover } from '@/components/WordPopover'

interface ClickableWordProps {
  word: string
  cleanWord: string
  children: React.ReactNode
  onWordClick?: (word: string) => void
}

export function ClickableWord({ word, cleanWord, children, onWordClick }: ClickableWordProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleClick = async () => {
    if (cleanWord.length > 1) { // Only show popover for words longer than 1 character
      setIsPopoverOpen(true)
      onWordClick?.(cleanWord)

      // Track word click
      try {
        await fetch('/api/word-clicks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ word: cleanWord }),
        })
      } catch (error) {
        console.error('Failed to track word click:', error)
      }
    }
  }

  // Don't make very short words or punctuation-only clickable
  const isClickable = cleanWord.length > 1 && /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(cleanWord)

  if (!isClickable) {
    return <span>{children}</span>
  }

  return (
    <WordPopover
      word={cleanWord}
      isOpen={isPopoverOpen}
      onOpenChange={setIsPopoverOpen}
    >
      <span
        className="cursor-pointer transition-colors duration-200 inline-block"
        onClick={handleClick}
        title={`Click to define "${cleanWord}"`}
      >
        {children}
      </span>
    </WordPopover>
  )
}