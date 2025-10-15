'use client'

import { useQuery } from '@tanstack/react-query'
import { Sparkles, BookOpen, Globe } from 'lucide-react'

interface Idiom {
  phrase: string
  language: string
  translations: Record<string, string>
  literalTranslation?: string
  meaning: string
  examples?: string[]
  culturalContext?: string
}

interface IdiomsSectionProps {
  songId: string
  language: string
  userLanguage?: string // User's native language for translation display
}

export function IdiomsSection({
  songId,
  language,
  userLanguage = 'en'
}: IdiomsSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vocab', songId],
    queryFn: async () => {
      const response = await fetch(`/api/songs/${songId}/vocab`)
      if (!response.ok) throw new Error('Failed to fetch vocabulary')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Idioms & Expressions</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-24 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
          <div className="h-24 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Idioms & Expressions</h3>
        </div>
        <p className="text-sm text-white/70">
          Unable to load idioms at this time.
        </p>
      </div>
    )
  }

  const idioms: Idiom[] = data?.idioms || []

  if (idioms.length === 0) {
    return null // Don't show section if no idioms found
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-white" />
        <h3 className="text-lg font-semibold text-white">Idioms & Expressions</h3>
      </div>
      <p className="text-sm text-white/70 -mt-2">
        Cultural expressions and phrases that don't translate literally
      </p>

      <div className="space-y-4">
        {idioms.map((idiom, index) => (
          <div
            key={`${idiom.phrase}-${index}`}
            className="p-4 border-0 space-y-3"
            style={{
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Phrase */}
            <div className="space-y-1">
              <div className="font-semibold text-lg text-white">
                "{idiom.phrase}"
              </div>
              {idiom.literalTranslation && (
                <div className="text-sm text-white/60 italic">
                  Literally: "{idiom.literalTranslation}"
                </div>
              )}
            </div>

            {/* Meaning */}
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 mt-0.5 text-white/60 flex-shrink-0" />
              <div className="text-sm text-white/90">
                <span className="font-medium text-white">Meaning: </span>
                {idiom.meaning}
              </div>
            </div>

            {/* Translation to user's language */}
            {idiom.translations && idiom.translations[userLanguage] && (
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 mt-0.5 text-white/60 flex-shrink-0" />
                <div className="text-sm text-white/90">
                  <span className="font-medium text-white">In {userLanguage.toUpperCase()}: </span>
                  {idiom.translations[userLanguage]}
                </div>
              </div>
            )}

            {/* Examples */}
            {idiom.examples && idiom.examples.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Examples
                </div>
                <ul className="space-y-1">
                  {idiom.examples.map((example, i) => (
                    <li key={i} className="text-sm text-white/70">
                      • {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cultural context */}
            {idiom.culturalContext && (
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1.5">
                  Cultural Note
                </div>
                <p className="text-sm text-white/70">
                  {idiom.culturalContext}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
