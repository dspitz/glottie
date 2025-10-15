'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Volume2, Loader2, Play } from 'lucide-react'
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

  // Handle modal open/close for playhead positioning
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
    } else if (!isOpen) {
      console.log('📖 [VocabModal] Closing - restoring playhead')

      // Restore saved playback position
      const event = new CustomEvent('vocab-modal-close', { detail: { songId } })
      window.dispatchEvent(event)
    }
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

  const [selectedTense, setSelectedTense] = useState<string>(availableTenses[0] || 'present')

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col overflow-hidden bg-black/90 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap text-white">
            <span className="text-2xl font-bold">{word}</span>
            {isVerb && root && (
              <span className="text-lg text-white/70">
                ({root})
              </span>
            )}
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/20">
              {partOfSpeech.toLowerCase()}
            </Badge>
            {count > 1 && (
              <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                appears {count}× in song
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-4">
          {/* Translation */}
          <div className="rounded-lg bg-white/10 p-4">
            <h4 className="text-sm font-semibold text-white/70 mb-2">
              Translation
            </h4>
            <p className="text-lg text-white">{translation}</p>
          </div>

          {/* Lyric Line from Song */}
          {lyricLineInSong && (
            <div>
              <h4 className="text-sm font-semibold text-white/70 mb-2">
                As Used in This Song
              </h4>
              <div className="space-y-2 p-4 rounded-lg border border-white/20 bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base italic text-white flex-1">"{lyricLineInSong}"</p>
                  {lyricLineIndex !== undefined && songId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={playLineInSong}
                      disabled={isPlayingLine}
                      className="h-8 w-8 p-0 flex-shrink-0 text-white hover:bg-white/20 hover:text-white"
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
                  <p className="text-sm text-white/70">
                    {lyricLineTranslation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Example Sentence */}
          {exampleSentence && (
            <div>
              <h4 className="text-sm font-semibold text-white/70 mb-2">
                Usage in a Sentence
              </h4>
              <div className="space-y-2 p-4 rounded-lg border border-white/20 bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base italic text-white flex-1">"{exampleSentence}"</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={speakSentence}
                    disabled={isPlaying}
                    className="h-8 w-8 p-0 flex-shrink-0 text-white hover:bg-white/20 hover:text-white"
                  >
                    {isPlaying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {exampleTranslation && (
                  <p className="text-sm text-white/70">
                    {exampleTranslation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Synonyms (for nouns/adjectives) */}
          {isNounOrAdjective && synonyms && synonyms.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white/70 mb-2">
                Synonyms
              </h4>
              <div className="flex flex-wrap gap-2">
                {synonyms.map((synonym, index) => (
                  <Badge key={index} variant="outline" className="text-sm bg-white/10 text-white border-white/20">
                    {synonym}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Conjugations (for verbs) */}
          {isVerb && conjugations && availableTenses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white/70 mb-3">
                Conjugations
              </h4>

              {/* Tense Selector Pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {availableTenses.map((tense) => (
                  <button
                    key={tense}
                    onClick={() => setSelectedTense(tense)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedTense === tense
                        ? 'bg-white/30 text-white border border-white/30'
                        : 'bg-white/10 hover:bg-white/20 text-white/70 border border-white/20'
                    }`}
                  >
                    {tenseInfo[tense]?.label || tense}
                  </button>
                ))}
              </div>

              {/* Tense Description */}
              {tenseInfo[selectedTense] && (
                <p className="text-sm text-white/70 mb-3 italic">
                  {tenseInfo[selectedTense].description}
                </p>
              )}

              {/* Single Tense Table */}
              <div className="overflow-x-auto">
                <div className="p-4 rounded-lg bg-white/10 border border-white/20">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-2 px-3 font-medium text-white/70 text-sm">
                          Pronoun
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-white/70 text-sm">
                          {tenseInfo[selectedTense]?.label || selectedTense}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pronouns.map((pronoun, i) => {
                        const conjugation = conjugations[selectedTense as keyof typeof conjugations]?.[i]
                        return (
                          <tr key={i} className="border-b border-white/20 last:border-0">
                            <td className="py-2 px-3 text-white/70 text-sm font-light">
                              {pronoun}
                            </td>
                            <td className="py-2 px-3">
                              {conjugation && conjugation !== '-' ? (
                                <button
                                  onClick={() => speakConjugation(conjugation)}
                                  className="font-normal text-base text-white hover:text-white/80 transition-colors cursor-pointer"
                                >
                                  {conjugation}
                                </button>
                              ) : (
                                <span className="font-normal text-base text-white/50">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
