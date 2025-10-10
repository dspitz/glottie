'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFloodColor, getSecondaryColor } from '@/lib/languageUtils'

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

  // Set background color
  useEffect(() => {
    document.body.style.backgroundColor = getSecondaryColor(language)
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [language])

  if (loading) {
    return (
      <div className="container px-6 py-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-white text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="container px-6 py-8 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-white text-center">Category not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-6 py-8 pb-20">
      {/* Back Button */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full fixed top-6 left-6 z-50"
        onClick={() => router.push('/vocab')}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Back to Basics</span>
      </Button>

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center mt-16">
          <p className="text-[16px] leading-[22px] mb-2" style={{ color: getFloodColor(language) }}>
            {category.nameSpanish || category.nameFrench}
          </p>
          <p className="text-[40px] leading-[44px] font-light mb-8 text-white">{category.name}</p>
        </div>

        {/* Phrases List */}
        <div className="space-y-3">
          {category.phrases.map((phrase: any, i: number) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-white/[0.12] border border-white/20"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium mb-1 text-white">{phrase.english}</h3>
                  <p className="text-sm text-white/60 italic">{phrase.spanish || phrase.french}</p>
                </div>
                {phrase.pronunciation && (
                  <button
                    className="shrink-0 p-2 rounded-full hover:bg-white/10 transition-colors"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(phrase.spanish || phrase.french)
                        utterance.lang = language === 'fr' ? 'fr-FR' : 'es-ES'
                        speechSynthesis.speak(utterance)
                      }
                    }}
                    aria-label="Pronounce phrase"
                  >
                    <Volume2 className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>

              {phrase.pronunciation && (
                <div className="mb-2">
                  <span className="text-xs text-white/60">Pronunciation: </span>
                  <span className="text-sm font-mono text-white/60">
                    {phrase.pronunciation}
                  </span>
                </div>
              )}

              {phrase.usage && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <p className="text-sm text-white/60 italic">{phrase.usage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
