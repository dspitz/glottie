import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Play, X, Loader2 } from 'lucide-react'
import { parseTextIntoWords } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { defineWord } from '@/lib/client'

interface TranslationBottomSheetProps {
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
  synchronizedData?: {
    lines: Array<{
      text: string
      time?: number
      startTime?: number
      endTime?: number
    }>
  }
  onTimeSeek?: (time: number) => void
  isPlaying?: boolean
  onPlay?: () => void
  onPause?: () => void
}

export function TranslationBottomSheet({
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
  hasAudioControl = false,
  synchronizedData,
  onTimeSeek,
  isPlaying = false,
  onPlay,
  onPause
}: TranslationBottomSheetProps) {
  const [translation, setTranslation] = useState<string>('')
  const controls = useAnimation()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordDefinition, setWordDefinition] = useState<any>(null)
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false)
  const [isPlayingLine, setIsPlayingLine] = useState(false)
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen && sentence) {
      if (translations && translations.length > 0) {
        setTranslation(translations[0])
      } else {
        setTranslation('')
      }
      // Reset word selection when sentence changes
      setSelectedWord(null)
      setWordDefinition(null)
    }
  }, [isOpen, sentence, translations])

  // Handle word click
  const handleWordClick = async (word: string, cleanWord: string) => {
    // Toggle selection
    if (selectedWord === cleanWord) {
      setSelectedWord(null)
      setWordDefinition(null)
      return
    }

    // Select new word and fetch definition
    setSelectedWord(cleanWord)
    setIsLoadingDefinition(true)
    setWordDefinition(null)

    try {
      const definition = await defineWord(cleanWord.toLowerCase().trim())
      setWordDefinition(definition)
    } catch (error) {
      console.error('Failed to fetch definition:', error)
      setWordDefinition({ error: true })
    } finally {
      setIsLoadingDefinition(false)
    }
  }

  // Handle playing the current line
  const handlePlayLine = () => {
    // Clear any existing timeout
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
    }

    // Get current line timing data
    const currentLine = synchronizedData?.lines?.[currentLineIndex]
    if (!currentLine || !onTimeSeek) return

    // Calculate timing
    // The `time` field is in seconds (from original LRC format)
    // The `startTime` field is in milliseconds (from processed data)
    let startTimeMs: number
    let endTimeMs: number | undefined

    if (typeof currentLine.startTime === 'number') {
      // Already in milliseconds
      startTimeMs = currentLine.startTime
      endTimeMs = currentLine.endTime
    } else if (typeof currentLine.time === 'number') {
      // Convert from seconds to milliseconds
      startTimeMs = currentLine.time * 1000
      // For LRC format, estimate end time based on next line or add 3 seconds
      const nextLine = synchronizedData?.lines?.[currentLineIndex + 1]
      if (nextLine?.time) {
        endTimeMs = nextLine.time * 1000
      } else {
        endTimeMs = startTimeMs + 3000 // Default 3 seconds per line
      }
    } else {
      return // No timing data available
    }

    // Seek to start and play
    onTimeSeek(startTimeMs)

    // Start playback if we have play function
    if (onPlay) {
      onPlay()
      setIsPlayingLine(true)
    }

    // Set timeout to pause at end of line if we have an end time
    if (endTimeMs && onPause) {
      const duration = endTimeMs - startTimeMs
      playTimeoutRef.current = setTimeout(() => {
        onPause()
        setIsPlayingLine(false)
      }, duration)
    }
  }

  // Clean up timeout on unmount or when closing
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current)
      }
    }
  }, [])

  // Reset playing state when line changes
  useEffect(() => {
    setIsPlayingLine(false)
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = null
    }
  }, [currentLineIndex])

  // Update playing state based on external isPlaying prop
  useEffect(() => {
    if (!isPlaying) {
      setIsPlayingLine(false)
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current)
        playTimeoutRef.current = null
      }
    }
  }, [isPlaying])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          if (onNavigatePrevious && currentLineIndex > 0) {
            onNavigatePrevious()
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (onNavigateNext && currentLineIndex < totalLines - 1) {
            onNavigateNext()
          }
          break
        case 'Escape':
          event.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onNavigatePrevious, onNavigateNext, onClose, currentLineIndex, totalLines])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldClose = info.velocity.y > 20 || (info.velocity.y >= 0 && info.offset.y > 100)

    if (shouldClose) {
      controls.start({
        y: '100%',
        transition: { type: 'spring', damping: 30, stiffness: 300 }
      })
      setTimeout(onClose, 200)
    } else {
      controls.start({
        y: 0,
        transition: { type: 'spring', damping: 30, stiffness: 500 }
      })
    }
    setIsDragging(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[60]"
            style={{ backdropFilter: 'blur(32px)' }}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ y: '100%' }}
            whileInView={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[61]",
              "bg-white/80 backdrop-blur-xl",
              "rounded-t-3xl border-t border-gray-200/50",
              "h-[66vh]",
              "overflow-hidden",
              isDragging && "select-none"
            )}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full bg-gray-400" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 flex items-center justify-between relative">
              <div className="flex-1" />
              <div className="absolute left-1/2 transform -translate-x-1/2">
                {totalLines > 0 && (
                  <span className="text-sm font-medium text-gray-600">
                    Line {currentLineIndex + 1} of {totalLines}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="px-5 pb-4 space-y-4 overflow-y-auto max-h-[calc(66vh-200px)]">
              {/* Spanish Text - No box, just the text with tappable words */}
              <div className="py-2">
                <div className="text-gray-900 leading-loose flex flex-wrap gap-x-0.5 gap-y-2" style={{ fontSize: '28px' }}>
                  {parseTextIntoWords(sentence).map((token, index) => {
                    // Only wrap actual words in containers, not spaces
                    if (token.word.trim() === '') {
                      return <span key={index}>{token.word}</span>
                    }

                    const isSelected = selectedWord === token.cleanWord

                    return (
                      <span
                        key={index}
                        className="inline-block rounded px-1.5 transition-all cursor-pointer hover:scale-105 hover:shadow-sm"
                        style={{
                          backgroundColor: isSelected
                            ? (backgroundColor || '#f3f4f6')
                            : 'rgba(0,0,0,0.12)',
                          color: isSelected
                            ? (backgroundColor ? 'white' : '#111827')
                            : '#000',
                          paddingTop: '2px',
                          paddingBottom: '2px'
                        }}
                        onClick={() => handleWordClick(token.word, token.cleanWord)}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = backgroundColor || '#f3f4f6';
                            e.currentTarget.style.color = backgroundColor ? 'white' : '#111827';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)';
                            e.currentTarget.style.color = '#000';
                          }
                        }}
                      >
                        {token.word}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* English Translation or Word Definition */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur p-4 border border-gray-200">
                {selectedWord ? (
                  // Word Definition View
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedWord}
                        {wordDefinition && wordDefinition.pos && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {wordDefinition.pos}
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedWord(null)
                          setWordDefinition(null)
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        ✕ Clear
                      </button>
                    </div>

                    {isLoadingDefinition ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">Loading definition...</span>
                      </div>
                    ) : wordDefinition?.error ? (
                      <p className="text-sm text-gray-500 italic">Definition not available</p>
                    ) : wordDefinition ? (
                      <div className="space-y-3">
                        {/* Definitions */}
                        {wordDefinition.definitions && (
                          <div className="space-y-1">
                            {wordDefinition.definitions.map((def: string, index: number) => (
                              <p key={index} className="text-base text-gray-800">
                                • {def}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Examples */}
                        {wordDefinition.examples && wordDefinition.examples.length > 0 && (
                          <div className="border-t border-gray-200 pt-2">
                            <h4 className="text-xs font-medium text-gray-500 mb-1">Examples:</h4>
                            {wordDefinition.examples.slice(0, 2).map((example: string, index: number) => (
                              <p key={index} className="text-sm text-gray-600 italic">
                                "{example}"
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Conjugations for verbs */}
                        {wordDefinition.conjugations && (
                          <div className="border-t border-gray-200 pt-2">
                            <h4 className="text-xs font-medium text-gray-500 mb-2">Conjugations:</h4>

                            {/* Present tense as default open */}
                            <details className="text-sm" open>
                              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                                Present
                              </summary>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-3 mt-1 text-xs">
                                {Object.entries(wordDefinition.conjugations.presente).map(([person, form]) => (
                                  <span key={person} className="text-gray-600">
                                    {person}: <strong className="text-gray-800">{form}</strong>
                                  </span>
                                ))}
                              </div>
                            </details>

                            {/* Other tenses collapsed */}
                            {wordDefinition.conjugations.preterito && (
                              <details className="text-sm mt-2">
                                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                                  Preterite
                                </summary>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-3 mt-1 text-xs">
                                  {Object.entries(wordDefinition.conjugations.preterito).map(([person, form]) => (
                                    <span key={person} className="text-gray-600">
                                      {person}: <strong className="text-gray-800">{form}</strong>
                                    </span>
                                  ))}
                                </div>
                              </details>
                            )}

                            {wordDefinition.conjugations.imperfecto && (
                              <details className="text-sm mt-2">
                                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                                  Imperfect
                                </summary>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-3 mt-1 text-xs">
                                  {Object.entries(wordDefinition.conjugations.imperfecto).map(([person, form]) => (
                                    <span key={person} className="text-gray-600">
                                      {person}: <strong className="text-gray-800">{form}</strong>
                                    </span>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : (
                  // Full Translation View
                  <>
                    <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
                      English Translation
                    </h3>
                    {translation ? (
                      <p className="text-lg text-gray-900 leading-relaxed">{translation}</p>
                    ) : (
                      <p className="text-gray-500 italic">Translation not available</p>
                    )}
                  </>
                )}
              </div>

              {/* Tip */}
              <div className="flex items-center gap-2 px-2 py-1">
                <span className="text-sm">💡</span>
                <p className="text-xs text-gray-500">
                  {selectedWord
                    ? 'Tap the same word again or click "Clear" to see full translation'
                    : 'Tap any word above for definitions and conjugations'}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="border-t border-gray-200 px-5 py-4 space-y-3">
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onNavigatePrevious}
                  disabled={currentLineIndex === 0}
                  className="text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button
                  variant="default"
                  size="lg"
                  onClick={handlePlayLine}
                  disabled={!synchronizedData || !onTimeSeek || isPlayingLine}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-8 disabled:opacity-50"
                >
                  {isPlayingLine ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play Line
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onNavigateNext}
                  disabled={currentLineIndex === totalLines - 1}
                  className="text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Playback Speed */}
              {hasAudioControl && onPlaybackRateChange && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-500">Speed:</span>
                  <div className="flex gap-1">
                    {[0.5, 0.75, 1.0, 1.25, 1.5].map((rate) => (
                      <Button
                        key={rate}
                        variant="ghost"
                        size="sm"
                        onClick={() => onPlaybackRateChange(rate)}
                        className={cn(
                          "h-8 px-3 text-xs",
                          playbackRate === rate
                            ? "bg-blue-500 text-white"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        )}
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}