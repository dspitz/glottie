import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { EnhancedAudioPlayer, AudioPlayerState, AudioPlayerControls } from '@/components/EnhancedAudioPlayer'
import { SynchronizedLyrics } from '@/components/SynchronizedLyricsClean'
import { TranslationBottomSheet } from '@/components/TranslationBottomSheet'
import { WordPopover } from '@/components/WordPopover'
import { segmentIntoSentences } from '@/lib/utils'
import { ExternalLink, Music2 } from 'lucide-react'

interface LyricsViewProps {
  lines: string[]
  translations?: string[] | { [key: string]: string[] }
  spotifyUrl?: string
  title?: string
  artist?: string
  isDemo?: boolean
  backgroundColor?: string
  displayLanguage?: 'spanish' | 'english' | 'both'
  track?: {
    id: string
    title: string
    artist: string
    album?: string
    spotifyId?: string
    spotifyUrl?: string
    previewUrl?: string
    albumArt?: string
    albumArtSmall?: string
  }
  synchronized?: {
    lines: any[]
    hasWordTiming: boolean
    format: 'lrc' | 'estimated' | 'dfxp'
    duration?: number
  }
  onPlayStateChange?: (isPlaying: boolean) => void
  onPlayPauseReady?: (fn: () => void) => void
  onTranslationModalChange?: (isOpen: boolean) => void
}

export function LyricsView({
  lines,
  translations = [],
  spotifyUrl,
  title,
  artist,
  isDemo = false,
  backgroundColor,
  displayLanguage = 'spanish',
  track,
  synchronized,
  onPlayStateChange,
  onPlayPauseReady,
  onTranslationModalChange
}: LyricsViewProps) {
  // Debug: Log what LyricsView receives
  // console.log('🎭 LyricsView received props:', {
  //   hasSynchronized: !!synchronized,
  //   format: synchronized?.format,
  //   lineCount: synchronized?.lines?.length,
  //   firstLine: synchronized?.lines?.[0],
  //   hasTrack: !!track,
  //   hasOnPlayPauseReady: !!onPlayPauseReady,
  //   onPlayPauseReadyType: typeof onPlayPauseReady
  // })
  // Process translations - extract English translations if it's an object
  const processedTranslations = React.useMemo(() => {
    // console.log('🔍 LyricsView: Processing translations', {
    //   type: typeof translations,
    //   isArray: Array.isArray(translations),
    //   keys: translations && typeof translations === 'object' ? Object.keys(translations) : null,
    //   firstTranslation: Array.isArray(translations) && translations[0] ? translations[0].substring(0, 40) : null,
    //   rawTranslations: translations
    // })

    if (Array.isArray(translations)) {
      // console.log(`✅ LyricsView: Using translations array with ${translations.length} items`)
      translations.forEach((trans, idx) => {
        if (idx < 3) { // Log first 3 translations for debugging
          // console.log(`  Translation[${idx}]: "${trans?.substring(0, 50)}${trans?.length > 50 ? '...' : ''}"`)
        }
      })
      return translations
    } else if (typeof translations === 'object' && translations !== null) {
      // Extract English translations from the object format { en: [...], pt: [...] }
      const enTranslations = translations['en'] || []
      // console.log(`✅ LyricsView: Extracted ${enTranslations.length} English translations from object`)
      enTranslations.forEach((trans, idx) => {
        if (idx < 3) { // Log first 3 translations for debugging
          // console.log(`  EnTranslation[${idx}]: "${trans?.substring(0, 50)}${trans?.length > 50 ? '...' : ''}"`)
        }
      })
      return enTranslations
    }
    // console.log('⚠️ LyricsView: No translations available')
    return []
  }, [translations])

  const [selectedSentence, setSelectedSentence] = useState<string>('')
  const [selectedSentenceTranslations, setSelectedSentenceTranslations] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0)
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackMode: 'unavailable',
    playbackRate: 1.0
  })
  // NEW: Unified controls from EnhancedAudioPlayer
  const [audioControls, setAudioControls] = useState<AudioPlayerControls | null>(null)

  // Legacy: Keep these for backward compatibility during transition
  const [seekFunction, setSeekFunction] = useState<((time: number) => void) | null>(null)
  const [playFromTimeFunction, setPlayFromTimeFunction] = useState<((time: number) => Promise<boolean>) | null>(null)
  const [playbackRateFunction, setPlaybackRateFunction] = useState<((rate: number) => void) | null>(null)
  const [hasEverPlayed, setHasEverPlayed] = useState(false)
  const [playPauseFunction, setPlayPauseFunction] = useState<(() => void) | null>(null)
  const [clickPosition, setClickPosition] = useState<{ x: number, y: number, elementRect: DOMRect } | undefined>(undefined)
  const [lineLockMode, setLineLockMode] = useState(false) // When true, prevents auto-advancing lines
  const [lockedLineIndex, setLockedLineIndex] = useState<number>(-1) // The specific line to lock to

  const handleSentenceClick = useCallback((sentence: string, index: number, clickPos?: { x: number, y: number, elementRect: DOMRect }) => {
    // console.log('🖱️ LyricsView handleSentenceClick:', {
    //   sentence: sentence.substring(0, 50),
    //   index,
    //   hasSynchronized: !!synchronized,
    //   synchronizedLines: synchronized?.lines?.length,
    //   hasPlayFromTimeFunction: !!playFromTimeFunction,
    //   hasSeekFunction: !!seekFunction,
    //   hasPlayPauseFunction: !!playPauseFunction
    // })
    setSelectedSentence(sentence)
    setSelectedLineIndex(index)
    // Store click position for animation
    setClickPosition(clickPos)
    // Always use pre-downloaded translations if available
    if (processedTranslations[index]) {
      setSelectedSentenceTranslations([processedTranslations[index]])
    } else {
      setSelectedSentenceTranslations([])
    }
    setIsModalOpen(true)
    console.log('📱 LyricsView: Opening translation modal, calling callback:', !!onTranslationModalChange)
    onTranslationModalChange?.(true)
  }, [processedTranslations, synchronized, playFromTimeFunction, seekFunction, playPauseFunction, onTranslationModalChange])

  const handleAudioStateChange = useCallback((state: AudioPlayerState) => {
    // Log every 10th update to avoid spam
    if (Math.floor(state.currentTime / 1000) % 10 === 0) {
      console.log('🎵 Audio state update:', {
        currentTime: state.currentTime,
        isPlaying: state.isPlaying,
        playbackMode: state.playbackMode
      })
    }
    setAudioState(state)
    // Track if the song has ever been played
    if (state.isPlaying) {
      setHasEverPlayed(true)
    }
    if (onPlayStateChange) {
      onPlayStateChange(state.isPlaying)
    }
  }, [onPlayStateChange])

  // Auto-advance modal content when playing
  useEffect(() => {
    // Only auto-advance if not in line lock mode
    if (isModalOpen && audioState.isPlaying && synchronized?.lines && !lineLockMode) {
      const currentTimeMs = audioState.playbackMode === 'spotify'
        ? audioState.currentTime
        : audioState.currentTime * 1000

      console.log('🔍 Auto-advance check:', {
        currentTimeMs,
        selectedLineIndex,
        lineLockMode,
        isPlaying: audioState.isPlaying
      })

      // Find the current line based on playback time
      for (let i = 0; i < synchronized.lines.length; i++) {
        const line = synchronized.lines[i]
        const startTime = line.time || line.startTime || 0
        const startTimeMs = startTime > 1000 ? startTime : startTime * 1000

        const nextLine = synchronized.lines[i + 1]
        const endTimeMs = nextLine
          ? ((nextLine.time || nextLine.startTime || 0) > 1000
            ? (nextLine.time || nextLine.startTime || 0)
            : (nextLine.time || nextLine.startTime || 0) * 1000)
          : startTimeMs + 5000 // Default 5 seconds for last line

        if (currentTimeMs >= startTimeMs && currentTimeMs < endTimeMs) {
          console.log('📍 Found current line:', {
            lineIndex: i,
            selectedLineIndex,
            shouldUpdate: i !== selectedLineIndex,
            lineText: lines[i]?.substring(0, 30)
          })
          // Only update if we've moved to a different line
          if (i !== selectedLineIndex) {
            console.log('✅ Updating modal to line', i)
            setSelectedLineIndex(i)
            setSelectedSentence(lines[i])
            if (processedTranslations[i]) {
              setSelectedSentenceTranslations([processedTranslations[i]])
            } else {
              setSelectedSentenceTranslations([])
            }
          }
          break
        }
      }
    }
  }, [isModalOpen, audioState.isPlaying, audioState.currentTime, audioState.playbackMode, synchronized, lines, processedTranslations, selectedLineIndex, lineLockMode])

  const handleSeekFunctionSet = useCallback((seekFn: (time: number) => void, playFromTimeFn?: (time: number) => Promise<boolean>) => {
    // console.log('📡 LyricsView: handleSeekFunctionSet called', {
    //   hasSeekFn: !!seekFn,
    //   hasPlayFromTimeFn: !!playFromTimeFn
    // })
    setSeekFunction(() => seekFn)
    if (playFromTimeFn) {
      // console.log('✅ Setting playFromTimeFunction')
      setPlayFromTimeFunction(() => playFromTimeFn)
    } else {
      // console.log('⚠️ No playFromTimeFn provided')
    }
  }, [])

  const handlePlaybackRateFunctionSet = useCallback((rateFn: (rate: number) => void) => {
    setPlaybackRateFunction(() => rateFn)
  }, [])

  const handleControlsReady = useCallback((controls: AudioPlayerControls) => {
    // console.log('🎮 LyricsView: Received unified controls from EnhancedAudioPlayer')
    setAudioControls(controls)
  }, [])

  const handleLyricsTimeSeek = useCallback((timeInMs: number) => {
    if (seekFunction) {
      seekFunction(timeInMs)
    }
  }, [seekFunction])

  // Create our own callback to capture the play/pause function from EnhancedAudioPlayer
  const handlePlayPauseReady = useCallback((playPauseFn: () => void) => {
    // console.log('✅ LyricsView: Received play/pause function from EnhancedAudioPlayer')
    setPlayPauseFunction(() => playPauseFn)

    // Also call the parent's onPlayPauseReady if it exists
    if (onPlayPauseReady && typeof onPlayPauseReady === 'function') {
      onPlayPauseReady(playPauseFn)
    }
  }, [onPlayPauseReady])

  return (
    <div className={`transition-all duration-300 ${hasEverPlayed ? 'pb-32' : 'pb-6'}`}>
      {/* Enhanced Audio Player */}
      {track && (
        <EnhancedAudioPlayer
          track={track}
          onStateChange={handleAudioStateChange}
          onControlsReady={handleControlsReady}
          onTimeSeek={handleSeekFunctionSet}
          onPlaybackRateChange={handlePlaybackRateFunctionSet}
          onPlayPauseReady={handlePlayPauseReady}
        />
      )}

      {/* Synchronized Lyrics with Animation */}
      <SynchronizedLyrics
        lines={displayLanguage === 'english' && processedTranslations.length > 0 ? processedTranslations : lines}
        currentTime={audioState.currentTime}
        duration={audioState.duration}
        isPlaying={audioState.isPlaying}
        playbackMode={audioState.playbackMode}
        translations={displayLanguage === 'spanish' ? processedTranslations : displayLanguage === 'english' ? lines : displayLanguage === 'both' ? processedTranslations : []}
        isDemo={isDemo}
        backgroundColor={backgroundColor}
        synchronizedData={displayLanguage === 'english' && processedTranslations.length > 0 && synchronized ? {
          ...synchronized,
          lines: synchronized.lines.map((line, index) => {
            const englishText = processedTranslations[index] || line.text
            return {
              ...line,
              text: englishText,
              // When in English mode, we lose word-level timing since translations are line-based
              words: undefined
            }
          })
        } : synchronized}
        onTimeSeek={handleLyricsTimeSeek}
        playbackRate={audioState.playbackRate}
        onPlaybackRateChange={(rate) => {
          if (playbackRateFunction) {
            playbackRateFunction(rate)
          }
        }}
        displayLanguage={displayLanguage}
        onPlayFromTime={playFromTimeFunction}
        onPlay={() => {
          // Use audioControls if available, fall back to playPauseFunction
          if (audioControls && !audioState.isPlaying) {
            audioControls.play()
          } else if (playPauseFunction && !audioState.isPlaying) {
            playPauseFunction()
          }
        }}
        onPause={() => {
          // Use audioControls if available for guaranteed pause
          if (audioControls) {
            audioControls.pause()
          } else if (playPauseFunction) {
            playPauseFunction()
          }
        }}
        onSentenceClick={handleSentenceClick}
        lineLockMode={lineLockMode}
        lockedLineIndex={lockedLineIndex}
      />

      {/* Bottom Sheet */}
      <TranslationBottomSheet
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setClickPosition(undefined) // Clear click position on close
          onTranslationModalChange?.(false)
        }}
        sentence={selectedSentence}
        translations={selectedSentenceTranslations}
        backgroundColor={backgroundColor}
        synchronizedData={synchronized}
        currentLineIndex={selectedLineIndex}
        totalLines={lines.length}
        audioControls={audioControls}
        clickPosition={clickPosition}
        onSetLineLock={(locked: boolean, lineIndex?: number) => {
          setLineLockMode(locked)
          if (locked && lineIndex !== undefined) {
            setLockedLineIndex(lineIndex)
          } else if (!locked) {
            setLockedLineIndex(-1)
          }
        }}
        onTimeSeek={(timeInMs: number) => {
          if (seekFunction) {
            seekFunction(timeInMs)
          }
        }}
        onPlayFromTime={playFromTimeFunction}
        isPlaying={audioState.isPlaying}
        onNavigatePrevious={() => {
          if (selectedLineIndex > 0) {
            const newIndex = selectedLineIndex - 1
            handleSentenceClick(lines[newIndex], newIndex)
            // Seek to the line's start time if synchronized data exists
            if (synchronized?.lines?.[newIndex]) {
              const line = synchronized.lines[newIndex]
              const startTime = line.time || line.startTime || 0
              // Convert to milliseconds if needed
              const timeInMs = startTime > 1000 ? startTime : startTime * 1000

              // Use audioControls if available, otherwise use seekFunction
              if (audioControls) {
                audioControls.seek(timeInMs)
              } else if (seekFunction) {
                seekFunction(timeInMs)
              }
            }
          }
        }}
        onNavigateNext={() => {
          if (selectedLineIndex < lines.length - 1) {
            const newIndex = selectedLineIndex + 1
            handleSentenceClick(lines[newIndex], newIndex)
            // Seek to the line's start time if synchronized data exists
            if (synchronized?.lines?.[newIndex]) {
              const line = synchronized.lines[newIndex]
              const startTime = line.time || line.startTime || 0
              // Convert to milliseconds if needed
              const timeInMs = startTime > 1000 ? startTime : startTime * 1000

              // Use audioControls if available, otherwise use seekFunction
              if (audioControls) {
                audioControls.seek(timeInMs)
              } else if (seekFunction) {
                seekFunction(timeInMs)
              }
            }
          }
        }}
        onPlay={() => {
          // Always use audioControls for consistent behavior
          if (!audioState.isPlaying) {
            audioControls?.play()
          }
        }}
        onPause={() => {
          // Always use audioControls for guaranteed pause
          audioControls?.pause()
        }}
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