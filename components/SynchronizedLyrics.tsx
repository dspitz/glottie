'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { SentenceModal } from '@/components/SentenceModal'
import { WordPopover } from '@/components/WordPopover'
import { Settings2, Zap, ZapOff } from 'lucide-react'
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
  playbackMode: 'spotify' | 'preview'
  translations?: string[]
  isDemo?: boolean
  backgroundColor?: string
  onTimeSeek?: (timeInMs: number) => void
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
  translations = [],
  isDemo = false,
  backgroundColor,
  onTimeSeek,
  synchronizedData
}: SynchronizedLyricsProps) {
  const [selectedSentence, setSelectedSentence] = useState<string>('')
  const [selectedSentenceTranslations, setSelectedSentenceTranslations] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [highlightingEnabled, setHighlightingEnabled] = useState(true)
  const [timingOffset, setTimingOffset] = useState(0) // User-adjustable timing offset in ms

  // Convert times to consistent format (milliseconds) and add timing adjustment
  const currentTimeMs = (playbackMode === 'spotify' ? currentTime : currentTime * 1000) + timingOffset
  const durationMs = playbackMode === 'spotify' ? duration : duration * 1000

  // Generate timing data for lyrics - use real synchronized data or fallback to estimation
  const synchronizedLines = useMemo((): Line[] => {
    // If we have real synchronized data, use it!
    if (synchronizedData?.lines && synchronizedData.lines.length > 0) {
      console.log(`✅ Using real synchronized lyrics:`, {
        format: synchronizedData.format,
        hasWordTiming: synchronizedData.hasWordTiming,
        lineCount: synchronizedData.lines.length,
        duration: synchronizedData.duration,
        firstLine: synchronizedData.lines[0]
      })
      return synchronizedData.lines.map((syncLine): Line => {
        // If we have word timing, use it
        if (syncLine.words && syncLine.words.length > 0) {
          return {
            text: syncLine.text,
            words: syncLine.words.map((word): Word => ({
              text: word.text,
              startTime: word.startTime,
              endTime: word.endTime,
              isWhitespace: word.isWhitespace
            })),
            startTime: syncLine.startTime,
            endTime: syncLine.endTime
          }
        }

        // No word timing available - create words without timing for display
        const lineWords = syncLine.text.split(/(\s+)/).filter(part => part.length > 0)
        return {
          text: syncLine.text,
          words: lineWords.map((wordText): Word => ({
            text: wordText,
            startTime: syncLine.startTime, // All words share line timing
            endTime: syncLine.endTime,
            isWhitespace: !wordText.trim()
          })),
          startTime: syncLine.startTime,
          endTime: syncLine.endTime
        }
      })
    }

    // Fallback to estimated timing if no synchronized data
    if (!lines.length || !durationMs) return []

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
    if (!highlightingEnabled || !isPlaying) {
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
  }, [synchronizedLines, currentTimeMs, highlightingEnabled, isPlaying])

  const { activeLineIndex, activeWordIndex, hasWordTiming } = getCurrentHighlight()

  const handleSentenceClick = useCallback((sentence: string, index: number) => {
    setSelectedSentence(sentence)
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
      if (selectedText.split(/\s+/).length === 1 && selectedText.length > 1) {
        setSelectedWord(selectedText)
        setIsPopoverOpen(true)
      }
    }
  }, [])

  const handleLineClick = useCallback((lineIndex: number) => {
    if (onTimeSeek && synchronizedLines[lineIndex]) {
      const seekTime = synchronizedLines[lineIndex].startTime
      onTimeSeek(seekTime)
    }
  }, [onTimeSeek, synchronizedLines])

  const renderLine = useCallback((line: Line, lineIndex: number) => {
    const isActiveLine = activeLineIndex === lineIndex
    const shouldShowLineHighlight = highlightingEnabled && isActiveLine

    return (
      <div
        key={lineIndex}
        className={`mb-4 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          shouldShowLineHighlight
            ? 'bg-primary/20 border-l-4 border-primary shadow-sm scale-105'
            : 'bg-muted/30 hover:bg-muted/50'
        }`}
        data-sentence-index={lineIndex}
        onClick={() => {
          handleSentenceClick(line.text, lineIndex)
          handleLineClick(lineIndex)
        }}
      >
        <p
          className="text-lg leading-relaxed select-text"
          onMouseUp={handleWordSelection}
        >
          {line.words.map((word, wordIndex) => {
            // Only highlight words if we have real word timing
            const isActiveWord = isActiveLine && hasWordTiming && activeWordIndex === wordIndex
            const shouldShowWordHighlight = highlightingEnabled && isActiveWord && !word.isWhitespace

            return (
              <span
                key={wordIndex}
                className={`${
                  shouldShowWordHighlight
                    ? 'bg-primary text-primary-foreground rounded px-1 font-semibold shadow-sm'
                    : word.isWhitespace
                      ? ''
                      : 'hover:bg-primary/10 rounded px-0.5'
                }`}
              >
                {word.text}
              </span>
            )
          })}
        </p>
        
        {/* Show timing info for active line (debug mode) */}
        {shouldShowLineHighlight && process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground mt-1 opacity-50">
            {Math.round(line.startTime / 1000)}s - {Math.round(line.endTime / 1000)}s
          </div>
        )}
      </div>
    )
  }, [activeLineIndex, activeWordIndex, hasWordTiming, highlightingEnabled, handleSentenceClick, handleWordSelection, handleLineClick])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHighlightingEnabled(!highlightingEnabled)}
            className="flex items-center gap-2"
          >
            {highlightingEnabled ? (
              <>
                <Zap className="w-4 h-4" />
                Sync On
              </>
            ) : (
              <>
                <ZapOff className="w-4 h-4" />
                Sync Off
              </>
            )}
          </Button>

          {highlightingEnabled && isPlaying && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              {synchronizedData?.format === 'lrc' ? 'Line sync' : 'Following'}
            </div>
          )}
        </div>

        {/* Timing Offset Control */}
        {highlightingEnabled && synchronizedData && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Timing offset:</span>
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
        
        {onTimeSeek && (
          <p className="text-xs text-muted-foreground">
            Click any line to jump to that part
          </p>
        )}
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
      <div className="space-y-2">
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
      {highlightingEnabled && durationMs > 0 && (
        <div className="text-center">
          <div className="text-xs text-muted-foreground">
            Lyrics Progress: {Math.round((currentTimeMs / durationMs) * 100)}%
          </div>
        </div>
      )}

      {/* Modals */}
      <SentenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sentence={selectedSentence}
        translations={selectedSentenceTranslations}
        backgroundColor={backgroundColor}
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