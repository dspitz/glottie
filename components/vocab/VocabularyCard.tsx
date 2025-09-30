'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface VocabularyWord {
  id: string
  word: string
  translation: string
  partOfSpeech: string
  frequency: number
  usefulnessScore: number
  definition?: string | null
  examples?: string | null
  conjugations?: string | null
  synonyms?: string | null
}

interface VocabularyCardProps {
  word: VocabularyWord
  onClick: () => void
}

const partOfSpeechColors = {
  noun: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  verb: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  adjective: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  adverb: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
}

const partOfSpeechLabels = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adj',
  adverb: 'Adv',
  other: 'Other'
}

export function VocabularyCard({ word, onClick }: VocabularyCardProps) {
  const posColor = partOfSpeechColors[word.partOfSpeech as keyof typeof partOfSpeechColors] || partOfSpeechColors.other
  const posLabel = partOfSpeechLabels[word.partOfSpeech as keyof typeof partOfSpeechLabels] || word.partOfSpeech

  // Determine frequency level
  const getFrequencyLabel = (freq: number) => {
    if (freq >= 5) return 'Very Common'
    if (freq >= 4) return 'Common'
    return ''  // Return empty string for all other cases
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-3">
          {/* Spanish Word (Large) */}
          <h3 className="text-xl font-bold text-foreground mb-1">
            {word.word}
          </h3>

          {/* English Translation */}
          <p className="text-base text-muted-foreground">
            {word.translation}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs">
          {/* Part of Speech */}
          <Badge className={cn("px-2 py-0.5", posColor)} variant="secondary">
            {posLabel}
          </Badge>

          {/* Frequency - only show if not empty */}
          {getFrequencyLabel(word.frequency) && (
            <span className="text-muted-foreground">
              {getFrequencyLabel(word.frequency)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}