'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'

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
        { key: 'er', label: '-ER Verbs', color: 'blue' },
        { key: 'ir', label: '-IR Verbs', color: 'green' },
        { key: 're', label: '-RE Verbs', color: 'purple' }
      ]
    : [
        { key: 'ar', label: '-AR Verbs', color: 'blue' },
        { key: 'er', label: '-ER Verbs', color: 'green' },
        { key: 'ir', label: '-IR Verbs', color: 'purple' }
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 pb-20 py-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  if (!tense) {
    return (
      <div className="container mx-auto px-4 pb-20 py-6">
        <p>Tense not found</p>
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
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-3xl font-bold">{tense.name}</h1>
            <span className="text-xl text-muted-foreground">{tense.nameSpanish || tense.nameFrench}</span>
          </div>
          <p className="text-muted-foreground">{tense.description}</p>
        </div>

        <div className="space-y-6">
          {/* When to Use */}
          <section>
            <h2 className="text-xl font-bold mb-3">When to Use</h2>
            <ul className="space-y-2 ml-4">
              {tense.whenToUse.map((usage, i) => (
                <li key={i} className="list-disc">{usage}</li>
              ))}
            </ul>
          </section>

          {/* Regular Patterns */}
          <section>
            <h2 className="text-xl font-bold mb-4">Regular Conjugation Patterns</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {verbPatterns.map((pattern, idx) => {
                const bgColor = pattern.color === 'blue' ? 'bg-blue-50 dark:bg-blue-950/20' :
                                pattern.color === 'green' ? 'bg-green-50 dark:bg-green-950/20' :
                                'bg-purple-50 dark:bg-purple-950/20'
                const textColor = pattern.color === 'blue' ? 'text-blue-900 dark:text-blue-100' :
                                  pattern.color === 'green' ? 'text-green-900 dark:text-green-100' :
                                  'text-purple-900 dark:text-purple-100'

                const conjugations = tense.regularPatterns[pattern.key]
                if (!conjugations) return null

                return (
                  <div key={pattern.key} className={`space-y-2 p-4 rounded-lg ${bgColor} border`}>
                    <h3 className={`font-semibold ${textColor}`}>{pattern.label}</h3>
                    <div className="space-y-1 text-sm">
                      {pronounKeys.map((key, i) => (
                        <div key={key} className="flex justify-between">
                          <span>{pronouns[i]}</span>
                          <span className="font-mono">{conjugations[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Examples with Tabs */}
          <section>
            <h2 className="text-xl font-bold mb-4">Examples</h2>
            <Tabs defaultValue="regular" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="regular">Regular Examples</TabsTrigger>
                <TabsTrigger value="irregular">Irregular Examples</TabsTrigger>
              </TabsList>

              <TabsContent value="regular" className="space-y-4 mt-4">
                {tense.regularExamples.map((example, i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">{example.infinitive}</h3>
                      <span className="text-sm text-muted-foreground">({example.english})</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {pronounKeys.map((key, idx) => (
                        <div key={key}>
                          <span className="text-muted-foreground">{pronouns[idx]}:</span>{' '}
                          <span className="font-medium">{example.conjugations[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="irregular" className="space-y-4 mt-4">
                {tense.irregularExamples.map((example, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-orange-50/50 dark:bg-orange-950/10">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-lg">{example.infinitive}</h3>
                      <span className="text-sm text-muted-foreground">({example.english})</span>
                      <Badge variant="outline" className="ml-auto">Irregular</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {pronounKeys.map((key, idx) => (
                        <div key={key}>
                          <span className="text-muted-foreground">{pronouns[idx]}:</span>{' '}
                          <span className="font-medium">{example.conjugations[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </section>

          {/* Example Sentences */}
          <section>
            <h2 className="text-xl font-bold mb-4">Example Sentences</h2>
            <div className="space-y-3">
              {tense.exampleSentences.map((sentence, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50 border">
                  <p className="font-medium mb-1">{sentence.spanish || sentence.french}</p>
                  <p className="text-sm text-muted-foreground italic">{sentence.english}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
