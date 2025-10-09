'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFloodColor, getSecondaryColor } from '@/lib/languageUtils'

const partOfSpeechColors: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-800',
  verb: 'bg-green-100 text-green-800',
  adjective: 'bg-purple-100 text-purple-800',
  adverb: 'bg-orange-100 text-orange-800',
  pronoun: 'bg-pink-100 text-pink-800',
  preposition: 'bg-yellow-100 text-yellow-800',
  conjunction: 'bg-cyan-100 text-cyan-800',
  article: 'bg-indigo-100 text-indigo-800',
  determiner: 'bg-teal-100 text-teal-800',
  number: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
}

export default function VocabListPage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useLanguage()
  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadList = async () => {
      setLoading(true)
      try {
        const vocabModule = await import(`@/data/${language}/essentialVocab`)
        const foundList = vocabModule.vocabLists.find((l: any) => l.id === params.id)
        setList(foundList)
      } catch (error) {
        console.error('Error loading vocab list:', error)
      } finally {
        setLoading(false)
      }
    }

    loadList()
  }, [language, params.id])

  // Set background color
  useEffect(() => {
    document.body.style.backgroundColor = getSecondaryColor(language)
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [language])

  if (loading) {
    return (
      <div className="container mx-auto px-8 pb-20">
        <div className="py-8">
          <div className="text-white text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="container mx-auto px-8 pb-20">
        <div className="py-8">
          <div className="text-white text-center">List not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-8 pb-20">
      <div className="py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => router.push('/vocab')}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Basics</span>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[16px] leading-[22px] mb-2" style={{ color: getFloodColor(language) }}>
            {list.nameSpanish || list.nameFrench}
          </p>
          <p className="text-[40px] leading-[44px] font-light mb-8 text-white">{list.name}</p>
        </div>

        {/* Words Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.words.map((word: any, i: number) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-white/[0.12] border border-white/20"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg truncate text-white">{word.english}</h3>
                  <p className="text-sm text-white/60 truncate italic">{word.spanish || word.french}</p>
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
                <p className="text-xs text-white/60 font-mono mt-1">
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
