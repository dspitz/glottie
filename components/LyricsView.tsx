import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { SentenceModal } from '@/components/SentenceModal'
import { WordPopover } from '@/components/WordPopover'
import { segmentIntoSentences } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface LyricsViewProps {
  lines: string[]
  translations?: string[]
  spotifyUrl?: string
  title?: string
  artist?: string
  isDemo?: boolean
  backgroundColor?: string
}

export function LyricsView({ 
  lines, 
  translations = [], 
  spotifyUrl,
  title,
  artist,
  isDemo = false,
  backgroundColor 
}: LyricsViewProps) {
  const [selectedSentence, setSelectedSentence] = useState<string>('')
  const [selectedSentenceTranslations, setSelectedSentenceTranslations] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleSentenceClick = useCallback((sentence: string, index: number) => {
    setSelectedSentence(sentence)
    // In demo mode, use provided translations
    if (isDemo && translations[index]) {
      setSelectedSentenceTranslations([translations[index]])
    } else {
      setSelectedSentenceTranslations([])
    }
    setIsModalOpen(true)
  }, [translations, isDemo])

  const handleWordSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim()
      // Check if selection is a single word (no spaces)
      if (selectedText.split(/\s+/).length === 1 && selectedText.length > 1) {
        setSelectedWord(selectedText)
        setIsPopoverOpen(true)
      }
    }
  }, [])

  const renderLine = useCallback((line: string, lineIndex: number) => {
    const words = line.split(/(\s+)/)
    
    return (
      <div
        key={lineIndex}
        className="mb-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
        data-sentence-index={lineIndex}
        onClick={() => handleSentenceClick(line, lineIndex)}
      >
        <p 
          className="text-lg leading-relaxed select-text"
          onMouseUp={handleWordSelection}
        >
          {words.map((word, wordIndex) => (
            <span
              key={wordIndex}
              className={word.trim() ? 'hover:bg-primary/10 rounded px-0.5' : ''}
            >
              {word}
            </span>
          ))}
        </p>
      </div>
    )
  }, [handleSentenceClick, handleWordSelection])

  return (
    <div className="space-y-6">

      {/* Demo mode banner */}
      {isDemo && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start">
            <div className="text-orange-600">
              <p className="text-sm font-medium">Demo Mode</p>
              <p className="text-sm">
                Showing excerpt lines only. Full lyrics require proper licensing.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Lyrics */}
      <div className="space-y-2">
        {lines.length > 0 ? (
          lines.map((line, index) => renderLine(line, index))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No lyrics available</p>
            <p className="text-sm">Try demo mode or ensure proper API configuration</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <SentenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sentence={selectedSentence}
        translations={selectedSentenceTranslations}
        backgroundColor={backgroundColor}
      />

      {/* Word popover is handled by the selection logic */}
      {selectedWord && (
        <WordPopover
          word={selectedWord}
          isOpen={isPopoverOpen}
          onOpenChange={setIsPopoverOpen}
        >
          <span></span>
        </WordPopover>
      )}
    </div>
  )
}