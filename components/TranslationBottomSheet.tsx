import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Play, Pause, Repeat, Repeat1, Loader2 } from 'lucide-react'
import { parseTextIntoWords } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { defineWord } from '@/lib/client'
import { AudioPlayerControls } from '@/components/EnhancedAudioPlayer'

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
  // NEW: Unified controls
  audioControls?: AudioPlayerControls | null
  // Click position for contextual animation
  clickPosition?: { x: number, y: number, elementRect: DOMRect }
  // Legacy props - keep for backward compatibility
  onTimeSeek?: (time: number) => void
  isPlaying?: boolean
  onPlay?: () => void
  onPause?: () => void
  onPlayFromTime?: ((time: number) => Promise<boolean>) | null
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
  audioControls,
  clickPosition,
  onTimeSeek,
  isPlaying = false,
  onPlay,
  onPause,
  onPlayFromTime
}: TranslationBottomSheetProps) {
  const [translation, setTranslation] = useState<string>('')
  const controls = useAnimation()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordDefinition, setWordDefinition] = useState<any>(null)
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false)
  const [loopMode, setLoopMode] = useState<'off' | 'once' | 'infinite'>('off')
  const loopCountRef = useRef<number>(0)
  const lineMonitorRef = useRef<NodeJS.Timeout | null>(null)


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

  // Handle line looping
  useEffect(() => {
    // Clear any existing monitor
    if (lineMonitorRef.current) {
      clearInterval(lineMonitorRef.current)
      lineMonitorRef.current = null
    }

    // Only set up monitoring if we're playing and loop mode is active
    if (isPlaying && loopMode !== 'off' && synchronizedData) {
      const currentLine = synchronizedData.lines?.[currentLineIndex]
      if (!currentLine) return

      // Get line timing
      let startTimeMs: number
      let endTimeMs: number | undefined

      if (typeof currentLine.startTime === 'number') {
        startTimeMs = currentLine.startTime
        endTimeMs = currentLine.endTime
      } else if (typeof currentLine.time === 'number') {
        // Check if time is in ms or seconds
        if (currentLine.time > 1000) {
          startTimeMs = currentLine.time
          const nextLine = synchronizedData.lines?.[currentLineIndex + 1]
          endTimeMs = nextLine?.time || startTimeMs + 2000
        } else {
          startTimeMs = currentLine.time * 1000
          const nextLine = synchronizedData.lines?.[currentLineIndex + 1]
          endTimeMs = nextLine?.time ? nextLine.time * 1000 : startTimeMs + 2000
        }
      } else {
        return // No timing data
      }

      console.log('🔄 Loop monitoring started:', {
        loopMode,
        currentLineIndex,
        startTimeMs,
        endTimeMs,
        duration: endTimeMs ? endTimeMs - startTimeMs : 'unknown'
      })

      // Monitor for line end
      let checkCount = 0
      lineMonitorRef.current = setInterval(() => {
        checkCount++
        let currentTimeMs: number = 0

        // Get current time from audioControls if available
        if (audioControls) {
          const state = audioControls.getState()
          if (state.playbackMode === 'spotify') {
            currentTimeMs = state.currentTime || 0
          } else {
            currentTimeMs = (state.currentTime || 0) * 1000
          }
        }

        // Debug log every 10 checks (500ms)
        if (checkCount % 10 === 0) {
          console.log('🔍 Loop monitor check:', {
            checkCount,
            currentTimeMs,
            endTimeMs,
            timeUntilEnd: endTimeMs ? endTimeMs - currentTimeMs : 'N/A',
            loopMode,
            loopCount: loopCountRef.current
          })
        }

        // Check if we've reached the end of the line
        if (endTimeMs && currentTimeMs >= endTimeMs) {
          console.log('🎯 Line end reached!', {
            currentTimeMs,
            endTimeMs,
            loopMode,
            loopCount: loopCountRef.current
          })

          if (loopMode === 'once') {
            if (loopCountRef.current === 0) {
              // First loop, replay once more
              console.log('🔁 Looping once - seeking back to start')
              loopCountRef.current = 1
              if (audioControls) {
                audioControls.seek(startTimeMs)
                // Ensure playback continues
                if (!audioControls.getState().isPlaying) {
                  audioControls.play()
                }
              } else if (onTimeSeek) {
                onTimeSeek(startTimeMs)
                // Ensure playback continues with legacy
                if (!isPlaying && onPlay) {
                  setTimeout(() => onPlay(), 50)
                }
              }
            } else {
              // Already looped once, stop looping
              console.log('✅ Loop once complete - stopping loop')
              loopCountRef.current = 0
              setLoopMode('off')
              clearInterval(lineMonitorRef.current!)
              lineMonitorRef.current = null
            }
          } else if (loopMode === 'infinite') {
            // Keep looping
            console.log('♾️ Infinite loop - seeking back to start')
            if (audioControls) {
              audioControls.seek(startTimeMs)
              // Ensure playback continues
              if (!audioControls.getState().isPlaying) {
                audioControls.play()
              }
            } else if (onTimeSeek) {
              onTimeSeek(startTimeMs)
              // Ensure playback continues with legacy
              if (!isPlaying && onPlay) {
                setTimeout(() => onPlay(), 50)
              }
            }
          }
        }
      }, 50) // Check every 50ms
    }

    // Cleanup on unmount
    return () => {
      if (lineMonitorRef.current) {
        clearInterval(lineMonitorRef.current)
        lineMonitorRef.current = null
      }
    }
  }, [isPlaying, loopMode, currentLineIndex, synchronizedData, audioControls, onTimeSeek, onPlay])

  // Debug state - removed for cleaner console

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
      if (clickPosition) {
        // Animate back to exact row dimensions
        controls.start({
          y: clickPosition.elementRect.top - (window.innerHeight * 0.9 - clickPosition.elementRect.height) / 2,
          scaleY: clickPosition.elementRect.height / (window.innerHeight * 0.9),
          scaleX: clickPosition.elementRect.width / window.innerWidth,
          opacity: 0,
          borderRadius: '12px',
          transition: { type: 'spring', damping: 40, stiffness: 600 }
        })
      } else {
        controls.start({
          y: '100%',
          transition: { type: 'spring', damping: 40, stiffness: 600 }
        })
      }
      setTimeout(onClose, 200)
    } else {
      controls.start({
        y: 0,
        scaleY: 1,
        scaleX: 1,
        opacity: 1,
        borderRadius: '24px',
        transition: { type: 'spring', damping: 40, stiffness: 600 }
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
            initial={clickPosition ? {
              // Start with exact row dimensions
              y: clickPosition.elementRect.top - (window.innerHeight * 0.9 - clickPosition.elementRect.height) / 2,
              scaleY: clickPosition.elementRect.height / (window.innerHeight * 0.9), // Scale to match row height
              scaleX: clickPosition.elementRect.width / window.innerWidth, // Scale to match row width
              opacity: 0.8,
              borderRadius: '12px'
            } : {
              // Default: slide up from bottom
              y: '100%'
            }}
            whileInView={clickPosition ? {
              // Grow to full modal size
              y: 0,
              scaleY: 1,
              scaleX: 1,
              opacity: 1,
              borderRadius: '24px'
            } : {
              y: 0
            }}
            exit={clickPosition ? {
              // Shrink back to exact row dimensions
              y: clickPosition.elementRect.top - (window.innerHeight * 0.9 - clickPosition.elementRect.height) / 2,
              scaleY: clickPosition.elementRect.height / (window.innerHeight * 0.9),
              scaleX: clickPosition.elementRect.width / window.innerWidth,
              opacity: 0,
              borderRadius: '12px'
            } : {
              y: '100%'
            }}
            transition={{
              type: 'spring',
              damping: 40,
              stiffness: 600
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[61]",
              "bg-white/50",
              "rounded-t-3xl border-t border-gray-200/50",
              "h-[90vh]",
              "overflow-hidden flex flex-col",
              isDragging && "select-none"
            )}
            style={{
              backdropFilter: 'blur(96px)',
              transformOrigin: clickPosition ?
                'center center' :
                'center bottom'
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full bg-gray-400" />
            </div>

            {/* Header */}
            <motion.div
              className="px-3 pb-3 mb-10 flex items-center justify-between relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.05 } }}>
              <div className="bg-background/80 backdrop-blur-sm rounded-full">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onClose()
                  }}
                  className="h-9 w-9 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2">
                {totalLines > 0 && (
                  <span className="text-sm font-medium text-gray-900">
                    Line {currentLineIndex + 1} of {totalLines}
                  </span>
                )}
              </div>
              <div className="flex-1" />
            </motion.div>

            {/* Content */}
            <motion.div
              className="px-3 pb-4 space-y-4 overflow-y-auto flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.05 } }}
              onMouseDown={(e) => {
                // Pause on mouse down on lyrics area (excluding buttons and controls)
                if (!(e.target as HTMLElement).closest('button') &&
                    !(e.target as HTMLElement).closest('.no-pause-zone')) {
                  if (audioControls?.pause) {
                    audioControls.pause()
                  } else if (onPause && isPlaying) {
                    onPause()
                  }
                }
              }}
              onTouchStart={(e) => {
                // Pause on touch start on lyrics area (excluding buttons and controls)
                if (!(e.target as HTMLElement).closest('button') &&
                    !(e.target as HTMLElement).closest('.no-pause-zone')) {
                  if (audioControls?.pause) {
                    audioControls.pause()
                  } else if (onPause && isPlaying) {
                    onPause()
                  }
                }
              }}
            >
              {/* Spanish Text - No box, just the text with tappable words */}
              <div>
                <div
                  className="bubble flex flex-wrap items-start content-start gap-x-0.5 gap-y-2 p-4 rounded-lg"
                  style={{
                    fontSize: '30px',
                    lineHeight: '36px',
                    fontWeight: 400,
                    color: '#000',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    boxShadow: 'inset rgba(255,255,255,0.4) 20px 30px 70px, rgba(0,0,0,0.1) 10px 20px 40px',
                    // Height calculation for 3 lines minimum:
                    // 3 lines × 36px line height = 108px
                    // + word wrapper padding (4px per line) = 12px
                    // + container padding (16px top + 16px bottom) = 32px
                    // + gap between lines (2 gaps × 8px) = 16px
                    // Total: 168px
                    minHeight: '168px',
                    maxHeight: 'none', // Allow expansion for 4-5 lines
                    overflow: 'auto'
                  }}>
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
              {selectedWord ? (
                // Word Definition View - Keep the box for definitions
                <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur p-4 border border-gray-200">
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
                </div>
              ) : (
                // Full Translation View - Same container style as lyrics
                <div>
                  <div
                    className="flex flex-wrap items-start content-start gap-x-0.5 gap-y-2 p-4 rounded-lg"
                    style={{
                      fontSize: '30px',
                      lineHeight: '36px',
                      fontWeight: 400,
                      color: 'rgba(0, 0, 0, 0.67)',
                      backgroundColor: 'rgba(255, 255, 255, 0)',
                      // Match the lyrics container height (3 lines minimum)
                      minHeight: '168px',
                      maxHeight: 'none', // Allow expansion for 4-5 lines
                      overflow: 'auto'
                    }}
                  >
                    {translation ? (
                      <p>{translation}</p>
                    ) : (
                      <p className="italic">Translation not available</p>
                    )}
                  </div>
                </div>
              )}

            </motion.div>

            {/* Controls - Fixed to bottom */}
            <motion.div
              className="px-3 py-4 space-y-3 no-pause-zone"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.05 } }}>
              {/* Navigation */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Reset loop mode when changing lines
                    setLoopMode('off')
                    loopCountRef.current = 0
                    // Navigate to previous line
                    if (onNavigatePrevious) {
                      onNavigatePrevious()
                    }
                    // Pause the music after navigation (only if playing)
                    setTimeout(() => {
                      if (audioControls) {
                        const state = audioControls.getState()
                        if (state.isPlaying) {
                          audioControls.pause()
                        }
                      } else if (isPlaying && onPause) {
                        onPause()
                      }
                    }, 100)
                  }}
                  disabled={currentLineIndex === 0}
                  className="text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Play/Pause Button */}
                <Button
                  variant="default"
                  size="lg"
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (audioControls) {
                      // Use the unified controls for synchronized state
                      await audioControls.togglePlayPause()
                    } else if (onPlay && onPause) {
                      // Fallback to legacy callbacks
                      if (isPlaying) {
                        onPause()
                      } else {
                        onPlay()
                      }
                    }
                  }}
                  disabled={!audioControls && !onPlay && !onPause}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                {/* Loop Button */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Cycle through loop modes: off -> once -> infinite -> off
                    if (loopMode === 'off') {
                      setLoopMode('once')
                      loopCountRef.current = 0
                    } else if (loopMode === 'once') {
                      setLoopMode('infinite')
                      loopCountRef.current = 0
                    } else {
                      setLoopMode('off')
                      loopCountRef.current = 0
                    }
                  }}
                  disabled={!synchronizedData}
                  className={cn(
                    "relative",
                    loopMode === 'off'
                      ? "text-gray-400 hover:bg-gray-100"
                      : loopMode === 'once'
                      ? "text-orange-500 hover:bg-orange-50"
                      : "text-green-500 hover:bg-green-50"
                  )}
                  title={
                    loopMode === 'off'
                      ? "Loop: Off"
                      : loopMode === 'once'
                      ? "Loop: Once"
                      : "Loop: Infinite"
                  }
                >
                  {loopMode === 'once' ? (
                    <Repeat1 className="h-5 w-5" />
                  ) : (
                    <Repeat className="h-5 w-5" />
                  )}
                  {/* Indicator dot for active states */}
                  {loopMode !== 'off' && (
                    <span
                      className={cn(
                        "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
                        loopMode === 'once' ? "bg-orange-500" : "bg-green-500"
                      )}
                    />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Reset loop mode when changing lines
                    setLoopMode('off')
                    loopCountRef.current = 0
                    // Navigate to next line
                    if (onNavigateNext) {
                      onNavigateNext()
                    }
                    // Pause the music after navigation (only if playing)
                    setTimeout(() => {
                      if (audioControls) {
                        const state = audioControls.getState()
                        if (state.isPlaying) {
                          audioControls.pause()
                        }
                      } else if (isPlaying && onPause) {
                        onPause()
                      }
                    }, 100)
                  }}
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
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}