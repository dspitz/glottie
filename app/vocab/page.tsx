'use client'

import Link from 'next/link'
import { BookOpen, MessageCircle, Library } from 'lucide-react'
import { BasicsCard } from '@/components/basics/BasicsCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { tenses } from '@/data/tenses'
import { phraseCategories } from '@/data/phrases'
import { vocabLists } from '@/data/essentialVocab'

export default function BasicsPage() {
  return (
    <div className="container mx-auto px-6 pb-20">
      <div className="py-6">
        <h1 className="mb-6" style={{ fontSize: '44px', lineHeight: '52px', fontWeight: 500 }}>Basics</h1>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tenses.map((tense) => (
                <Link key={tense.id} href={`/vocab/tenses/${tense.id}`}>
                  <BasicsCard
                    icon="📝"
                    title={tense.name}
                    description={tense.briefUsage}
                    examplePhrase={tense.examplePhrase}
                    onClick={() => {}}
                  />
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="phrases" className="mt-6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {phraseCategories.map((category) => (
                <Link key={category.id} href={`/vocab/phrases/${category.id}`}>
                  <BasicsCard
                    icon={category.icon}
                    title={category.name}
                    description={category.description}
                    onClick={() => {}}
                  />
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vocab" className="mt-6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {vocabLists.map((list) => (
                <Link key={list.id} href={`/vocab/lists/${list.id}`}>
                  <BasicsCard
                    icon={list.icon}
                    title={list.name}
                    description={list.description}
                    onClick={() => {}}
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
