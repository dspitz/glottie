'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { vocabLists } from '@/data/essentialVocab'

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

export default function VocabListPage() {
  const params = useParams()
  const router = useRouter()
  const list = vocabLists.find(l => l.id === params.id)

  if (!list) {
    return (
      <div className="container mx-auto px-4 pb-20 py-6">
        <p>List not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => router.push('/vocab')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Basics
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{list.icon}</span>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-bold">{list.name}</h1>
                <span className="text-xl text-muted-foreground">{list.nameSpanish}</span>
              </div>
              <p className="text-muted-foreground mt-1">{list.description}</p>
            </div>
          </div>
        </div>

        {/* Words Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.words.map((word, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border hover:shadow-md transition-all"
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
      </div>
    </div>
  )
}
