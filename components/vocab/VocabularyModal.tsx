'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Music, ExternalLink, BookOpen } from 'lucide-react'
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

interface VocabularyModalProps {
  word: VocabularyWord | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function VocabularyModal({ word, open, onOpenChange }: VocabularyModalProps) {
  const router = useRouter()

  if (!word) return null

  const examples = word.examples ? JSON.parse(word.examples) : []
  const posColor = partOfSpeechColors[word.partOfSpeech as keyof typeof partOfSpeechColors] || partOfSpeechColors.other
  const posLabel = partOfSpeechLabels[word.partOfSpeech as keyof typeof partOfSpeechLabels] || word.partOfSpeech

  const handleExploreInContext = () => {
    // Navigate to the vocab page with this word selected/highlighted
    // For now, just close the modal
    onOpenChange(false)
    // Could implement: router.push(`/vocab?word=${word.word}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {word.word}
          </DialogTitle>
          <p className="text-lg text-muted-foreground mt-1">
            {word.translation}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Part of Speech */}
          <div>
            <Badge className={cn("px-2 py-0.5", posColor)} variant="secondary">
              {posLabel}
            </Badge>
          </div>

          {/* Definition */}
          {word.definition && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Definition</h4>
              <p className="text-sm text-muted-foreground">{word.definition}</p>
            </div>
          )}

          {/* Examples from Songs */}
          {examples.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Music className="h-4 w-4" />
                Examples from Songs
              </h4>
              <div className="space-y-2">
                {examples.map((example: string, i: number) => (
                  <div key={i} className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-sm italic">"{example}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conjugations */}
          {word.conjugations && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Conjugations</h4>
              <p className="text-sm text-muted-foreground">{word.conjugations}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Usefulness: {(word.usefulnessScore * 100).toFixed(0)}%</span>
            <span>Frequency: {word.frequency.toFixed(1)} Zipf</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              className="flex-1"
              onClick={handleExploreInContext}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Find in Songs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}