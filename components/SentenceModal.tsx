import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { translateText } from '@/lib/client'
import { Loader2, SkipBack, SkipForward, RotateCcw } from 'lucide-react'

interface SentenceModalProps {
  isOpen: boolean
  onClose: () => void
  sentence: string
  translations?: string[]
  backgroundColor?: string
  currentLineIndex?: number
  totalLines?: number
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
  onRepeat?: () => void
  isRepeating?: boolean
  playbackRate?: number
  onPlaybackRateChange?: (rate: number) => void
  hasAudioControl?: boolean
}

export function SentenceModal({
  isOpen,
  onClose,
  sentence,
  translations,
  backgroundColor,
  currentLineIndex = 0,
  totalLines = 0,
  onNavigatePrevious,
  onNavigateNext,
  onRepeat,
  isRepeating = false,
  playbackRate = 1.0,
  onPlaybackRateChange,
  hasAudioControl = false
}: SentenceModalProps) {
  const [translation, setTranslation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen && sentence) {
      // If we have pre-computed translations (demo mode), use those
      if (translations && translations.length > 0) {
        setTranslation(translations[0])
        setIsLoading(false)
        setError('')
        return
      }

      // Otherwise fetch translation
      setIsLoading(true)
      setError('')
      
      translateText(sentence)
        .then((result) => {
          setTranslation(result.translation)
        })
        .catch((err) => {
          setError('Failed to translate sentence')
          console.error('Translation error:', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, sentence, translations])

  // Apply background color when modal opens
  useEffect(() => {
    if (isOpen && backgroundColor && typeof window !== 'undefined') {
      // Create or update style element for modal background
      let styleEl = document.getElementById('modal-bg-style') as HTMLStyleElement
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = 'modal-bg-style'
        document.head.appendChild(styleEl)
      }
      
      styleEl.textContent = `
        [data-state="open"] {
          background-color: ${backgroundColor} !important;
        }
        
        .modal-overlay {
          background-color: ${backgroundColor}80 !important;
        }
      `
      
      return () => {
        styleEl?.remove()
      }
    }
  }, [isOpen, backgroundColor])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span>Sentence Translation</span>
              {totalLines > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  Line {currentLineIndex + 1} of {totalLines}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Navigation and Playback Controls */}
        {(onNavigatePrevious || onNavigateNext || onRepeat) && (
          <div className="space-y-3 pb-4 border-b">
            {/* Navigation buttons */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigatePrevious}
                disabled={currentLineIndex === 0}
                title="Previous line"
              >
                <SkipBack className="w-4 h-4 mr-1" />
                Previous
              </Button>

              {onRepeat && (
                <Button
                  variant={isRepeating ? "default" : "outline"}
                  size="sm"
                  onClick={onRepeat}
                  title="Repeat current line"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  {isRepeating ? "Stop Repeat" : "Repeat"}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateNext}
                disabled={currentLineIndex === totalLines - 1}
                title="Next line"
              >
                Next
                <SkipForward className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Playback Speed Control */}
            {hasAudioControl && onPlaybackRateChange && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">Speed:</span>
                <div className="flex gap-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
                    <Button
                      key={rate}
                      variant={playbackRate === rate ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPlaybackRateChange(rate)}
                      className="h-7 px-2 text-xs"
                    >
                      {rate}x
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-4">
          {/* Original sentence */}
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Spanish
            </h3>
            <p className="text-lg">{sentence}</p>
          </div>

          {/* Translation */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              English Translation
            </h3>
            
            {isLoading && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </div>
            )}
            
            {error && (
              <p className="text-destructive">{error}</p>
            )}
            
            {!isLoading && !error && translation && (
              <p className="text-lg">{translation}</p>
            )}
          </div>

          {/* Tips */}
          <div className="text-sm text-muted-foreground">
            <p>
              💡 <strong>Tip:</strong> Click on individual words in the lyrics to see definitions and conjugations.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}