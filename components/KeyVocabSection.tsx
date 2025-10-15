'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Globe } from 'lucide-react'
import { VocabDetailModal } from './VocabDetailModal'

interface VocabWord {
  word: string
  translation: string
  count: number
  partOfSpeech?: string
  score: number
}

interface EnrichedWord {
  word: string
  translations: Record<string, string>
  root?: string
  partOfSpeech: string
  conjugations?: {
    present?: string[]
    preterite?: string[]
    imperfect?: string[]
    future?: string[]
  }
  synonyms?: string[]
  antonyms?: string[]
  definition?: string
  exampleSentence?: string
  exampleTranslation?: string
  usefulnessScore?: number
}

interface KeyVocabSectionProps {
  songId: string
  language: string
  userLanguage?: string // User's preferred language for translations
}

export function KeyVocabSection({
  songId,
  language,
  userLanguage = 'en'
}: KeyVocabSectionProps) {
  const [selectedWord, setSelectedWord] = useState<EnrichedWord | null>(null)
  const [selectedBasic, setSelectedBasic] = useState<VocabWord | null>(null)
  const [selectedLyricLine, setSelectedLyricLine] = useState<string | null>(null)
  const [selectedTranslation, setSelectedTranslation] = useState<string | null>(null)
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null)

  // Fetch with full enrichment to get proper translations
  const { data, isLoading, error } = useQuery({
    queryKey: ['vocab', songId, 'enriched'],
    queryFn: async () => {
      const response = await fetch(`/api/songs/${songId}/vocab?enrich=full`)
      if (!response.ok) {
        throw new Error('Failed to fetch vocabulary')
      }
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data?.vocab || data.vocab.length === 0) {
    return null
  }

  const basicVocab: VocabWord[] = data.vocab
  const enrichedVocab: EnrichedWord[] = data.enrichedVocab || []
  const lyrics: string[] = data.lyrics || []
  const translations: string[] = data.translations || []

  // Helper function to find which lyric line contains a word
  const findLyricLineWithWord = (word: string): { lyricLine: string; translation: string; lineIndex: number } | null => {
    const normalizedWord = word.toLowerCase().replace(/[¿?¡!.,;:"""''«»\(\)\[\]]/g, '')

    for (let i = 0; i < lyrics.length; i++) {
      const line = lyrics[i]
      const normalizedLine = line.toLowerCase().replace(/[¿?¡!.,;:"""''«»\(\)\[\]]/g, '')

      // Check if the word appears in this line (as a whole word)
      const wordRegex = new RegExp(`\\b${normalizedWord}\\b`, 'i')
      if (wordRegex.test(normalizedLine)) {
        return {
          lyricLine: line,
          translation: translations[i] || '',
          lineIndex: i
        }
      }
    }
    return null
  }

  // Only show vocabulary if we have enriched data
  // This prevents showing bad position-based translations
  if (enrichedVocab.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1 text-white">Key Vocabulary</h3>
          <p className="text-sm text-white/70">
            Analyzing vocabulary and preparing translations...
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-white/60" />
        </div>
      </div>
    )
  }

  // Merge basic vocab with enriched data
  // ALWAYS use enriched translations (never fall back to position-based)
  const displayVocab = basicVocab
    .map(basic => {
      const enriched = enrichedVocab.find(e =>
        e.word.toLowerCase() === basic.word.toLowerCase()
      )

      // Skip words that don't have enriched translations
      if (!enriched?.translations?.[userLanguage]) {
        return null
      }

      // Filter out proper nouns
      if (enriched.partOfSpeech?.toLowerCase() === 'proper noun' ||
          enriched.partOfSpeech?.toLowerCase() === 'proper_noun' ||
          enriched.partOfSpeech?.toLowerCase() === 'propernoun') {
        return null
      }

      // Also filter out words that are likely proper nouns (capitalized)
      // Ignore first character if it's a special character
      const firstLetter = basic.word.replace(/^[^a-zA-ZÀ-ÿ]+/, '')[0]
      if (firstLetter && firstLetter === firstLetter.toUpperCase() && firstLetter !== firstLetter.toLowerCase()) {
        return null
      }

      return {
        basic,
        enriched,
      }
    })
    .filter(Boolean) // Remove null entries

  // Group by part of speech and deduplicate verbs by root
  const groupedVocab: Record<string, typeof displayVocab> = {
    verb: [],
    noun: [],
    adjective: [],
    adverb: [],
    other: []
  }

  // Track seen verbs by their root to avoid duplicates
  const seenVerbRoots = new Set<string>()

  displayVocab.forEach(item => {
    const pos = item.enriched.partOfSpeech.toLowerCase()

    if (pos === 'verb') {
      // Deduplicate verbs by their root/infinitive
      const verbKey = item.enriched.root?.toLowerCase() || item.basic.word.toLowerCase()
      if (!seenVerbRoots.has(verbKey)) {
        seenVerbRoots.add(verbKey)
        groupedVocab.verb.push(item)
      }
    } else if (pos === 'noun') {
      groupedVocab.noun.push(item)
    } else if (pos === 'adjective') {
      groupedVocab.adjective.push(item)
    } else if (pos === 'adverb') {
      groupedVocab.adverb.push(item)
    } else {
      groupedVocab.other.push(item)
    }
  })

  // Part of speech labels
  const posLabels: Record<string, string> = {
    verb: 'Verbs',
    noun: 'Nouns',
    adjective: 'Adjectives',
    adverb: 'Adverbs',
    other: 'Other'
  }

  const handleWordClick = (basic: VocabWord, enriched: EnrichedWord) => {
    // Find the lyric line that contains this word
    const lyricContext = findLyricLineWithWord(basic.word)

    setSelectedWord(enriched)
    setSelectedBasic(basic)
    setSelectedLyricLine(lyricContext?.lyricLine || null)
    setSelectedTranslation(lyricContext?.translation || null)
    setSelectedLineIndex(lyricContext?.lineIndex ?? null)
  }

  // Capitalize first letter of word
  const capitalizeWord = (word: string) => {
    return word.charAt(0).toUpperCase() + word.slice(1)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-white">
          Key Vocabulary
          {enrichedVocab.length > 0 && (
            <Globe className="w-4 h-4 text-white/60" />
          )}
        </h3>
        <p className="text-sm text-white/70">
          Important words to know before you start singing
        </p>
      </div>

      {/* Render each part of speech section */}
      {Object.entries(groupedVocab).map(([pos, items]) => {
        if (items.length === 0) return null

        return (
          <div key={pos} className="space-y-3">
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              {posLabels[pos]}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((item, index) => (
                <button
                  key={`${item.enriched.word}-${index}`}
                  onClick={() => handleWordClick(item.basic, item.enriched)}
                  className="border-0 hover:scale-[1.02] transition-all text-left group cursor-pointer"
                  style={{
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    paddingTop: '24px',
                    paddingBottom: '24px',
                    paddingLeft: '20px',
                    paddingRight: '20px'
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-medium text-base text-white group-hover:text-white/90 transition-colors">
                      {/* For verbs, show infinitive (root); otherwise show the word */}
                      {item.enriched.partOfSpeech.toLowerCase() === 'verb' && item.enriched.root
                        ? capitalizeWord(item.enriched.root)
                        : capitalizeWord(item.basic.word)
                      }
                    </span>
                    {item.basic.count > 1 && (
                      <span className="text-xs text-white/50">
                        ×{item.basic.count}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/70">
                    {item.enriched.translations[userLanguage]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* Vocab Detail Modal */}
      {selectedWord && selectedBasic && (
        <VocabDetailModal
          isOpen={!!selectedWord}
          onClose={() => {
            setSelectedWord(null)
            setSelectedBasic(null)
            setSelectedLyricLine(null)
            setSelectedTranslation(null)
            setSelectedLineIndex(null)
          }}
          word={selectedBasic.word}
          translation={selectedWord.translations[userLanguage]}
          partOfSpeech={selectedWord.partOfSpeech}
          count={selectedBasic.count}
          language={language}
          root={selectedWord.root}
          exampleSentence={selectedWord.exampleSentence}
          exampleTranslation={selectedWord.exampleTranslation}
          synonyms={selectedWord.synonyms}
          conjugations={selectedWord.conjugations}
          lyricLineInSong={selectedLyricLine || undefined}
          lyricLineTranslation={selectedTranslation || undefined}
          lyricLineIndex={selectedLineIndex ?? undefined}
          songId={songId}
        />
      )}

      {enrichedVocab.length > 0 && (
        <div className="text-xs text-white/50 text-center pt-2">
          Translations powered by AI • Showing {userLanguage.toUpperCase()} translations
        </div>
      )}
    </div>
  )
}
