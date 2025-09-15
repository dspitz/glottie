import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { EnhancedAudioPlayer, AudioPlayerState } from '@/components/EnhancedAudioPlayer'
import { SynchronizedLyrics } from '@/components/SynchronizedLyrics'
import { SentenceModal } from '@/components/SentenceModal'
import { WordPopover } from '@/components/WordPopover'
import { segmentIntoSentences } from '@/lib/utils'
import { ExternalLink, Music2 } from 'lucide-react'

interface LyricsViewProps {
  lines: string[]
  translations?: string[]
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
  synchronized
}: LyricsViewProps) {
  const [selectedSentence, setSelectedSentence] = useState<string>('')
  const [selectedSentenceTranslations, setSelectedSentenceTranslations] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackMode: 'unavailable'
  })
  const [seekFunction, setSeekFunction] = useState<((time: number) => void) | null>(null)

  const handleSentenceClick = useCallback((sentence: string, index: number) => {
    setSelectedSentence(sentence)
    // In demo mode, use provided translations
    if (isDemo && translations[index]) {
      setSelectedSentenceTranslations([translations[index]])
    } else {
      setSelectedSentenceTranslations([])
    }
    setIsModalOpen(true)
  }, [translations, isDemo])

  const handleAudioStateChange = useCallback((state: AudioPlayerState) => {
    setAudioState(state)
  }, [])

  const handleSeekFunctionSet = useCallback((seekFn: (time: number) => void) => {
    setSeekFunction(() => seekFn)
  }, [])

  const handleLyricsTimeSeek = useCallback((timeInMs: number) => {
    if (seekFunction) {
      seekFunction(timeInMs)
    }
  }, [seekFunction])

  return (
    <div className="space-y-6">
      {/* Enhanced Audio Player */}
      {track && (
        <EnhancedAudioPlayer 
          track={track} 
          className="mb-6"
          onStateChange={handleAudioStateChange}
          onTimeSeek={handleSeekFunctionSet}
        />
      )}

      {/* Synchronized Lyrics */}
      <SynchronizedLyrics
        lines={lines}
        currentTime={audioState.currentTime}
        duration={audioState.duration}
        isPlaying={audioState.isPlaying}
        playbackMode={audioState.playbackMode}
        translations={translations}
        isDemo={isDemo}
        backgroundColor={backgroundColor}
        onTimeSeek={handleLyricsTimeSeek}
        synchronizedData={synchronized}
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