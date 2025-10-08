'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

export default function PhraseCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useLanguage()
  const [category, setCategory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategory = async () => {
      setLoading(true)
      try {
        const phrasesModule = await import(`@/data/${language}/phrases`)
        const foundCategory = phrasesModule.phraseCategories.find((c: any) => c.id === params.id)
        setCategory(foundCategory)
      } catch (error) {
        console.error('Error loading phrase category:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategory()
  }, [language, params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 pb-20 py-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 pb-20 py-6">
        <p>Category not found</p>
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
            <span className="text-4xl">{category.icon}</span>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-bold">{category.name}</h1>
                <span className="text-xl text-muted-foreground">{category.nameSpanish}</span>
              </div>
              <p className="text-muted-foreground mt-1">{category.description}</p>
            </div>
          </div>
        </div>

        {/* Phrases List */}
        <div className="space-y-3">
          {category.phrases.map((phrase, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border hover:shadow-md transition-all"
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
      </div>
    </div>
  )
}
