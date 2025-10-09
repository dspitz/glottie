'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFloodColor, getSecondaryColor } from '@/lib/languageUtils'

export default function TensePage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useLanguage()
  const [tense, setTense] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Language-specific conjugation labels
  const pronouns = language === 'fr'
    ? ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles']
    : ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos/ellas']

  const pronounKeys = language === 'fr'
    ? ['je', 'tu', 'il', 'nous', 'vous', 'ils']
    : ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']

  // Verb ending patterns
  const verbPatterns = language === 'fr'
    ? [
        { key: 'er', label: 'ER Verbs', color: 'blue' },
        { key: 'ir', label: 'IR Verbs', color: 'green' },
        { key: 're', label: 'RE Verbs', color: 'purple' }
      ]
    : [
        { key: 'ar', label: 'AR Verbs', color: 'blue' },
        { key: 'er', label: 'ER Verbs', color: 'green' },
        { key: 'ir', label: 'IR Verbs', color: 'purple' }
      ]

  useEffect(() => {
    const loadTense = async () => {
      setLoading(true)
      try {
        const tensesModule = await import(`@/data/${language}/tenses`)
        const foundTense = tensesModule.tenses.find((t: any) => t.id === params.id)
        setTense(foundTense)
      } catch (error) {
        console.error('Error loading tense:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTense()
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

  if (!tense) {
    return (
      <div className="container mx-auto px-8 pb-20">
        <div className="py-8">
          <div className="text-white text-center">Tense not found</div>
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
            {tense.nameSpanish || tense.nameFrench}
          </p>
          <p className="text-[40px] leading-[44px] font-light mb-8 text-white">{tense.description}</p>
        </div>

        <div className="space-y-6">
          {/* Example Sentences */}
          <section>
            <div className="space-y-3">
              {tense.exampleSentences.map((sentence: any, i: number) => {
                const highlightVerb = (text: string) => {
                  // List of common conjugated verbs to highlight
                  const verbs = ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan',
                                 'como', 'comes', 'come', 'comemos', 'coméis', 'comen',
                                 'vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven',
                                 'parle', 'parles', 'parlons', 'parlez', 'parlent',
                                 'mange', 'manges', 'mangeons', 'mangez', 'mangent',
                                 'vis', 'vit', 'vivons', 'vivez', 'vivent']

                  // Pronouns that can precede verbs
                  const pronouns = ['yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'nosotras',
                                    'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes',
                                    'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles']

                  const words = text.split(' ')
                  let skipNext = false

                  return words.map((word, idx) => {
                    if (skipNext) {
                      skipNext = false
                      return null
                    }

                    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
                    const nextWord = idx < words.length - 1 ? words[idx + 1].toLowerCase().replace(/[^\w]/g, '') : ''

                    // Check if pronoun + verb combination
                    if (pronouns.includes(cleanWord) && verbs.includes(nextWord)) {
                      skipNext = true
                      const combinedText = word + ' ' + words[idx + 1]
                      return (
                        <span key={idx}>
                          <span
                            className="inline-block"
                            style={{
                              backgroundColor: 'rgb(255, 235, 59)',
                              transform: 'skewX(-8deg)',
                              borderRadius: '3px',
                              paddingLeft: '2px',
                              paddingRight: '3px',
                              paddingTop: '1px',
                              paddingBottom: '1px',
                              marginLeft: '2px',
                              marginRight: '2px'
                            }}
                          >
                            <span style={{ display: 'inline-block', transform: 'skewX(8deg)', color: 'black' }}>
                              {combinedText}
                            </span>
                          </span>
                          {idx < words.length - 2 ? ' ' : ''}
                        </span>
                      )
                    }

                    // Just verb alone
                    if (verbs.includes(cleanWord)) {
                      return (
                        <span key={idx}>
                          <span
                            className="inline-block"
                            style={{
                              backgroundColor: 'rgb(255, 235, 59)',
                              transform: 'skewX(-8deg)',
                              borderRadius: '3px',
                              paddingLeft: '2px',
                              paddingRight: '3px',
                              paddingTop: '1px',
                              paddingBottom: '1px',
                              marginLeft: '2px',
                              marginRight: '2px'
                            }}
                          >
                            <span style={{ display: 'inline-block', transform: 'skewX(8deg)', color: 'black' }}>
                              {word}
                            </span>
                          </span>
                          {idx < words.length - 1 ? ' ' : ''}
                        </span>
                      )
                    }

                    return <span key={idx}>{word}{idx < words.length - 1 ? ' ' : ''}</span>
                  }).filter(Boolean)
                }

                return (
                  <div key={i} className="p-4 rounded-lg bg-white/[0.12] border border-white/20">
                    <p className="font-medium mb-1 text-white">{sentence.english}</p>
                    <p className="text-sm text-white/60 italic">
                      {highlightVerb(sentence.spanish || sentence.french)}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Regular Patterns */}
          <section>
            <div className="overflow-x-auto mt-8">
              <div className="p-6 rounded-lg bg-white/[0.12] border border-white/20">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-2 font-light text-white/60"></th>
                      {verbPatterns.map((pattern) => (
                        <th key={pattern.key} className="text-center py-3 px-4 font-light text-white/60">
                          {pattern.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pronounKeys.map((key, i) => (
                      <tr key={key} className="border-b border-white/10 last:border-0">
                        <td className="py-3 px-2 text-white/60 font-light">{pronouns[i]}</td>
                        {verbPatterns.map((pattern) => {
                          const conjugations = tense.regularPatterns[pattern.key]
                          return (
                            <td key={pattern.key} className="text-center py-3 px-4 font-normal text-white text-[18px]">
                              {conjugations?.[key] || ''}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Examples with Tabs */}
          <section className="mt-8">
            <div className="rounded-lg bg-white/[0.12] border border-white/20 p-6">
              <Tabs defaultValue="regular" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-0">
                  <TabsTrigger value="regular" className="data-[state=inactive]:text-white">Regular Examples</TabsTrigger>
                  <TabsTrigger value="irregular" className="data-[state=inactive]:text-white">Irregular Examples</TabsTrigger>
                </TabsList>

                <TabsContent value="regular" className="m-0">
                  <div>
                    {tense.regularExamples.map((example: any, i: number) => (
                      <div key={i}>
                        <div className="py-6">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-semibold text-lg text-white">{example.infinitive}</h3>
                            <span className="text-sm text-white/60">({example.english})</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {pronounKeys.map((key, idx) => (
                              <div key={key}>
                                <span className="text-white/60">{pronouns[idx]}:</span>{' '}
                                <span className="font-medium text-white">{example.conjugations[key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {i < tense.regularExamples.length - 1 && (
                          <div className="border-t border-white/20"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="irregular" className="m-0">
                  <div>
                    {tense.irregularExamples.map((example: any, i: number) => (
                      <div key={i}>
                        <div className="py-6">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-semibold text-lg text-white">{example.infinitive}</h3>
                            <span className="text-sm text-white/60">({example.english})</span>
                            <Badge variant="outline" className="ml-auto border-white/20 text-white">Irregular</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {pronounKeys.map((key, idx) => (
                              <div key={key}>
                                <span className="text-white/60">{pronouns[idx]}:</span>{' '}
                                <span className="font-medium text-white">{example.conjugations[key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {i < tense.irregularExamples.length - 1 && (
                          <div className="border-t border-white/20"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </section>

          {/* Recap */}
          <section className="mt-8">
            <h2 className="text-xl font-light mb-4 text-white text-center">Summary of the {tense.nameSpanish || tense.nameFrench}</h2>
            <div className="rounded-lg bg-white/[0.12] border border-white/20">
              {tense.whenToUse.map((usage: any, i: number) => {
                const rule = typeof usage === 'string' ? usage : usage.rule
                const example = typeof usage === 'string' ? null : usage.example

                return (
                  <div key={i} className={`flex items-start gap-3 px-6 py-4 ${i < tense.whenToUse.length - 1 ? 'border-b border-white/20' : ''}`}>
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-light">{rule}</div>
                      {example && (
                        <div className="text-white/60 text-sm mt-1 italic">{example}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
