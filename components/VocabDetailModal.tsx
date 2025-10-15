'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Volume2, Loader2, Play, X, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface VocabDetailModalProps {
  isOpen: boolean
  onClose: () => void
  word: string
  translation: string
  partOfSpeech: string
  count: number
  language: string
  root?: string
  exampleSentence?: string
  exampleTranslation?: string
  synonyms?: string[]
  conjugations?: {
    present?: string[]
    preterite?: string[]
    imperfect?: string[]
    future?: string[]
    conditional?: string[]
    subjunctive?: string[]
    'present-perfect'?: string[]
    pluperfect?: string[]
  }
  lyricLineInSong?: string
  lyricLineTranslation?: string
  lyricLineIndex?: number
  songId?: string
}

export function VocabDetailModal({
  isOpen,
  onClose,
  word,
  translation,
  partOfSpeech,
  count,
  language,
  root,
  exampleSentence,
  exampleTranslation,
  synonyms,
  conjugations,
  lyricLineInSong,
  lyricLineTranslation,
  lyricLineIndex,
  songId,
}: VocabDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPlayingLine, setIsPlayingLine] = useState(false)
  const isVerb = partOfSpeech.toLowerCase() === 'verb'
  const isNounOrAdjective = ['noun', 'adjective'].includes(partOfSpeech.toLowerCase())

  // Animation state for bottom sheet
  const controls = useAnimation()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  // Track window size for responsive positioning
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Fetch song data to get synchronized lyrics
  const { data: lyricsData } = useQuery({
    queryKey: ['song-lyrics', songId],
    queryFn: async () => {
      if (!songId) return null
      const response = await fetch(`/api/lyrics/${songId}`)
      if (!response.ok) return null
      return response.json()
    },
    enabled: !!songId && lyricLineIndex !== undefined
  })

  // Parse synchronized lyrics to get timing data
  const getLineTiming = (): { startTime: number; endTime: number } | null => {
    if (!lyricsData?.synchronized?.lines || lyricLineIndex === undefined) {
      console.log('🎵 getLineTiming: Missing data', {
        hasLyricsData: !!lyricsData,
        hasSynchronized: !!lyricsData?.synchronized,
        hasLines: !!lyricsData?.synchronized?.lines,
        linesLength: lyricsData?.synchronized?.lines?.length,
        lyricLineIndex
      })
      return null
    }

    const synchronizedLines = lyricsData.synchronized.lines

    console.log('🎵 Synchronized data:', {
      linesLength: synchronizedLines.length,
      lyricLineIndex,
      hasLineAtIndex: !!synchronizedLines[lyricLineIndex],
      firstLine: synchronizedLines[0],
      targetLine: synchronizedLines[lyricLineIndex]
    })

    if (synchronizedLines[lyricLineIndex]) {
      const line = synchronizedLines[lyricLineIndex]
      const nextLine = synchronizedLines[lyricLineIndex + 1]

      // Handle both 'time' and 'startTime' properties
      // And handle both seconds and milliseconds
      const startTime = line.time || line.startTime || 0
      const startTimeMs = startTime > 1000 ? startTime : startTime * 1000

      const nextTime = nextLine?.time || nextLine?.startTime || 0
      const endTimeMs = nextLine
        ? (nextTime > 1000 ? nextTime : nextTime * 1000)
        : startTimeMs + 3000

      const timing = {
        startTime: startTimeMs,
        endTime: endTimeMs
      }
      console.log('🎵 Found timing:', timing)
      return timing
    } else {
      console.log('🎵 No synchronized line at index', lyricLineIndex)
    }

    return null
  }

  // Handle modal open for playhead positioning
  useEffect(() => {
    if (isOpen && lyricLineIndex !== undefined) {
      const timing = getLineTiming()
      if (timing) {
        console.log('📖 [VocabModal] Opening - moving playhead to line', lyricLineIndex, 'at', timing.startTime, 'ms')

        // Save current position and move playhead to this line
        const event = new CustomEvent('vocab-modal-open', {
          detail: {
            startTime: timing.startTime,
            songId
          }
        })
        window.dispatchEvent(event)
      }
    }
    // Note: Close event is now handled in handleClose callback
  }, [isOpen, lyricLineIndex, lyricsData, songId])

  const playLineInSong = async () => {
    console.log('🎵 Play button clicked', {
      songId,
      lyricLineIndex,
      hasLyricsData: !!lyricsData,
      hasSynchronized: !!lyricsData?.synchronized
    })

    const timing = getLineTiming()
    console.log('🎵 Timing data:', timing)

    if (!timing) {
      console.warn('No timing data available for this line')
      return
    }

    // Emit custom event for LyricsView to handle
    console.log('🎵 Dispatching vocab-play-line event', {
      startTime: timing.startTime,
      endTime: timing.endTime,
      songId
    })

    const event = new CustomEvent('vocab-play-line', {
      detail: {
        startTime: timing.startTime,
        endTime: timing.endTime,
        songId
      }
    })
    window.dispatchEvent(event)
    setIsPlayingLine(true)

    // Reset playing state after the line duration
    setTimeout(() => {
      setIsPlayingLine(false)
    }, timing.endTime - timing.startTime)
  }

  // Get available tenses from conjugations
  const availableTenses = conjugations ? Object.keys(conjugations).filter(
    key => conjugations[key as keyof typeof conjugations]?.length ?? 0 > 0
  ) : []

  const [expandedTenses, setExpandedTenses] = useState<Set<string>>(new Set([availableTenses[0] || 'present']))

  // Language-specific conjugation labels
  const pronouns = language === 'fr'
    ? ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles']
    : ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos/ellas']

  const tenseInfo: Record<string, { label: string; description: string }> = language === 'fr' ? {
    present: { label: 'Présent', description: 'Describes actions happening now or habitual actions' },
    'passe-compose': { label: 'Passé Composé', description: 'Describes completed actions in the past' },
    preterite: { label: 'Passé Composé', description: 'Describes completed actions in the past' },
    imperfect: { label: 'Imparfait', description: 'Describes ongoing or habitual actions in the past' },
    'futur-simple': { label: 'Futur Simple', description: 'Describes actions that will happen in the future' },
    future: { label: 'Futur Simple', description: 'Describes actions that will happen in the future' },
    conditionnel: { label: 'Conditionnel', description: 'Describes what would happen under certain conditions' },
    conditional: { label: 'Conditionnel', description: 'Describes what would happen under certain conditions' },
    'subjonctif-present': { label: 'Subjonctif Présent', description: 'Expresses doubt, desire, emotion, or necessity' },
    subjunctive: { label: 'Subjonctif Présent', description: 'Expresses doubt, desire, emotion, or necessity' },
    'plus-que-parfait': { label: 'Plus-que-Parfait', description: 'Describes actions that had happened before another past action' },
    pluperfect: { label: 'Plus-que-Parfait', description: 'Describes actions that had happened before another past action' },
    'futur-anterieur': { label: 'Futur Antérieur', description: 'Describes actions that will have been completed by a future time' },
    'future-perfect': { label: 'Futur Antérieur', description: 'Describes actions that will have been completed by a future time' },
    'passe-simple': { label: 'Passé Simple', description: 'Literary past tense used primarily in formal writing' },
    'simple-past': { label: 'Passé Simple', description: 'Literary past tense used primarily in formal writing' },
    'subjonctif-imparfait': { label: 'Subjonctif Imparfait', description: 'Literary subjunctive used in formal writing' },
    'imperfect-subjunctive': { label: 'Subjonctif Imparfait', description: 'Literary subjunctive used in formal writing' },
  } : {
    present: { label: 'Presente', description: 'Describes actions happening now or habitual actions' },
    preterite: { label: 'Pretérito', description: 'Describes completed actions in the past' },
    imperfect: { label: 'Imperfecto', description: 'Describes ongoing or habitual actions in the past' },
    future: { label: 'Futuro', description: 'Describes actions that will happen in the future' },
    conditional: { label: 'Condicional', description: 'Describes what would happen under certain conditions' },
    subjunctive: { label: 'Subjuntivo Presente', description: 'Expresses doubt, desire, emotion, or necessity' },
    'present-perfect': { label: 'Pretérito Perfecto', description: 'Describes actions that have been completed recently' },
    pluperfect: { label: 'Pluscuamperfecto', description: 'Describes actions that had happened before another past action' },
    'future-perfect': { label: 'Futuro Perfecto', description: 'Describes actions that will have been completed by a future time' },
  }

  const speakSentence = async () => {
    if (!exampleSentence || isPlaying) return

    setIsPlaying(true)

    try {
      // Try cloud TTS API first for better quality
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: exampleSentence,
          language,
        }),
      })

      const data = await response.json()

      // If cloud TTS is available, play the audio
      if (data.audio && !data.useBrowserTTS) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
        audio.playbackRate = 1.0
        audio.onended = () => setIsPlaying(false)
        audio.onerror = () => {
          setIsPlaying(false)
          // Fallback to browser TTS on error
          useBrowserTTS()
        }
        await audio.play()
        return
      }
    } catch (error) {
      console.log('Cloud TTS unavailable, using browser TTS')
    }

    // Fallback to browser TTS
    useBrowserTTS()
  }

  const useBrowserTTS = () => {
    const utterance = new SpeechSynthesisUtterance(exampleSentence)

    // Map language codes to speech synthesis voices
    const langMap: Record<string, string> = {
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ko: 'ko-KR',
      ar: 'ar-SA',
      hi: 'hi-IN',
    }

    const targetLang = langMap[language] || language
    utterance.lang = targetLang

    // Select the best quality voice for the language
    const voices = window.speechSynthesis.getVoices()
    const matchingVoices = voices.filter(voice =>
      voice.lang.startsWith(targetLang.split('-')[0])
    )

    // Prioritize voices with quality indicators
    const qualityIndicators = ['premium', 'enhanced', 'natural', 'google', 'microsoft', 'apple']
    const bestVoice = matchingVoices.find(voice =>
      qualityIndicators.some(indicator =>
        voice.name.toLowerCase().includes(indicator)
      )
    ) || matchingVoices.find(voice => voice.localService) || matchingVoices[0]

    if (bestVoice) {
      utterance.voice = bestVoice
    }

    utterance.rate = 0.85
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.speak(utterance)
  }

  const speakConjugation = (text: string) => {
    // Use simple browser TTS for conjugations (no API call needed)
    const utterance = new SpeechSynthesisUtterance(text)

    const langMap: Record<string, string> = {
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-PT',
      ru: 'ru-RU',
      ja: 'ja-JP',
      zh: 'zh-CN',
      ko: 'ko-KR',
      ar: 'ar-SA',
      hi: 'hi-IN',
    }

    const targetLang = langMap[language] || language
    utterance.lang = targetLang

    const voices = window.speechSynthesis.getVoices()
    const matchingVoices = voices.filter(voice =>
      voice.lang.startsWith(targetLang.split('-')[0])
    )

    const qualityIndicators = ['premium', 'enhanced', 'natural', 'google', 'microsoft', 'apple']
    const bestVoice = matchingVoices.find(voice =>
      qualityIndicators.some(indicator =>
        voice.name.toLowerCase().includes(indicator)
      )
    ) || matchingVoices.find(voice => voice.localService) || matchingVoices[0]

    if (bestVoice) {
      utterance.voice = bestVoice
    }

    utterance.rate = 0.85
    utterance.pitch = 1.0
    utterance.volume = 1.0

    window.speechSynthesis.speak(utterance)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      // Dispatch close event before calling onClose
      console.log('📖 [VocabModal] Dialog closing - resetting playhead')
      const event = new CustomEvent('vocab-modal-close', { detail: { songId } })
      window.dispatchEvent(event)
    }
    onClose()
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldClose = info.velocity.y > 20 || (info.velocity.y >= 0 && info.offset.y > 100)

    if (shouldClose) {
      controls.start({
        y: '100%',
        transition: { type: 'spring', damping: 40, stiffness: 600 }
      })
      setTimeout(() => {
        const event = new CustomEvent('vocab-modal-close', { detail: { songId } })
        window.dispatchEvent(event)
        onClose()
      }, 200)
    } else {
      controls.start({
        y: 0,
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
            className="fixed inset-0 bg-black/20 z-[60] m-0 p-0"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              margin: 0,
              padding: 0,
            }}
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
            initial={{
              x: 0,
              y: windowSize.width >= 640 ? 0 : '100%',
              opacity: windowSize.width >= 640 ? 1 : 0
            }}
            whileInView={{
              x: 0,
              y: 0,
              opacity: 1
            }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 40,
              stiffness: 600
            }}
            className={`fixed z-[61] bottom-0 bg-white/50 rounded-t-3xl border-t border-gray-200/50 overflow-hidden flex flex-col ${isDragging ? 'select-none' : ''}`}
            style={{
              backdropFilter: 'blur(96px)',
              left: windowSize.width >= 640 ? '50%' : '0',
              right: windowSize.width >= 640 ? 'auto' : '0',
              top: windowSize.width >= 640 ? '50%' : 'auto',
              bottom: windowSize.width >= 640 ? 'auto' : '0',
              width: windowSize.width >= 640 ? '672px' : '100%',
              height: windowSize.width >= 640 ? 'min(800px, 90vh)' : '90vh',
              marginLeft: windowSize.width >= 640 ? '-336px' : '0',
              marginTop: windowSize.width >= 640 ? (
                windowSize.height * 0.9 > 800 ? '-400px' : `${-(windowSize.height * 0.9 / 2)}px`
              ) : '0',
              borderRadius: windowSize.width >= 640 ? '24px' : '24px 24px 0 0',
              border: windowSize.width >= 640 ? '1px solid rgba(229, 231, 235, 0.5)' : undefined,
              borderTop: windowSize.width < 640 ? '1px solid rgba(229, 231, 235, 0.5)' : undefined
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full bg-gray-400" />
            </div>

            {/* Header */}
            <motion.div
              className="px-3 pb-3 flex items-center justify-between relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.05 } }}>
              <div className="bg-background/80 backdrop-blur-sm rounded-full">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const event = new CustomEvent('vocab-modal-close', { detail: { songId } })
                    window.dispatchEvent(event)
                    onClose()
                  }}
                  className="h-9 w-9 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-900">
                  {partOfSpeech.toLowerCase()}
                </Badge>
                {count > 1 && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                    ×{count}
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              className="px-3 pb-4 space-y-4 overflow-y-auto flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.3 } }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.05 } }}
            >
              {/* Word & Translation - No Background */}
              <div className="text-center py-2">
                <div className="flex flex-col items-center gap-2">
                  <span
                    style={{
                      fontSize: '44px',
                      lineHeight: '52px',
                      fontWeight: 400,
                      color: '#000',
                      textTransform: 'capitalize',
                    }}
                  >
                    {isVerb && root ? root : word}
                  </span>
                  <p
                    style={{
                      fontSize: '24px',
                      lineHeight: '32px',
                      fontWeight: 400,
                      color: 'rgba(0, 0, 0, 0.80)',
                    }}
                  >
                    {isVerb ? `to ${translation.toLowerCase()}` : translation}
                  </p>
                </div>
              </div>

              {/* Lyric Line from Song */}
              {lyricLineInSong && (
                <div>
                  <div
                    className="rounded-lg"
                    style={{
                      fontSize: '20px',
                      lineHeight: '28px',
                      fontWeight: 400,
                      color: 'rgba(0, 0, 0, 0.90)',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      padding: '24px',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="italic flex-1">{lyricLineInSong}</p>
                      {lyricLineIndex !== undefined && songId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={playLineInSong}
                          disabled={isPlayingLine}
                          className="h-8 w-8 p-0 flex-shrink-0 text-gray-700 hover:bg-gray-200"
                          title="Play this line from the song"
                        >
                          {isPlayingLine ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {lyricLineTranslation && (
                      <p className="text-base mt-1 opacity-70">
                        {lyricLineTranslation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Example Sentence */}
              {exampleSentence && (
                <div>
                  <div
                    className="rounded-lg"
                    style={{
                      fontSize: '20px',
                      lineHeight: '28px',
                      fontWeight: 400,
                      color: 'rgba(0, 0, 0, 0.90)',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      padding: '24px',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="italic flex-1">{exampleSentence}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={speakSentence}
                        disabled={isPlaying}
                        className="h-8 w-8 p-0 flex-shrink-0 text-gray-700 hover:bg-gray-200"
                      >
                        {isPlaying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {exampleTranslation && (
                      <p className="text-base mt-1 opacity-70">
                        {exampleTranslation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Synonyms (for nouns/adjectives) */}
              {isNounOrAdjective && synonyms && synonyms.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Synonyms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {synonyms.map((synonym, index) => (
                      <Badge key={index} className="text-sm bg-gray-200 text-gray-900 border-gray-300">
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Conjugations (for verbs) */}
              {isVerb && conjugations && availableTenses.length > 0 && (
                <div className="space-y-2">
                  {availableTenses.map((tense) => {
                    const isExpanded = expandedTenses.has(tense)

                    return (
                      <div
                        key={tense}
                        className="rounded-lg"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        }}
                      >
                        {/* Collapsible Header */}
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedTenses)
                            if (isExpanded) {
                              newExpanded.delete(tense)
                            } else {
                              newExpanded.add(tense)
                            }
                            setExpandedTenses(newExpanded)
                          }}
                          className="w-full flex items-center justify-between transition-colors"
                          style={{
                            padding: '16px 24px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '18px',
                              lineHeight: '24px',
                              fontWeight: 500,
                              color: 'rgba(0, 0, 0, 0.90)',
                            }}
                          >
                            {tenseInfo[tense]?.label || tense}
                          </span>
                          <ChevronDown
                            className="transition-transform duration-200"
                            style={{
                              width: '20px',
                              height: '20px',
                              color: 'rgba(0, 0, 0, 0.60)',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                          />
                        </button>

                        {/* Collapsible Content */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ padding: '0 24px 24px 24px' }}>
                                {/* Tense Description */}
                                {tenseInfo[tense]?.description && (
                                  <p className="text-sm text-gray-600 mb-3 italic">
                                    {tenseInfo[tense].description}
                                  </p>
                                )}

                                {/* Conjugation Table */}
                                <div>
                                  <table className="w-full">
                                    <thead>
                                      <tr className="border-b border-gray-300">
                                        <th className="text-left py-2 px-3 font-medium text-gray-700 text-sm">
                                          Pronoun
                                        </th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700 text-sm">
                                          Conjugation
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pronouns.map((pronoun, i) => {
                                        const conjugation = conjugations[tense as keyof typeof conjugations]?.[i]
                                        return (
                                          <tr key={i} className="border-b border-gray-200 last:border-0">
                                            <td className="py-2 px-3 text-gray-700 text-sm font-light">
                                              {pronoun}
                                            </td>
                                            <td className="py-2 px-3">
                                              {conjugation && conjugation !== '-' ? (
                                                <button
                                                  onClick={() => speakConjugation(conjugation)}
                                                  className="font-normal text-base text-gray-900 hover:text-gray-700 transition-colors cursor-pointer"
                                                >
                                                  {conjugation}
                                                </button>
                                              ) : (
                                                <span className="font-normal text-base text-gray-400">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
