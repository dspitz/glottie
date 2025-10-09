'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Music, ExternalLink, BookOpen, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SongWithWord {
  id: string
  title: string
  artist: string
  albumArt: string | null
  level: number | null
  levelName: string | null
  occurrences: number
}

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
  const [songs, setSongs] = useState<SongWithWord[]>([])
  const [isLoadingSongs, setIsLoadingSongs] = useState(false)

  // Fetch songs when modal opens
  useEffect(() => {
    if (open && word) {
      setIsLoadingSongs(true)
      fetch(`/api/songs-with-word?word=${encodeURIComponent(word.word)}`)
        .then(res => res.json())
        .then(data => {
          setSongs(data.songs || [])
        })
        .catch(err => {
          console.error('Failed to fetch songs:', err)
        })
        .finally(() => {
          setIsLoadingSongs(false)
        })
    }
  }, [open, word])

  if (!word) return null

  const examples = word.examples ? JSON.parse(word.examples) : []

  // Extract part of speech from definition if not provided
  let partOfSpeech = word.partOfSpeech || 'other'
  if (word.definition && partOfSpeech === 'other') {
    try {
      const def = typeof word.definition === 'string' ? JSON.parse(word.definition) : word.definition
      if (def.pos) {
        const posLower = def.pos.toLowerCase()
        if (posLower.includes('noun')) partOfSpeech = 'noun'
        else if (posLower.includes('verb')) partOfSpeech = 'verb'
        else if (posLower.includes('adj')) partOfSpeech = 'adjective'
        else if (posLower.includes('adv')) partOfSpeech = 'adverb'
      }
    } catch {
      // Keep default
    }
  }

  const posColor = partOfSpeechColors[partOfSpeech as keyof typeof partOfSpeechColors] || partOfSpeechColors.other
  const posLabel = partOfSpeechLabels[partOfSpeech as keyof typeof partOfSpeechLabels] || partOfSpeech

  const handleSongClick = (songId: string) => {
    onOpenChange(false)
    router.push(`/song/${songId}`)
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
                  <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', borderRadius: '16px' }}>
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

          {/* Songs containing this word */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Music className="h-4 w-4" />
              Songs with "{word.word}"
            </h4>

            {isLoadingSongs ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : songs.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {songs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => handleSongClick(song.id)}
                    className="flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:scale-[1.01]"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', borderRadius: '16px' }}
                  >
                    {song.albumArt && (
                      <img
                        src={song.albumArt}
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                      {song.levelName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Level {song.level} • {song.occurrences}× in song
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No songs found with this word
              </p>
            )}
          </div>

          {/* Stats */}
          {word.usefulnessScore > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>Usefulness: {(word.usefulnessScore * 100).toFixed(0)}%</span>
              <span>Frequency: {word.frequency.toFixed(1)} Zipf</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}