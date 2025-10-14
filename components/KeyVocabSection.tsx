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

  // Only show vocabulary if we have enriched data
  // This prevents showing bad position-based translations
  if (enrichedVocab.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Key Vocabulary</h3>
          <p className="text-sm text-muted-foreground">
            Analyzing vocabulary and preparing translations...
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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

      return {
        basic,
        enriched,
      }
    })
    .filter(Boolean) // Remove null entries

  const handleWordClick = (basic: VocabWord, enriched: EnrichedWord) => {
    setSelectedWord(enriched)
    setSelectedBasic(basic)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
          Key Vocabulary
          {enrichedVocab.length > 0 && (
            <Globe className="w-4 h-4 text-muted-foreground" />
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          Important words to know before you start singing
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {displayVocab.map((item, index) => (
          <button
            key={`${item.enriched.word}-${index}`}
            onClick={() => handleWordClick(item.basic, item.enriched)}
            className="p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-all text-left group cursor-pointer"
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="font-medium text-base group-hover:text-primary transition-colors">
                {item.basic.word}
              </span>
              {item.basic.count > 1 && (
                <span className="text-xs text-muted-foreground">
                  ×{item.basic.count}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {item.enriched.translations[userLanguage]}
            </div>
          </button>
        ))}
      </div>

      {/* Vocab Detail Modal */}
      {selectedWord && selectedBasic && (
        <VocabDetailModal
          isOpen={!!selectedWord}
          onClose={() => {
            setSelectedWord(null)
            setSelectedBasic(null)
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
        />
      )}

      {enrichedVocab.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pt-2">
          Translations powered by AI • Showing {userLanguage.toUpperCase()} translations
        </div>
      )}
    </div>
  )
}
