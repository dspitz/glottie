'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { BookOpen, MessageCircle, Library } from 'lucide-react'
import { BasicsCard } from '@/components/basics/BasicsCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFloodColor, getSecondaryColor } from '@/lib/languageUtils'

export default function BasicsPage() {
  const { language } = useLanguage()
  const [tenses, setTenses] = useState<any[]>([])
  const [phraseCategories, setPhraseCategories] = useState<any[]>([])
  const [vocabLists, setVocabLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.style.backgroundColor = getFloodColor(language)
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [language])

  useEffect(() => {
    // Dynamically import data based on language
    const loadData = async () => {
      setLoading(true)
      try {
        const tensesModule = await import(`@/data/${language}/tenses`)
        const phrasesModule = await import(`@/data/${language}/phrases`)
        const vocabModule = await import(`@/data/${language}/essentialVocab`)

        setTenses(tensesModule.tenses)
        setPhraseCategories(phrasesModule.phraseCategories)
        setVocabLists(vocabModule.vocabLists)
      } catch (error) {
        console.error('Error loading language data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [language])

  if (loading) {
    return (
      <div className="container mx-auto px-6 pb-20">
        <div className="py-6">
          <h1 className="mb-6" style={{ fontSize: '44px', lineHeight: '52px', fontWeight: 500 }}>Basics</h1>
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 pb-20">
      <div className="pt-8 pb-6">
        <h1 className="text-center" style={{ fontSize: '44px', lineHeight: '52px', fontWeight: 500, color: getSecondaryColor(language), marginTop: '32px', marginBottom: '32px' }}>Basics</h1>
        <Tabs defaultValue="tenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tenses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Tenses
            </TabsTrigger>
            <TabsTrigger value="phrases" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Phrases
            </TabsTrigger>
            <TabsTrigger value="vocab" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Vocab
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenses" className="mt-6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tenses.map((tense) => (
                <Link key={tense.id} href={`/vocab/tenses/${tense.id}`}>
                  <BasicsCard
                    icon="📝"
                    title={tense.name}
                    description={tense.briefUsage}
                    examplePhrase={tense.examplePhrase}
                    onClick={() => {}}
                    language={language}
                  />
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="phrases" className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              {phraseCategories.map((category) => (
                <Link key={category.id} href={`/vocab/phrases/${category.id}`}>
                  <BasicsCard
                    icon={category.icon}
                    title={category.name}
                    description={category.description}
                    onClick={() => {}}
                    variant="grid"
                  />
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vocab" className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              {vocabLists.map((list) => (
                <Link key={list.id} href={`/vocab/lists/${list.id}`}>
                  <BasicsCard
                    icon={list.icon}
                    title={list.name}
                    description={list.description}
                    onClick={() => {}}
                    variant="grid"
                  />
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
