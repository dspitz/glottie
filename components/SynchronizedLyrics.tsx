'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { SentenceModal } from '@/components/SentenceModal'
import { WordPopover } from '@/components/WordPopover'
import { translateText } from '@/lib/client'
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react'
import { LyricsLine, LyricsWord } from '@/packages/adapters/lyricsProvider'

interface Word {
  text: string
  startTime: number
  endTime: number
  isWhitespace?: boolean
}

interface Line {
  text: string
  words: Word[]
  startTime: number
  endTime: number
}

interface SynchronizedLyricsProps {
  lines: string[]
  currentTime: number // in milliseconds for Spotify, seconds for preview
  duration: number // in milliseconds for Spotify, seconds for preview
  isPlaying: boolean
  playbackMode: 'spotify' | 'preview' | 'unavailable'
  translations?: string[] | { [lang: string]: string[] }
  isDemo?: boolean
  backgroundColor?: string
  onTimeSeek?: (timeInMs: number) => void
  playbackRate?: number
  onPlaybackRateChange?: (rate: number) => void
  // New prop for real synchronized lyrics data
  synchronizedData?: {
    lines: LyricsLine[]
    hasWordTiming: boolean
    format: 'lrc' | 'estimated' | 'dfxp'
    duration?: number
  }
}

export function SynchronizedLyrics({
  lines,
  currentTime,
  duration,
  isPlaying,
  playbackMode,
  translations,
  isDemo = false,
  backgroundColor,
  onTimeSeek,
  playbackRate = 1.0,
  onPlaybackRateChange,
  synchronizedData
}: SynchronizedLyricsProps) {
  const [selectedSentence, setSelectedSentence] = useState<string>('')
  const [selectedSentenceTranslations, setSelectedSentenceTranslations] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [highlightingEnabled, setHighlightingEnabled] = useState(true) // Always enabled now
  const [timingOffset, setTimingOffset] = useState(0) // User-adjustable timing offset in ms
  const [simulationTime, setSimulationTime] = useState(0) // For simulating playback when audio unavailable
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [lineTranslations, setLineTranslations] = useState<{ [key: number]: string }>({})
  const [isLoadingTranslation, setIsLoadingTranslation] = useState<{ [key: number]: boolean }>({})
  const [showTranslations, setShowTranslations] = useState(false) // Translations now shown inline on hover
  const [isPreloadingTranslations, setIsPreloadingTranslations] = useState(false)
  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Process translations prop to always have an array
  const translationArray = useMemo(() => {
    if (!translations) return []
    if (Array.isArray(translations)) return translations
    if (typeof translations === 'object' && translations['en']) return translations['en']
    return []
  }, [translations])

  // Pre-load all translations when component mounts or lines change
  useEffect(() => {
    const preloadTranslations = async () => {
      // If we have translations from props (from database), use those
      if (translationArray.length > 0) {
        console.log('📚 Loading translations from props:', translationArray.length, 'lines')
        const translationMap: { [key: number]: string } = {}
        translationArray.forEach((translation, index) => {
          if (translation) {
            translationMap[index] = translation
          }
        })
        setLineTranslations(prev => {
          // Only update if we don't already have translations
          // This prevents overwriting when lines change
          if (Object.keys(prev).length === 0) {
            console.log('📚 Setting initial translation map:', Object.keys(translationMap).length, 'translations')
            return translationMap
          }
          console.log('📚 Keeping existing translations, not overwriting')
          return prev
        })
        return
      }

      // Otherwise, pre-fetch translations for all lines
      // But ONLY if we don't already have translations loaded
      if (!isDemo && lines.length > 0 && !isPreloadingTranslations && Object.keys(lineTranslations).length === 0) {
        setIsPreloadingTranslations(true)
        console.log(`Pre-loading translations for ${lines.length} lines...`)

        const translationPromises = lines.map(async (line, index) => {
          try {
            const result = await translateText(line)
            return { index, translation: result.translation }
          } catch (error) {
            console.error(`Failed to pre-load translation for line ${index}:`, error)
            return { index, translation: null }
          }
        })

        try {
          const results = await Promise.all(translationPromises)
          const newTranslations: { [key: number]: string } = {}

          results.forEach(result => {
            if (result.translation) {
              newTranslations[result.index] = result.translation
            }
          })

          setLineTranslations(prev => ({ ...prev, ...newTranslations }))
          console.log(`Pre-loaded ${Object.keys(newTranslations).length} translations`)
        } catch (error) {
          console.error('Failed to pre-load translations:', error)
        } finally {
          setIsPreloadingTranslations(false)
        }
      }
    }

    preloadTranslations()
  }, [lines, translationArray, isDemo, lineTranslations]) // Added lineTranslations back to properly check if we have them

  // Handle simulation mode for demonstrating sync
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isSimulating && synchronizedData?.duration) {
      interval = setInterval(() => {
        setSimulationTime(prev => {
          const next = prev + 100 // Advance by 100ms
          if (next >= synchronizedData.duration) {
            setIsSimulating(false)
            return 0
          }
          return next
        })
      }, 100)
    } else if (!isSimulating) {
      setSimulationTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSimulating, synchronizedData?.duration])

  // Convert times to consistent format (milliseconds) and add timing adjustment
  // Use simulation time when simulating, otherwise use actual playback time
  const effectiveTime = isSimulating ? simulationTime : currentTime
  const currentTimeMs = isSimulating
    ? simulationTime + timingOffset
    : (playbackMode === 'spotify' ? effectiveTime : effectiveTime * 1000) + timingOffset
  const durationMs = isSimulating && synchronizedData?.duration
    ? synchronizedData.duration
    : (playbackMode === 'spotify' ? duration : duration * 1000)

  // Generate timing data for lyrics - use real synchronized data or fallback to estimation
  const synchronizedLines = useMemo((): Line[] => {
    // If we have real synchronized data from the API, use it!
    if (synchronizedData?.lines && synchronizedData.lines.length > 0) {
      console.log(`✅ Using real synchronized lyrics from API:`, {
        format: synchronizedData.format,
        lineCount: synchronizedData.lines.length,
        duration: synchronizedData.duration,
        sampleTiming: synchronizedData.lines[0] ?
          `Line 1 starts at ${(synchronizedData.lines[0].startTime/1000).toFixed(2)}s` :
          'No timing data'
      })

      // Simply return the synchronized lines with their exact API timestamps
      // The words arrays should already be included from the parseLRC function
      return synchronizedData.lines.map((syncLine): Line => ({
        text: syncLine.text,
        words: syncLine.words || [], // Use provided words or empty array
        startTime: syncLine.startTime,
        endTime: syncLine.endTime
      }))
    }

    // Fallback to estimated timing if no synchronized data
    if (!lines.length) return []

    // If we don't have duration yet, just show the lyrics without timing
    if (!durationMs) {
      return lines.map((line): Line => {
        const lineWords = line.split(/(\s+)/).filter(part => part.length > 0)
        const words: Word[] = lineWords.map((wordText): Word => ({
          text: wordText,
          startTime: 0,
          endTime: 0,
          isWhitespace: !wordText.trim()
        }))

        return {
          text: line,
          words,
          startTime: 0,
          endTime: 0
        }
      })
    }

    console.log('⚠️ Using estimated timing - no synchronized data available')
    
    // Use proportional timing - each line gets an equal slice of the song
    const lyricsStartTime = durationMs * 0.05 // 5% instrumental intro
    const lyricsEndTime = durationMs * 0.95   // 5% outro  
    const lyricsDuration = lyricsEndTime - lyricsStartTime
    const timePerLine = lyricsDuration / lines.length
    
    return lines.map((line, lineIndex) => {
      const lineWords = line.split(/(\s+)/).filter(part => part.length > 0)
      const nonWhitespaceWords = lineWords.filter(word => word.trim().length > 0)
      
      // Calculate line timing based on proportional distribution
      const lineStartTime = lyricsStartTime + (lineIndex * timePerLine)
      const lineEndTime = lineStartTime + timePerLine
      
      // Generate word timings within the line
      const words: Word[] = []
      const wordDuration = timePerLine / Math.max(nonWhitespaceWords.length, 1)
      let wordStartTime = lineStartTime
      
      lineWords.forEach((wordText) => {
        const isWhitespace = !wordText.trim()
        
        if (isWhitespace) {
          words.push({
            text: wordText,
            startTime: wordStartTime,
            endTime: wordStartTime + (wordDuration * 0.1),
            isWhitespace: true
          })
        } else {
          words.push({
            text: wordText,
            startTime: wordStartTime,
            endTime: wordStartTime + wordDuration,
            isWhitespace: false
          })
          wordStartTime += wordDuration
        }
      })
      
      return {
        text: line,
        words,
        startTime: lineStartTime,
        endTime: lineEndTime
      }
    })
  }, [lines, durationMs, synchronizedData])

  // Find current active line and word
  const getCurrentHighlight = useCallback(() => {
    if (!isPlaying) {
      return { activeLineIndex: -1, activeWordIndex: -1, hasWordTiming: false }
    }

    for (let lineIndex = 0; lineIndex < synchronizedLines.length; lineIndex++) {
      const line = synchronizedLines[lineIndex]

      if (currentTimeMs >= line.startTime && currentTimeMs <= line.endTime) {
        // Check if we have real word timing (not all words have same timing)
        const hasWordTiming = line.words.length > 0 &&
          line.words.some(w => w.startTime !== line.startTime || w.endTime !== line.endTime)

        if (hasWordTiming) {
          // Find active word in this line
          for (let wordIndex = 0; wordIndex < line.words.length; wordIndex++) {
            const word = line.words[wordIndex]
            if (currentTimeMs >= word.startTime && currentTimeMs <= word.endTime) {
              return { activeLineIndex: lineIndex, activeWordIndex: wordIndex, hasWordTiming: true }
            }
          }
        }

        // Line-level highlighting only
        return { activeLineIndex: lineIndex, activeWordIndex: -1, hasWordTiming: false }
      }
    }

    return { activeLineIndex: -1, activeWordIndex: -1, hasWordTiming: false }
  }, [synchronizedLines, currentTimeMs, isPlaying])

  const { activeLineIndex, activeWordIndex, hasWordTiming } = getCurrentHighlight()

  // Update current line index when active line changes and auto-scroll
  useEffect(() => {
    if (activeLineIndex >= 0) {
      setCurrentLineIndex(activeLineIndex)

      // Auto-scroll to keep active line in view
      const activeLine = document.querySelector(`[data-sentence-index="${activeLineIndex}"]`)
      if (activeLine) {
        // Calculate the desired scroll position
        // We want the active line to be roughly 1/3 from the top of the viewport
        const rect = activeLine.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const desiredPositionFromTop = viewportHeight * 0.33 // 33% from top
        const scrollOffset = rect.top - desiredPositionFromTop + window.scrollY

        // Smooth scroll to the calculated position
        window.scrollTo({
          top: scrollOffset,
          behavior: 'smooth'
        })
      }

      // Auto-advance in modal if it's open and we're playing
      if (isModalOpen && isPlaying) {
        // Update the modal content to show the current playing line
        const currentLine = synchronizedLines[activeLineIndex]
        if (currentLine) {
          setSelectedSentence(currentLine.text)

          // Update translations - use cached translation first
          if (lineTranslations[activeLineIndex]) {
            setSelectedSentenceTranslations([lineTranslations[activeLineIndex]])
          } else if (isDemo && translationArray[activeLineIndex]) {
            setSelectedSentenceTranslations([translationArray[activeLineIndex]])
          } else {
            setSelectedSentenceTranslations([])
          }
        }
      }
    }
  }, [activeLineIndex, isModalOpen, isPlaying, synchronizedLines, translations, isDemo, lineTranslations])

  // Navigation functions
  const navigateToLine = useCallback((index: number) => {
    if (index >= 0 && index < synchronizedLines.length && onTimeSeek) {
      const line = synchronizedLines[index]
      onTimeSeek(line.startTime)
      setCurrentLineIndex(index)
    }
  }, [synchronizedLines, onTimeSeek])

  const navigatePrevious = useCallback(() => {
    const newIndex = Math.max(0, currentLineIndex - 1)
    navigateToLine(newIndex)
  }, [currentLineIndex, navigateToLine])

  const navigateNext = useCallback(() => {
    const newIndex = Math.min(synchronizedLines.length - 1, currentLineIndex + 1)
    navigateToLine(newIndex)
  }, [currentLineIndex, synchronizedLines.length, navigateToLine])

  const repeatCurrentLine = useCallback(() => {
    if (currentLineIndex >= 0 && currentLineIndex < synchronizedLines.length && onTimeSeek) {
      const line = synchronizedLines[currentLineIndex]

      // Clear existing repeat
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current)
        repeatIntervalRef.current = null
      }

      // Start repeating
      const repeatLine = () => {
        onTimeSeek(line.startTime)
      }

      repeatLine() // Play immediately
      const lineDuration = line.endTime - line.startTime
      repeatIntervalRef.current = setInterval(repeatLine, lineDuration + 500) // Add 500ms pause between repeats
    }
  }, [currentLineIndex, synchronizedLines, onTimeSeek])

  const stopRepeat = useCallback(() => {
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current)
      repeatIntervalRef.current = null
    }
  }, [])

  // Cleanup repeat on unmount
  useEffect(() => {
    return () => {
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current)
      }
    }
  }, [])

  // Fetch translation for a line
  const fetchLineTranslation = useCallback(async (lineIndex: number, text: string) => {
    if (lineTranslations[lineIndex]) return // Already have translation

    setIsLoadingTranslation(prev => ({ ...prev, [lineIndex]: true }))
    try {
      const result = await translateText(text)
      setLineTranslations(prev => ({ ...prev, [lineIndex]: result.translation }))
    } catch (error) {
      console.error('Failed to translate line:', error)
      setLineTranslations(prev => ({ ...prev, [lineIndex]: '[Translation failed]' }))
    } finally {
      setIsLoadingTranslation(prev => ({ ...prev, [lineIndex]: false }))
    }
  }, [lineTranslations])

  const handleSentenceClick = useCallback((sentence: string, index: number) => {
    setSelectedSentence(sentence)
    setCurrentLineIndex(index)

    // Use cached translation if available
    if (lineTranslations[index]) {
      setSelectedSentenceTranslations([lineTranslations[index]])
    } else if (isDemo && translationArray[index]) {
      setSelectedSentenceTranslations([translationArray[index]])
    } else {
      setSelectedSentenceTranslations([])
    }

    setIsModalOpen(true)
  }, [translations, isDemo, lineTranslations])

  const handleWordSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim()
      if (selectedText.split(/\s+/).length === 1 && selectedText.length > 1) {
        setSelectedWord(selectedText)
        setIsPopoverOpen(true)
      }
    }
  }, [])

  const handleLineClick = useCallback((lineIndex: number) => {
    // Seek to line time
    if (onTimeSeek && synchronizedLines[lineIndex]) {
      const seekTime = synchronizedLines[lineIndex].startTime
      onTimeSeek(seekTime)
    }

    setCurrentLineIndex(lineIndex)
    stopRepeat() // Stop any active repeat
  }, [onTimeSeek, synchronizedLines, stopRepeat])

  const renderLine = useCallback((line: Line, lineIndex: number) => {
    const isActiveLine = activeLineIndex === lineIndex
    const shouldShowLineHighlight = isActiveLine

    return (
      <div
        key={lineIndex}
        className={`mb-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          shouldShowLineHighlight
            ? 'bg-white/20 border-l-4 border-white/60 shadow-sm scale-105'
            : 'bg-white/[0.06] hover:bg-white/10'
        }`}
        data-sentence-index={lineIndex}
        onClick={() => {
          handleSentenceClick(line.text, lineIndex)
          handleLineClick(lineIndex)
        }}
      >
        <p
          className="text-lg leading-relaxed select-text text-white"
          onMouseUp={handleWordSelection}
        >
          {line.words.map((word, wordIndex) => {
            // Only highlight words if we have real word timing
            // Since we only have line-level timing from Musixmatch,
            // we don't highlight individual words
            return (
              <span
                key={wordIndex}
                className={word.isWhitespace ? '' : 'hover:bg-white/10 rounded px-0.5'}
              >
                {word.text}
              </span>
            )
          })}
        </p>
        
        {/* Show translation for active line */}
        {shouldShowLineHighlight && (
          <div className="text-sm mt-2" style={{ color: '#FFF' }}>
            {lineTranslations[lineIndex] || translationArray[lineIndex] || 'Loading translation...'}
          </div>
        )}
      </div>
    )
  }, [activeLineIndex, activeWordIndex, hasWordTiming, handleSentenceClick, handleWordSelection, handleLineClick, lineTranslations])

  return (
    <div>
      {/* Controls */}
      <div className="space-y-4">

        {/* Playback Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">

          {/* Simulation mode - show when sync data exists and no audio is playing */}
          {synchronizedData && synchronizedData.lines?.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isSimulating) {
                  setIsSimulating(false)
                  setSimulationTime(0)
                } else {
                  setIsSimulating(true)
                }
              }}
              className="flex items-center gap-2"
              title={`Playback mode: ${playbackMode}`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop Demo
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play Demo
                </>
              )}
            </Button>
          )}

        </div>

        {/* Timing Offset Control */}
        {synchronizedData && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Timing offset:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimingOffset(prev => prev - 100)}
                className="h-6 w-6 p-0"
              >
                -
              </Button>
              <span className="text-xs w-16 text-center">{timingOffset}ms</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimingOffset(prev => prev + 100)}
                className="h-6 w-6 p-0"
              >
                +
              </Button>
              {timingOffset !== 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimingOffset(0)}
                  className="h-6 px-2 text-xs"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        )}
        </div>

      </div>

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

      {/* Synchronized Lyrics */}
      <div>
        {synchronizedLines.length > 0 ? (
          synchronizedLines.map((line, index) => renderLine(line, index))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No lyrics available</p>
            <p className="text-sm">Try demo mode or ensure proper API configuration</p>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {durationMs > 0 && isPlaying && (
        <div className="text-center">
          <div className="text-xs text-white/60">
            {isSimulating
              ? `Demo Progress: ${Math.round((currentTimeMs / durationMs) * 100)}%`
              : `Lyrics Progress: ${Math.round((currentTimeMs / durationMs) * 100)}%`
            }
          </div>
        </div>
      )}

      {/* Modals */}
      <SentenceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          stopRepeat()
        }}
        sentence={selectedSentence}
        translations={selectedSentenceTranslations}
        backgroundColor={backgroundColor}
        currentLineIndex={currentLineIndex}
        totalLines={synchronizedLines.length}
        onNavigatePrevious={() => {
          navigatePrevious()
          if (currentLineIndex > 0 && synchronizedLines[currentLineIndex - 1]) {
            setSelectedSentence(synchronizedLines[currentLineIndex - 1].text)
            if (isDemo && translationArray[currentLineIndex - 1]) {
              setSelectedSentenceTranslations([translationArray[currentLineIndex - 1]])
            } else {
              setSelectedSentenceTranslations([])
            }
          }
        }}
        onNavigateNext={() => {
          navigateNext()
          if (currentLineIndex < synchronizedLines.length - 1 && synchronizedLines[currentLineIndex + 1]) {
            setSelectedSentence(synchronizedLines[currentLineIndex + 1].text)
            if (isDemo && translationArray[currentLineIndex + 1]) {
              setSelectedSentenceTranslations([translationArray[currentLineIndex + 1]])
            } else {
              setSelectedSentenceTranslations([])
            }
          }
        }}
        onRepeat={() => {
          if (repeatIntervalRef.current) {
            stopRepeat()
          } else {
            repeatCurrentLine()
          }
        }}
        isRepeating={!!repeatIntervalRef.current}
        playbackRate={playbackRate}
        onPlaybackRateChange={onPlaybackRateChange}
        hasAudioControl={playbackMode === 'preview'}
      />

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