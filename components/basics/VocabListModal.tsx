'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { VocabList } from '@/data/es/essentialVocab'

interface VocabListModalProps {
  list: VocabList | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const partOfSpeechColors: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  verb: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  adjective: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  adverb: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  pronoun: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  preposition: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  conjunction: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  article: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  determiner: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  number: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

export function VocabListModal({ list, open, onOpenChange }: VocabListModalProps) {
  if (!list) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <span className="text-3xl">{list.icon}</span>
            <div>
              <div className="flex items-baseline gap-3">
                <span>{list.name}</span>
                <span className="text-lg text-muted-foreground font-normal">
                  {list.nameSpanish}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {list.description}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.words.map((word, i) => (
            <div
              key={i}
              className="p-3 rounded-lg hover:shadow-md transition-all"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', borderRadius: '16px' }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{word.spanish}</h3>
                  <p className="text-sm text-muted-foreground truncate">{word.english}</p>
                </div>
                {word.partOfSpeech && (
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${
                      partOfSpeechColors[word.partOfSpeech] || partOfSpeechColors.other
                    }`}
                  >
                    {word.partOfSpeech}
                  </Badge>
                )}
              </div>
              {word.pronunciation && (
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {word.pronunciation}
                </p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
