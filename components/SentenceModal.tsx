import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SkipBack, SkipForward, Play } from 'lucide-react'
import { ClickableWord } from '@/components/ClickableWord'
import { parseTextIntoWords } from '@/lib/utils'

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
  onPlayPhrase?: () => void
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
  onPlayPhrase,
  playbackRate = 1.0,
  onPlaybackRateChange,
  hasAudioControl = false
}: SentenceModalProps) {
  const [translation, setTranslation] = useState<string>('')

  useEffect(() => {
    if (isOpen && sentence) {
      // Always use pre-computed translations if available
      if (translations && translations.length > 0) {
        setTranslation(translations[0])
      } else {
        setTranslation('')
      }
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
      <DialogContent className="max-w-2xl bg-black/90 border-white/20 text-white h-[67vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center justify-center text-white">
              {totalLines > 0 && (
                <span className="text-base font-medium">
                  Line {currentLineIndex + 1} of {totalLines}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>


        <div className="flex-1 overflow-y-auto space-y-4 px-6 pb-4">
          {/* Original sentence */}
          <div className="rounded-lg bg-white/10 p-4" style={{ minHeight: '124px' }}>
            <h3 className="font-medium text-sm text-white/70 mb-2">
              Spanish
            </h3>
            <div className="text-lg text-white">
              {parseTextIntoWords(sentence).map((token, index) => (
                <ClickableWord
                  key={index}
                  word={token.word}
                  cleanWord={token.cleanWord}
                >
                  {token.word}
                </ClickableWord>
              ))}
            </div>
          </div>

          {/* Translation */}
          <div className="rounded-lg border border-white/20 p-4" style={{ minHeight: '124px' }}>
            <h3 className="font-medium text-sm text-white/70 mb-2">
              English Translation
            </h3>

            {translation ? (
              <p className="text-lg text-white">{translation}</p>
            ) : (
              <p className="text-white/70">Translation not available</p>
            )}
          </div>

          {/* Tips */}
          <div className="text-sm text-white/60">
            <p>
              💡 <strong>Tip:</strong> Click on individual words in the lyrics to see definitions and conjugations.
            </p>
          </div>
        </div>

        {/* Navigation and Playback Controls - Fixed at bottom */}
        {(onNavigatePrevious || onNavigateNext || onPlayPhrase) && (
          <div className="space-y-3 px-6 pt-4 pb-2 border-t border-white/20">
              {/* Navigation buttons */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigatePrevious}
                  disabled={currentLineIndex === 0}
                  title="Previous line"
                  className="bg-white/[0.12] border-white/20 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
                >
                  <SkipBack className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {onPlayPhrase && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPlayPhrase}
                    title="Play this phrase"
                    className="bg-white/[0.12] border-white/20 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Play phrase
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateNext}
                  disabled={currentLineIndex === totalLines - 1}
                  title="Next line"
                  className="bg-white/[0.12] border-white/20 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
                >
                  Next
                  <SkipForward className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Playback Speed Control */}
              {hasAudioControl && onPlaybackRateChange && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-white/70">Speed:</span>
                  <div className="flex gap-1">
                    {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
                      <Button
                        key={rate}
                        variant={playbackRate === rate ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPlaybackRateChange(rate)}
                        className={playbackRate === rate
                          ? "h-7 px-2 text-xs bg-white/30 border-white/30 text-white hover:bg-white/40"
                          : "h-7 px-2 text-xs bg-white/[0.12] border-white/20 text-white hover:bg-white/20 hover:text-white"
                        }
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </DialogContent>
    </Dialog>
  )
}