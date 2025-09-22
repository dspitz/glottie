'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SentenceModal } from '@/components/SentenceModal'
import { WordPopover } from '@/components/WordPopover'
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
  displayLanguage?: 'spanish' | 'english'
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
  displayLanguage = 'spanish',
  synchronizedData
}: SynchronizedLyricsProps) {
  const [selectedSentence, setSelectedSentence] = useState<string>('')
  const [selectedSentenceTranslations, setSelectedSentenceTranslations] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [highlightingEnabled, setHighlightingEnabled] = useState(true) // Always enabled now
  const [simulationTime, setSimulationTime] = useState(0) // For simulating playback when audio unavailable
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [lineTranslations, setLineTranslations] = useState<{ [key: number]: string }>({})
  const [showTranslations, setShowTranslations] = useState(false) // Translations now shown inline on hover
  const [isPreloadingTranslations, setIsPreloadingTranslations] = useState(false)

  // Process translations prop to always have an array
  const translationArray = useMemo(() => {
    if (!translations) return []
    if (Array.isArray(translations)) return translations
    if (typeof translations === 'object' && translations['en']) return translations['en']
    return []
  }, [translations])

  // FOCUSED DEBUG: Only log translation issues
  useEffect(() => {
    if (translationArray.length === 0 && translations) {
      console.log('🔴 TRANSLATION ISSUE: Empty translation array', {
        translationsType: typeof translations,
        isArray: Array.isArray(translations),
        keys: translations && typeof translations === 'object' ? Object.keys(translations) : null
      })
    }
  }, [translationArray, translations])

  // Create a mapping from synchronized line text to translation index
  const synchronizedLineToTranslationIndex = useMemo(() => {
    const mapping: { [lineText: string]: number } = {}
    if (synchronizedData && synchronizedData.lines && lines.length > 0) {
      synchronizedData.lines.forEach((syncLine) => {
        const originalIndex = lines.findIndex(line =>
          line.trim().toLowerCase() === syncLine.text.trim().toLowerCase()
        )
        if (originalIndex !== -1) {
          mapping[syncLine.text] = originalIndex
        }
      })
    }
    return mapping
  }, [synchronizedData, lines])

  // Pre-load translations from props if available
  useEffect(() => {
    console.log('🔍 SynchronizedLyricsClean: Translation preload check', {
      translationArrayLength: translationArray.length,
      lineTranslationsCount: Object.keys(lineTranslations).length,
      translationArraySample: translationArray.slice(0, 3),
      linesCount: lines.length
    })

    if (translationArray.length > 0 && Object.keys(lineTranslations).length === 0) {
      const translationMap: { [key: number]: string } = {}
      translationArray.forEach((translation, index) => {
        if (translation && typeof translation === 'string') {
          translationMap[index] = translation
          console.log(`📝 Translation[${index}]: "${translation.substring(0, 50)}${translation.length > 50 ? '...' : ''}"`)
        } else {
          console.warn(`⚠️ Invalid translation at index ${index}:`, translation)
        }
      })
      if (Object.keys(translationMap).length > 0) {
        console.log(`📚 Pre-loaded ${Object.keys(translationMap).length} translations out of ${translationArray.length} total`)
        setLineTranslations(translationMap)
      } else {
        console.warn('⚠️ No valid translations found in translationArray')
      }
    }
  }, [translationArray, lineTranslations, lines.length])

  // Determine playback time based on mode
  const currentTimeMs = useMemo(() => {
    if (playbackMode === 'spotify') {
      return currentTime // Already in ms
    } else if (playbackMode === 'preview') {
      return currentTime * 1000 // Convert seconds to ms
    } else {
      return simulationTime // Use simulated time when unavailable
    }
  }, [currentTime, playbackMode, simulationTime])

  // Convert duration to milliseconds
  const durationMs = useMemo(() => {
    if (playbackMode === 'spotify') {
      return duration // Already in ms
    } else if (playbackMode === 'preview') {
      return duration * 1000 // Convert seconds to ms
    } else {
      // Estimate 3 minutes for unavailable tracks
      return 180000
    }
  }, [duration, playbackMode])

  // Create synchronized lines with timing
  const synchronizedLines = useMemo<Line[]>(() => {
    if (synchronizedData && synchronizedData.lines && synchronizedData.lines.length > 0) {
      return synchronizedData.lines.map((lyricsLine) => {
        const lineWords: Word[] = []

        if (lyricsLine.words && lyricsLine.words.length > 0) {
          lyricsLine.words.forEach((word, wordIdx) => {
            if (wordIdx > 0) {
              lineWords.push({
                text: ' ',
                startTime: lyricsLine.words![wordIdx - 1].endTime || 0,
                endTime: word.startTime || 0,
                isWhitespace: true
              })
            }

            lineWords.push({
              text: word.text,
              startTime: word.startTime || 0,
              endTime: word.endTime || 0,
              isWhitespace: false
            })
          })
        } else {
          const lineText = lyricsLine.text || ''
          const words = lineText.split(/(\s+)/).filter(part => part.length > 0)

          words.forEach((wordText) => {
            lineWords.push({
              text: wordText,
              startTime: lyricsLine.startTime || 0,
              endTime: lyricsLine.endTime || 0,
              isWhitespace: !wordText.trim()
            })
          })
        }

        return {
          text: lyricsLine.text || '',
          words: lineWords,
          startTime: lyricsLine.startTime || 0,
          endTime: lyricsLine.endTime || 0
        }
      })
    }

    // Fallback to estimated timing if no synchronized data
    const lyricsStartTime = durationMs * 0.05 // 5% instrumental intro
    const lyricsEndTime = durationMs * 0.95   // 5% outro
    const lyricsDuration = lyricsEndTime - lyricsStartTime
    const timePerLine = lyricsDuration / lines.length

    return lines.map((line, lineIndex) => {
      const lineWords = line.split(/(\s+)/).filter(part => part.length > 0)
      const nonWhitespaceWords = lineWords.filter(word => word.trim().length > 0)

      const lineStartTime = lyricsStartTime + (lineIndex * timePerLine)
      const lineEndTime = lineStartTime + timePerLine

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

    // Find the last line that has started playing
    let lastActiveLineIndex = -1

    for (let lineIndex = 0; lineIndex < synchronizedLines.length; lineIndex++) {
      const line = synchronizedLines[lineIndex]

      if (currentTimeMs >= line.startTime) {
        lastActiveLineIndex = lineIndex

        // Check if we're still within this line's duration
        if (currentTimeMs <= line.endTime) {
          const hasWordTiming = line.words.length > 0 &&
            line.words.some(w => w.startTime !== line.startTime || w.endTime !== line.endTime)

          if (hasWordTiming) {
            for (let wordIndex = 0; wordIndex < line.words.length; wordIndex++) {
              const word = line.words[wordIndex]
              if (currentTimeMs >= word.startTime && currentTimeMs <= word.endTime) {
                return { activeLineIndex: lineIndex, activeWordIndex: wordIndex, hasWordTiming: true }
              }
            }
          }

          return { activeLineIndex: lineIndex, activeWordIndex: -1, hasWordTiming: false }
        }
      } else {
        // If we haven't reached this line yet, break
        break
      }
    }

    // Keep the last line that started playing highlighted
    return { activeLineIndex: lastActiveLineIndex, activeWordIndex: -1, hasWordTiming: false }
  }, [synchronizedLines, currentTimeMs, isPlaying])

  const { activeLineIndex, activeWordIndex, hasWordTiming } = getCurrentHighlight()

  // Update current line index when active line changes and auto-scroll
  useEffect(() => {
    if (activeLineIndex >= 0) {
      setCurrentLineIndex(activeLineIndex)

      // Auto-scroll to keep active line in view
      const activeLine = document.querySelector(`[data-sentence-index="${activeLineIndex}"]`)
      if (activeLine) {
        const rect = activeLine.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const desiredPositionFromTop = viewportHeight * 0.33
        const scrollOffset = rect.top - desiredPositionFromTop + window.scrollY

        window.scrollTo({
          top: scrollOffset,
          behavior: 'smooth'
        })
      }

      // Auto-advance in modal if it's open and we're playing
      if (isModalOpen && isPlaying) {
        const currentLine = synchronizedLines[activeLineIndex]
        if (currentLine) {
          setSelectedSentence(currentLine.text)

          const translationIndex = synchronizedData && synchronizedLineToTranslationIndex[currentLine.text] !== undefined
            ? synchronizedLineToTranslationIndex[currentLine.text]
            : activeLineIndex

          if (lineTranslations[translationIndex]) {
            setSelectedSentenceTranslations([lineTranslations[translationIndex]])
          } else if (translationArray[translationIndex]) {
            setSelectedSentenceTranslations([translationArray[translationIndex]])
          } else {
            setSelectedSentenceTranslations([])
          }
        }
      }
    }
  }, [activeLineIndex, isModalOpen, isPlaying, synchronizedLines, isDemo, lineTranslations, translationArray, synchronizedData, synchronizedLineToTranslationIndex])

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

  const playCurrentPhrase = useCallback(() => {
    if (currentLineIndex >= 0 && currentLineIndex < synchronizedLines.length && onTimeSeek) {
      // Play the current line/phrase by seeking to its start time
      const line = synchronizedLines[currentLineIndex]
      onTimeSeek(line.startTime)
    }
  }, [currentLineIndex, synchronizedLines, onTimeSeek])



  // Handle sentence click
  const handleSentenceClick = useCallback((text: string, index: number) => {
    console.log('🎯 SynchronizedLyricsClean: Sentence click debug', {
      text: text.substring(0, 50),
      clickedIndex: index,
      hasSynchronizedData: !!synchronizedData,
      lineTranslationsCount: Object.keys(lineTranslations).length,
      translationArrayLength: translationArray.length
    })

    setSelectedSentence(text)

    const translationIndex = synchronizedData && synchronizedLineToTranslationIndex[text] !== undefined
      ? synchronizedLineToTranslationIndex[text]
      : index

    console.log('🔍 Translation lookup debug', {
      originalIndex: index,
      translationIndex: translationIndex,
      hasLineTranslation: !!lineTranslations[translationIndex],
      hasArrayTranslation: !!translationArray[translationIndex],
      lineTranslation: lineTranslations[translationIndex]?.substring(0, 50),
      arrayTranslation: translationArray[translationIndex]?.substring(0, 50)
    })

    // Always use pre-downloaded translations if available with multiple fallback strategies
    let foundTranslation = null
    let foundMethod = ''

    // Strategy 1: Use mapped translation index (for synchronized lyrics)
    if (lineTranslations[translationIndex]) {
      foundTranslation = lineTranslations[translationIndex]
      foundMethod = `lineTranslations[${translationIndex}]`
    } else if (translationArray[translationIndex]) {
      foundTranslation = translationArray[translationIndex]
      foundMethod = `translationArray[${translationIndex}]`
    }
    // Strategy 2: Fallback to original index if mapped index failed
    else if (translationIndex !== index) {
      if (lineTranslations[index]) {
        foundTranslation = lineTranslations[index]
        foundMethod = `lineTranslations[${index}] (fallback)`
      } else if (translationArray[index]) {
        foundTranslation = translationArray[index]
        foundMethod = `translationArray[${index}] (fallback)`
      }
    }
    // Strategy 3: Try nearby indices (±1) for slight misalignments
    else {
      for (const offset of [-1, 1, -2, 2]) {
        const tryIndex = index + offset
        if (tryIndex >= 0) {
          if (lineTranslations[tryIndex]) {
            foundTranslation = lineTranslations[tryIndex]
            foundMethod = `lineTranslations[${tryIndex}] (nearby offset ${offset})`
            break
          } else if (translationArray[tryIndex]) {
            foundTranslation = translationArray[tryIndex]
            foundMethod = `translationArray[${tryIndex}] (nearby offset ${offset})`
            break
          }
        }
      }
    }

    if (foundTranslation) {
      console.log(`✅ Found translation via ${foundMethod}: "${foundTranslation.substring(0, 50)}..."`)
      setSelectedSentenceTranslations([foundTranslation])
    } else {
      console.warn(`⚠️ No translation found for "${text.substring(0, 30)}" at index ${translationIndex} (original: ${index})`)
      console.warn(`   Available lineTranslations indices:`, Object.keys(lineTranslations))
      console.warn(`   translationArray length:`, translationArray.length)
      setSelectedSentenceTranslations([])
    }
    setIsModalOpen(true)
  }, [lineTranslations, translationArray, synchronizedData, synchronizedLineToTranslationIndex])

  // Handle word selection
  const handleWordSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim()
      setSelectedWord(selectedText)
      setIsPopoverOpen(true)
    }
  }, [])

  // Handle line click for navigation
  const handleLineClick = useCallback((lineIndex: number) => {
    if (onTimeSeek && synchronizedLines[lineIndex]) {
      const targetTime = synchronizedLines[lineIndex].startTime
      onTimeSeek(targetTime)
    }
  }, [onTimeSeek, synchronizedLines])

  // Render a single line with highlighting
  const renderLine = useCallback((line: Line, lineIndex: number) => {
    const isActiveLine = activeLineIndex === lineIndex
    const shouldShowLineHighlight = isActiveLine

    return (
      <div
        key={`${displayLanguage}-line-${lineIndex}`}
        className={`mb-2 px-6 rounded-lg cursor-pointer transition-all duration-200 ${
          shouldShowLineHighlight
            ? 'py-4 bg-white/[0.06] border border-white/[0.08] scale-105'
            : 'py-3 bg-white/0 border border-white/0 hover:bg-white/10'
        }`}
        style={shouldShowLineHighlight ? {
          boxShadow: '0 10px 24px rgba(0, 0, 0, 0.08)'
        } : {}}
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
            // Calculate a global word index for staggered animation
            let globalWordIndex = 0
            for (let i = 0; i < lineIndex; i++) {
              globalWordIndex += synchronizedLines[i].words.length
            }
            globalWordIndex += wordIndex

            return (
              <motion.span
                key={`${displayLanguage}-${lineIndex}-${wordIndex}`}
                className={word.isWhitespace ? '' : 'hover:bg-white/10 rounded px-0.5'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: globalWordIndex * 0.005,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                {word.text}
              </motion.span>
            )
          })}
        </p>

        {/* Show translation for active line */}
        {shouldShowLineHighlight && (
          <div className="text-sm opacity-80 mt-0.5" style={{ color: '#FFF' }}>
            {(() => {
              // IMPORTANT: During playback, we need to be careful about index mapping
              let translationIndex = lineIndex

              // Only use mapping if we have synchronized data and the line exists in mapping
              if (synchronizedData && synchronizedData.lines) {
                const syncLine = synchronizedData.lines[lineIndex]
                if (syncLine) {
                  const originalIndex = lines.findIndex(originalLine =>
                    originalLine.trim().toLowerCase() === syncLine.text.trim().toLowerCase()
                  )
                  if (originalIndex !== -1) {
                    translationIndex = originalIndex
                  }
                }
              }

              const translation = translationArray[translationIndex] || lineTranslations[translationIndex] || ''

              // FOCUSED DEBUG: Only log if translation seems wrong
              if (shouldShowLineHighlight && translation) {
                const isSpanish = /[áéíóúñü]/i.test(translation) ||
                  /\b(llamaba|llama|que|para|con|por)\b/i.test(translation)
                if (isSpanish) {
                  console.log(`🔴 Spanish shown for line ${lineIndex}:`, {
                    lineText: line.text.substring(0, 40),
                    translation: translation.substring(0, 40),
                    translationIndex,
                    hasTranslationArray: translationArray.length > 0,
                    translationArrayItem: translationArray[translationIndex]?.substring(0, 40) || null
                  })
                }
              }

              return translation
            })()}
          </div>
        )}
      </div>
    )
  }, [activeLineIndex, activeWordIndex, hasWordTiming, handleSentenceClick, handleWordSelection, handleLineClick, lineTranslations, translationArray, synchronizedData, synchronizedLineToTranslationIndex, lines, synchronizedLines, displayLanguage])

  return (
    <div>
      {/* Controls */}
      <div className="space-y-4">

        {/* Playback Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">

          {/* Simulation mode - show when sync data exists and no audio is playing */}

        </div>
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
          <div className="text-muted-foreground text-center py-8">
            No lyrics available
          </div>
        )}
      </div>

      {/* Modals */}
      <SentenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sentence={selectedSentence}
        translations={selectedSentenceTranslations}
        currentLineIndex={currentLineIndex}
        totalLines={synchronizedLines.length > 0 ? synchronizedLines.length : lines.length}
        onNavigatePrevious={() => {
          const newIndex = currentLineIndex - 1
          // Handle both synchronized and non-synchronized scenarios
          if (newIndex >= 0) {
            // Navigate to the line with time seeking
            navigateToLine(newIndex)

            // Update modal content
            if (synchronizedLines.length > 0 && synchronizedLines[newIndex]) {
              setSelectedSentence(synchronizedLines[newIndex].text)
              // Map to correct translation index
              const translationIndex = synchronizedLineToTranslationIndex[synchronizedLines[newIndex].text] ?? newIndex
              if (lineTranslations[translationIndex]) {
                setSelectedSentenceTranslations([lineTranslations[translationIndex]])
              } else if (translationArray[translationIndex]) {
                setSelectedSentenceTranslations([translationArray[translationIndex]])
              } else {
                setSelectedSentenceTranslations([])
              }
            } else if (lines[newIndex]) {
              // Fallback to regular lines array if no synchronized data
              setSelectedSentence(lines[newIndex])
              if (lineTranslations[newIndex]) {
                setSelectedSentenceTranslations([lineTranslations[newIndex]])
              } else if (translationArray[newIndex]) {
                setSelectedSentenceTranslations([translationArray[newIndex]])
              } else {
                setSelectedSentenceTranslations([])
              }
            }
          }
        }}
        onNavigateNext={() => {
          const newIndex = currentLineIndex + 1
          const maxIndex = synchronizedLines.length > 0 ? synchronizedLines.length - 1 : lines.length - 1
          // Handle both synchronized and non-synchronized scenarios
          if (newIndex <= maxIndex) {
            // Navigate to the line with time seeking
            navigateToLine(newIndex)

            // Update modal content
            if (synchronizedLines.length > 0 && synchronizedLines[newIndex]) {
              setSelectedSentence(synchronizedLines[newIndex].text)
              // Map to correct translation index
              const translationIndex = synchronizedLineToTranslationIndex[synchronizedLines[newIndex].text] ?? newIndex
              if (lineTranslations[translationIndex]) {
                setSelectedSentenceTranslations([lineTranslations[translationIndex]])
              } else if (translationArray[translationIndex]) {
                setSelectedSentenceTranslations([translationArray[translationIndex]])
              } else {
                setSelectedSentenceTranslations([])
              }
            } else if (lines[newIndex]) {
              // Fallback to regular lines array if no synchronized data
              setSelectedSentence(lines[newIndex])
              if (lineTranslations[newIndex]) {
                setSelectedSentenceTranslations([lineTranslations[newIndex]])
              } else if (translationArray[newIndex]) {
                setSelectedSentenceTranslations([translationArray[newIndex]])
              } else {
                setSelectedSentenceTranslations([])
              }
            }
          }
        }}
        onPlayPhrase={playbackMode !== 'unavailable' ? playCurrentPhrase : undefined}
        playbackRate={playbackRate}
        onPlaybackRateChange={onPlaybackRateChange}
        backgroundColor={backgroundColor}
      />

      <WordPopover
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        word={selectedWord}
      />
    </div>
  )
}