import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { EnhancedAudioPlayer, AudioPlayerState } from '@/components/EnhancedAudioPlayer'
import { SynchronizedLyrics } from '@/components/SynchronizedLyricsClean'
import { SentenceModal } from '@/components/SentenceModal'
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
}

export function LyricsView({
  lines,
  translations = [],
  spotifyUrl,
  title,
  artist,
  isDemo = false,
  backgroundColor,
  track,
  synchronized,
  onPlayStateChange,
  onPlayPauseReady
}: LyricsViewProps) {
  // Debug: Log what LyricsView receives
  console.log('🎭 LyricsView received synchronized:', {
    hasSynchronized: !!synchronized,
    format: synchronized?.format,
    lineCount: synchronized?.lines?.length,
    firstLine: synchronized?.lines?.[0]
  })
  // Process translations - extract English translations if it's an object
  const processedTranslations = React.useMemo(() => {
    console.log('🔍 LyricsView: Processing translations', {
      type: typeof translations,
      isArray: Array.isArray(translations),
      keys: translations && typeof translations === 'object' ? Object.keys(translations) : null,
      firstTranslation: Array.isArray(translations) && translations[0] ? translations[0].substring(0, 40) : null,
      rawTranslations: translations
    })

    if (Array.isArray(translations)) {
      console.log(`✅ LyricsView: Using translations array with ${translations.length} items`)
      translations.forEach((trans, idx) => {
        if (idx < 3) { // Log first 3 translations for debugging
          console.log(`  Translation[${idx}]: "${trans?.substring(0, 50)}${trans?.length > 50 ? '...' : ''}"`)
        }
      })
      return translations
    } else if (typeof translations === 'object' && translations !== null) {
      // Extract English translations from the object format { en: [...], pt: [...] }
      const enTranslations = translations['en'] || []
      console.log(`✅ LyricsView: Extracted ${enTranslations.length} English translations from object`)
      enTranslations.forEach((trans, idx) => {
        if (idx < 3) { // Log first 3 translations for debugging
          console.log(`  EnTranslation[${idx}]: "${trans?.substring(0, 50)}${trans?.length > 50 ? '...' : ''}"`)
        }
      })
      return enTranslations
    }
    console.log('⚠️ LyricsView: No translations available')
    return []
  }, [translations])

  const [selectedSentence, setSelectedSentence] = useState<string>('')
  const [selectedSentenceTranslations, setSelectedSentenceTranslations] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackMode: 'unavailable',
    playbackRate: 1.0
  })
  const [seekFunction, setSeekFunction] = useState<((time: number) => void) | null>(null)
  const [playbackRateFunction, setPlaybackRateFunction] = useState<((rate: number) => void) | null>(null)

  const handleSentenceClick = useCallback((sentence: string, index: number) => {
    setSelectedSentence(sentence)
    // Always use pre-downloaded translations if available
    if (processedTranslations[index]) {
      setSelectedSentenceTranslations([processedTranslations[index]])
    } else {
      setSelectedSentenceTranslations([])
    }
    setIsModalOpen(true)
  }, [processedTranslations])

  const handleAudioStateChange = useCallback((state: AudioPlayerState) => {
    setAudioState(state)
    if (onPlayStateChange) {
      onPlayStateChange(state.isPlaying)
    }
  }, [onPlayStateChange])

  const handleSeekFunctionSet = useCallback((seekFn: (time: number) => void) => {
    setSeekFunction(() => seekFn)
  }, [])

  const handlePlaybackRateFunctionSet = useCallback((rateFn: (rate: number) => void) => {
    setPlaybackRateFunction(() => rateFn)
  }, [])

  const handleLyricsTimeSeek = useCallback((timeInMs: number) => {
    if (seekFunction) {
      seekFunction(timeInMs)
    }
  }, [seekFunction])

  return (
    <div className={`transition-all duration-300 ${audioState.isPlaying ? 'pb-32' : 'pb-6'}`}>
      {/* Enhanced Audio Player */}
      {track && (
        <EnhancedAudioPlayer
          track={track}
          onStateChange={handleAudioStateChange}
          onTimeSeek={handleSeekFunctionSet}
          onPlaybackRateChange={handlePlaybackRateFunctionSet}
          onPlayPauseReady={onPlayPauseReady}
        />
      )}

      {/* Synchronized Lyrics */}
      <SynchronizedLyrics
        lines={lines}
        currentTime={audioState.currentTime}
        duration={audioState.duration}
        isPlaying={audioState.isPlaying}
        playbackMode={audioState.playbackMode}
        translations={processedTranslations}
        isDemo={isDemo}
        backgroundColor={backgroundColor}
        synchronizedData={synchronized}
        onTimeSeek={handleLyricsTimeSeek}
        playbackRate={audioState.playbackRate}
        onPlaybackRateChange={(rate) => {
          if (playbackRateFunction) {
            playbackRateFunction(rate)
          }
        }}
      />

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