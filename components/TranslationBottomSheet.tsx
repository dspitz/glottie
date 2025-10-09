import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Play, Pause, Loader2, RefreshCw } from 'lucide-react'
import { parseTextIntoWords } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { defineWord } from '@/lib/client'
import { AudioPlayerControls } from '@/components/EnhancedAudioPlayer'
import { LineBookmarkButton } from '@/components/LineBookmarkButton'
import confetti from 'canvas-confetti'

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
  onSetLineLock?: (locked: boolean, lineIndex?: number) => void
  // For line bookmarking
  songId?: string
  songTitle?: string
  songArtist?: string
  songLanguage?: string
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
  onPlayFromTime,
  onSetLineLock,
  songId,
  songTitle,
  songArtist,
  songLanguage
}: TranslationBottomSheetProps) {
  // Debug: Log bookmark props
  // console.log('📑 TranslationBottomSheet bookmark props:', { songId, songTitle, songArtist, currentLineIndex })

  const [translation, setTranslation] = useState<string>('')
  const controls = useAnimation()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordDefinition, setWordDefinition] = useState<any>(null)
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false)
  const [isRepeatingLine, setIsRepeatingLine] = useState(false)
  // Removed looping functionality
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

  // Removed loop monitoring since looping functionality has been disabled
  useEffect(() => {
    // Clean up any existing monitoring on unmount
    return () => {
      if (lineMonitorRef.current) {
        clearInterval(lineMonitorRef.current)
        lineMonitorRef.current = null
      }
    }
  }, [])

  // Legacy loop effect - disabled since looping has been removed
  useEffect(() => {
    // This entire effect was for loop monitoring which has been removed
    if (false) {
      const currentLine = synchronizedData.lines?.[currentLineIndex]
      if (!currentLine) {
        // console.log('⚠️ No current line found at index:', currentLineIndex)
        return
      }

      // Get line timing - All times should be in milliseconds internally
      let startTimeMs: number
      let endTimeMs: number | undefined

      // First normalize the start time
      if (typeof currentLine.startTime === 'number') {
        // startTime/endTime are always in milliseconds
        startTimeMs = currentLine.startTime
        endTimeMs = currentLine.endTime
      } else if (typeof currentLine.time === 'number') {
        // For LRC format, times are typically in seconds with decimals
        // We should check the format type instead of using arbitrary threshold
        // LRC times are in seconds, so convert to milliseconds
        startTimeMs = currentLine.time * 1000
      } else {
        return // No timing data
      }

      // Now calculate end time if not provided
      if (!endTimeMs) {
        const nextLine = synchronizedData.lines?.[currentLineIndex + 1]

        if (nextLine) {
          // Try to get next line's start time
          if (typeof nextLine.time === 'number') {
            // LRC format times are in seconds, convert to milliseconds
            endTimeMs = nextLine.time * 1000
          } else if (typeof nextLine.startTime === 'number') {
            // startTime is already in milliseconds
            endTimeMs = nextLine.startTime
          }
        }

        // If we still don't have an end time, it means this is probably the last line
        // or the timing data is incomplete
        if (!endTimeMs) {
          // Check if there's any line after this with timing to estimate duration
          for (let i = currentLineIndex + 1; i < synchronizedData.lines.length; i++) {
            const futureLine = synchronizedData.lines[i]
            if (futureLine?.time || futureLine?.startTime) {
              const futureTime = futureLine.time
                ? futureLine.time * 1000  // LRC format: always in seconds, convert to ms
                : futureLine.startTime    // Already in milliseconds
              if (futureTime) {
                // Use the time to the next line with timing
                endTimeMs = futureTime
                break
              }
            }
          }

          // Final fallback: use 5 seconds default
          if (!endTimeMs) {
            endTimeMs = startTimeMs + 5000
          }
        }
      }

      // Add 200ms buffer to the end time for loop monitoring
      const loopEndBufferMs = 200
      const bufferedEndTimeMs = endTimeMs ? endTimeMs + loopEndBufferMs : endTimeMs

      // console.log('🔄 Loop monitoring started:', {
      //   loopMode,
      //   currentLineIndex,
      //   startTimeMs,
      //   endTimeMs: bufferedEndTimeMs,
      //   duration: bufferedEndTimeMs ? bufferedEndTimeMs - startTimeMs : 'unknown',
      //   buffer: loopEndBufferMs,
      //   lineText: currentLine.text || 'No text',
      //   nextLine: synchronizedData.lines?.[currentLineIndex + 1]?.text || 'No next line'
      // })

      // Monitor for line end
      let checkCount = 0
      lineMonitorRef.current = setInterval(() => {
        checkCount++
        let currentTimeMs: number = 0

        // Get current time from audioControls if available
        if (audioControls) {
          const state = audioControls.getState()
          // getState() now always returns currentTime in milliseconds
          currentTimeMs = state.currentTime || 0
        } else {
          // console.warn('⚠️ No audioControls available in loop monitor')
        }

        // Debug log every 10 checks (500ms)
        if (checkCount % 10 === 0) {
          // console.log('🔍 Loop monitor check:', {
          //   checkCount,
          //   currentTimeMs,
          //   endTimeMs: bufferedEndTimeMs,
          //   timeUntilEnd: bufferedEndTimeMs ? bufferedEndTimeMs - currentTimeMs : 'N/A',
          //   loopMode,
          //   loopCount: loopCountRef.current
          // })
        }

        // Check if we've reached the end of the line
        // Calculate progress through the line
        const lineProgress = bufferedEndTimeMs ? (currentTimeMs - startTimeMs) / (bufferedEndTimeMs - startTimeMs) : 0

        // Trigger when we've reached or passed the buffered end time
        // Using buffered end time to allow line to play fully
        if (bufferedEndTimeMs && currentTimeMs >= bufferedEndTimeMs) {
          // console.log('🎯 Line end reached!', {
          //   currentTimeMs,
          //   endTimeMs: bufferedEndTimeMs,
          //   lineProgress: `${(lineProgress * 100).toFixed(1)}%`,
          //   actualDuration: currentTimeMs - startTimeMs,
          //   expectedDuration: bufferedEndTimeMs - startTimeMs,
          //   loopMode,
          //   loopCount: loopCountRef.current
          // })

          if (loopMode === 'once') {
            if (loopCountRef.current === 0) {
              // First loop, replay once more
              // console.log('🔁 Looping once - seeking back to start')
              loopCountRef.current = 1
              if (audioControls) {
                audioControls.seek(startTimeMs)
                // Ensure playback continues
                if (!audioControls.getState().isPlaying) {
                  audioControls.play()
                }
              } else if (onTimeSeek) {
                onTimeSeek(startTimeMs)
              }
            } else {
              // Already looped once, stop looping
              // console.log('✅ Loop once complete - stopping loop')
              loopCountRef.current = 0
              setLoopMode('off')
              clearInterval(lineMonitorRef.current!)
              lineMonitorRef.current = null
            }
          } else if (loopMode === 'infinite') {
            // Keep looping
            // console.log('♾️ Infinite loop - seeking back to start')
            if (audioControls) {
              audioControls.seek(startTimeMs)
              // Ensure playback continues
              if (!audioControls.getState().isPlaying) {
                audioControls.play()
              }
            } else if (onTimeSeek) {
              onTimeSeek(startTimeMs)
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
  }, []) // Empty dependency array since this effect is disabled

  // Debug state - removed for cleaner console

  // Handle word click
  const handleWordClick = async (word: string, cleanWord: string) => {
    // Pause music when clicking on a word to look up definition
    audioControls?.pause()

    const normalizedWord = cleanWord.toLowerCase().trim()

    // Select new word and fetch definition first
    setSelectedWord(cleanWord)
    setIsLoadingDefinition(true)
    setWordDefinition(null)

    let definition = null
    try {
      definition = await defineWord(normalizedWord)
      setWordDefinition(definition)
    } catch (error) {
      console.error('Failed to fetch definition:', error)
      setWordDefinition({ error: true })
    } finally {
      setIsLoadingDefinition(false)
    }

    // Track word click with translation and definition
    // console.log('📊 Tracking word click:', normalizedWord)
    fetch('/api/word-clicks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word: normalizedWord,
        translation: definition?.definitions?.[0] || null,
        definition: definition ? JSON.stringify(definition) : null
      }),
    }).catch((err) => {
      console.error('Failed to track word click:', err)
    })

    // Toggle selection
    if (selectedWord === cleanWord) {
      setSelectedWord(null)
      setWordDefinition(null)
      return
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
              {songId && (
                <div className="bg-background/80 backdrop-blur-sm rounded-full">
                  <LineBookmarkButton
                    songId={songId}
                    songTitle={songTitle}
                    songArtist={songArtist}
                    songLanguage={songLanguage}
                    lineText={sentence}
                    lineTranslation={translation}
                    lineIndex={currentLineIndex}
                    className="h-9 w-9"
                  />
                </div>
              )}
            </motion.div>

            {/* Content */}
            <motion.div
              className="px-3 pb-4 space-y-4 overflow-y-auto flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.05 } }}
              onMouseDown={(e) => {
                // No longer pause on general clicks - only pause when clicking on words
              }}
              onTouchStart={(e) => {
                // No longer pause on general touches - only pause when clicking on words
              }}
            >
              {/* Spanish Text - No box, just the text with tappable words */}
              <div>
                <div
                  className="bubble flex flex-wrap items-start content-start gap-x-0.5 gap-y-2 p-4 rounded-lg"
                  style={{
                    fontSize: '28px',
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
                // Word Definition View - Match translation container style
                <div>
                  <div
                    className="flex flex-col p-4 rounded-lg"
                    style={{
                      fontSize: '24px',
                      lineHeight: '32px',
                      fontWeight: 400,
                      color: 'rgba(0, 0, 0, 0.80)',
                      backgroundColor: 'rgba(0, 0, 0, 0.06)',
                      minHeight: '168px',
                      maxHeight: 'none',
                      overflow: 'auto'
                    }}
                  >
                    {/* Word Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-medium" style={{ color: 'rgba(0, 0, 0, 0.90)' }}>
                        {selectedWord}
                        {wordDefinition && wordDefinition.pos && (
                          <span className="ml-2 text-sm opacity-60">
                            ({wordDefinition.pos})
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedWord(null)
                          setWordDefinition(null)
                        }}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                        style={{ color: 'rgba(0, 0, 0, 0.80)' }}
                      >
                        Got it
                      </button>
                    </div>

                    {isLoadingDefinition ? (
                      <div className="space-y-2">
                        {/* Just 2 shimmer lines to maintain container size */}
                        <div className="h-7 rounded animate-pulse" style={{
                          width: '85%',
                          background: 'linear-gradient(90deg, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.03) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite'
                        }} />
                        <div className="h-7 rounded animate-pulse" style={{
                          width: '70%',
                          background: 'linear-gradient(90deg, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.03) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.5s infinite'
                        }} />
                      </div>
                    ) : wordDefinition?.error ? (
                      <p className="italic opacity-60">Definition not available</p>
                    ) : wordDefinition ? (
                      <div className="space-y-3">
                        {/* Definitions */}
                        {wordDefinition.definitions && (
                          <div className="space-y-2">
                            {wordDefinition.definitions.map((def: string, index: number) => (
                              <p key={index} style={{ fontSize: '20px', lineHeight: '28px' }}>
                                • {def}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Examples */}
                        {wordDefinition.examples && wordDefinition.examples.length > 0 && (
                          <div className="pt-3" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                            <h4 className="font-medium mb-2 opacity-60" style={{ fontSize: '18px' }}>Examples:</h4>
                            {wordDefinition.examples.slice(0, 2).map((example: string, index: number) => (
                              <p key={index} className="italic opacity-70 mb-1" style={{ fontSize: '18px', lineHeight: '26px' }}>
                                "{example}"
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Conjugations for verbs */}
                        {wordDefinition.conjugations && (
                          <div className="pt-3" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                            <h4 className="font-medium mb-2 opacity-60" style={{ fontSize: '18px' }}>Conjugations:</h4>

                            {/* Present tense as default open */}
                            <details open>
                              <summary className="cursor-pointer font-medium opacity-70 hover:opacity-100" style={{ fontSize: '16px' }}>
                                Present
                              </summary>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-3 mt-2" style={{ fontSize: '16px' }}>
                                {Object.entries(wordDefinition.conjugations.presente).map(([person, form]) => (
                                  <span key={person} className="opacity-70">
                                    {person}: <strong className="opacity-90">{form}</strong>
                                  </span>
                                ))}
                              </div>
                            </details>

                            {/* Other tenses collapsed */}
                            {wordDefinition.conjugations.preterito && (
                              <details className="mt-2">
                                <summary className="cursor-pointer font-medium opacity-70 hover:opacity-100" style={{ fontSize: '16px' }}>
                                  Preterite
                                </summary>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-3 mt-2" style={{ fontSize: '16px' }}>
                                  {Object.entries(wordDefinition.conjugations.preterito).map(([person, form]) => (
                                    <span key={person} className="opacity-70">
                                      {person}: <strong className="opacity-90">{form}</strong>
                                    </span>
                                  ))}
                                </div>
                              </details>
                            )}

                            {wordDefinition.conjugations.imperfecto && (
                              <details className="mt-2">
                                <summary className="cursor-pointer font-medium opacity-70 hover:opacity-100" style={{ fontSize: '16px' }}>
                                  Imperfect
                                </summary>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-3 mt-2" style={{ fontSize: '16px' }}>
                                  {Object.entries(wordDefinition.conjugations.imperfecto).map(([person, form]) => (
                                    <span key={person} className="opacity-70">
                                      {person}: <strong className="opacity-90">{form}</strong>
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
                </div>
              ) : (
                // Full Translation View - Same container style as lyrics
                <div>
                  <div
                    className="flex flex-wrap items-start content-start gap-x-0.5 gap-y-2 p-4 rounded-lg"
                    style={{
                      fontSize: '28px',
                      lineHeight: '36px',
                      fontWeight: 400,
                      color: 'rgba(0, 0, 0, 0.80)',
                      backgroundColor: 'rgba(0, 0, 0, 0.06)',
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
              className="px-2 pt-4 pb-6 space-y-3 no-pause-zone"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.05 } }}>
              {/* Navigation */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    // No loop mode to reset anymore
                    // Navigate to previous line
                    if (onNavigatePrevious) {
                      onNavigatePrevious()
                    }
                  }}
                  disabled={currentLineIndex === 0}
                  className="text-gray-700 hover:bg-gray-100 disabled:opacity-30 h-8 w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Play Line Button - Plays current line from start and auto-pauses at end */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={(e) => {
                    e.stopPropagation()
                    // console.log('🎵 Play Line button clicked', {
                    //   currentLineIndex,
                    //   hasOnSetLineLock: !!onSetLineLock,
                    //   hasSynchronizedData: !!synchronizedData,
                    //   linesCount: synchronizedData?.lines?.length
                    // })

                    // Get line timing if available
                    if (synchronizedData?.lines?.[currentLineIndex]) {
                      setIsRepeatingLine(true) // Start rotating animation
                      const currentLine = synchronizedData.lines[currentLineIndex]
                      const nextLine = synchronizedData.lines[currentLineIndex + 1]

                      // Debug log to see what timing data we have
                      // console.log('📊 Line timing data:', {
                      //   currentLineIndex,
                      //   currentLine: {
                      //     text: currentLine.text,
                      //     time: currentLine.time,
                      //     startTime: currentLine.startTime,
                      //     endTime: currentLine.endTime,
                      //     duration: currentLine.duration,
                      //     words: currentLine.words?.length,
                      //     rawData: currentLine
                      //   },
                      //   nextLine: nextLine ? {
                      //     text: nextLine.text,
                      //     time: nextLine.time,
                      //     startTime: nextLine.startTime,
                      //     endTime: nextLine.endTime,
                      //     rawData: nextLine
                      //   } : null,
                      //   previousLine: currentLineIndex > 0 ? {
                      //     text: synchronizedData.lines[currentLineIndex - 1].text,
                      //     endTime: synchronizedData.lines[currentLineIndex - 1].endTime
                      //   } : null
                      // })

                      // Expand the raw data to see all properties
                      // console.log('🔍 Current line raw data:', JSON.stringify(currentLine, null, 2))
                      if (nextLine) {
                        // console.log('🔍 Next line raw data:', JSON.stringify(nextLine, null, 2))
                      }

                      // Calculate start time
                      let startTimeMs: number
                      if (typeof currentLine.time === 'number') {
                        // Check if it's likely in seconds (< 1000) or milliseconds
                        startTimeMs = currentLine.time < 1000 ? currentLine.time * 1000 : currentLine.time
                      } else if (typeof currentLine.startTime === 'number') {
                        startTimeMs = currentLine.startTime
                      } else {
                        // console.warn('No timing data for current line')
                        return
                      }

                      // Calculate end time for auto-pause
                      let endTimeMs: number | undefined
                      let endTimeSource = 'unknown'

                      // ALWAYS use next line's start time as the end time
                      // Ignore stored endTime as it may be incorrect (set by fallback logic)
                      if (nextLine) {
                        // Use next line's start time as end time
                        if (typeof nextLine.time === 'number') {
                          // LRC format - convert seconds to milliseconds
                          endTimeMs = nextLine.time * 1000
                          endTimeSource = 'nextLine.time (converted from seconds)'
                        } else if (typeof nextLine.startTime === 'number') {
                          endTimeMs = nextLine.startTime
                          endTimeSource = 'nextLine.startTime'
                        }
                      } else {
                        // Last line - use remaining song duration
                        // This is the only case where we might need to estimate
                        // console.warn('⚠️ Last line - using remaining song duration')
                        // Could potentially use song duration here if available
                        // For now, use a longer default for last line
                        endTimeMs = startTimeMs + 5000 // 5 seconds for last line
                        endTimeSource = 'last line default (5s)'
                      }

                      // Log where we got the end time from
                      // console.log('⏰ End time source:', endTimeSource, 'value:', endTimeMs)

                      // Add 200ms buffer to the end to let the line finish completely
                      const endBufferMs = 200

                      // No buffer - use exact start time to prevent display jumping
                      const bufferMs = 0  // No buffer to avoid display issues
                      const adjustedStartMs = startTimeMs  // Use exact start time

                      // console.log('🎯 Playing line:', {
                      //   startTime: startTimeMs,
                      //   endTime: endTimeMs,
                      //   duration: endTimeMs - startTimeMs,
                      //   endTimeSource,
                      //   lineText: currentLine.text,
                      //   currentLineIndex
                      // })

                      // FIRST: Enable line lock mode BEFORE seeking to prevent display issues
                      if (onSetLineLock) {
                        // console.log('🔒 Enabling line lock mode for line', currentLineIndex)
                        onSetLineLock(true, currentLineIndex)
                      }

                      // Clear any existing pause timer
                      if (lineMonitorRef.current) {
                        clearInterval(lineMonitorRef.current)
                        lineMonitorRef.current = null
                      }

                      // THEN: Seek to buffered start position and play
                      if (audioControls) {
                        // Longer delay to ensure React state updates have propagated
                        setTimeout(() => {
                          // console.log('⏩ Seeking to adjusted start time:', adjustedStartMs)
                          audioControls.seek(adjustedStartMs)

                          // Another small delay to ensure seek completes, then play
                          setTimeout(() => {
                            if (!audioControls.getState().isPlaying) {
                              // console.log('▶️ Starting playback')
                              audioControls.play()
                            }

                            // Set up auto-pause at line end (always enabled now that looping is removed)
                            // Calculate pause duration from original start (not buffered) plus end buffer
                            const pauseDuration = (endTimeMs! - startTimeMs) + endBufferMs
                            // console.log('⏱️ Setting auto-pause timer for:', pauseDuration, 'ms (includes', endBufferMs, 'ms buffer)')

                            // Use a single timeout for precise pause timing
                            setTimeout(() => {
                              const state = audioControls.getState()
                              // Only pause if we're still playing
                              if (state.isPlaying) {
                                // console.log('⏸️ Auto-pausing at line end')
                                audioControls.pause()
                                setIsRepeatingLine(false) // Stop rotating animation
                                // Disable line lock after playing the line
                                if (onSetLineLock) {
                                  // console.log('🔓 Disabling line lock mode')
                                  onSetLineLock(false)
                                }
                              }
                            }, pauseDuration)
                          }, 50)
                        }, 100)  // Increased delay to ensure state updates propagate
                      } else if (onTimeSeek) {
                        onTimeSeek(adjustedStartMs)
                        if (onPlay && !isPlaying) {
                          setTimeout(() => onPlay(), 50)
                        }
                      }
                    }
                  }}
                  disabled={!synchronizedData || !audioControls}
                  className="text-gray-700 hover:bg-gray-100 flex flex-1 h-12 items-center justify-between pl-5 pr-3.5 rounded-full"
                  title="Repeat current line from start"
                >
                  <span>Repeat line</span>
                  <RefreshCw className={`h-4 w-4 ${isRepeatingLine ? 'animate-spin' : ''}`} />
                </Button>

                {/* Play/Pause Button */}
                <Button
                  variant="default"
                  size="default"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Toggle play/pause
                    if (isPlaying) {
                      audioControls?.pause()
                    } else {
                      // When starting song playback, always disable line lock to allow auto-advancing
                      if (onSetLineLock) {
                        // console.log('🔓 Play song clicked - disabling line lock for auto-advance')
                        onSetLineLock(false)
                      } else {
                        // console.warn('⚠️ onSetLineLock is not defined!')
                      }
                      audioControls?.play()
                    }
                  }}
                  disabled={!audioControls}
                  className="bg-black hover:bg-gray-800 text-white flex flex-1 h-12 items-center justify-between pl-5 pr-3.5 rounded-full"
                >
                  {isPlaying ? (
                    <>
                      <span>Pause song</span>
                      <Pause className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>Play song</span>
                      <Play className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    // No loop mode to reset anymore
                    // Navigate to next line
                    if (onNavigateNext) {
                      onNavigateNext()
                    }
                  }}
                  disabled={currentLineIndex === totalLines - 1}
                  className="text-gray-700 hover:bg-gray-100 disabled:opacity-30 h-8 w-8"
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