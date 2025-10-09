'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Volume2 } from 'lucide-react'
import type { PhraseCategory } from '@/data/es/phrases'

interface PhraseModalProps {
  category: PhraseCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhraseModal({ category, open, onOpenChange }: PhraseModalProps) {
  if (!category) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <div className="flex items-baseline gap-3">
                <span>{category.name}</span>
                <span className="text-lg text-muted-foreground font-normal">
                  {category.nameSpanish}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {category.description}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {category.phrases.map((phrase, i) => (
            <div
              key={i}
              className="p-4 rounded-lg hover:shadow-md transition-all"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', borderRadius: '16px' }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold mb-1">{phrase.spanish}</h3>
                  <p className="text-muted-foreground">{phrase.english}</p>
                </div>
                {phrase.pronunciation && (
                  <button
                    className="shrink-0 p-2 rounded-full hover:bg-muted transition-colors"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(phrase.spanish)
                        utterance.lang = 'es-ES'
                        speechSynthesis.speak(utterance)
                      }
                    }}
                    aria-label="Pronounce phrase"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {phrase.pronunciation && (
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground">Pronunciation: </span>
                  <span className="text-sm font-mono text-muted-foreground">
                    {phrase.pronunciation}
                  </span>
                </div>
              )}

              {phrase.usage && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-sm text-muted-foreground italic">{phrase.usage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
