'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { tenses } from '@/data/tenses'

export default function TensePage() {
  const params = useParams()
  const router = useRouter()
  const tense = tenses.find(t => t.id === params.id)

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
            <span className="text-xl text-muted-foreground">{tense.nameSpanish}</span>
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
              <div className="space-y-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">-AR Verbs</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>yo</span><span className="font-mono">{tense.regularPatterns.ar.yo}</span></div>
                  <div className="flex justify-between"><span>tú</span><span className="font-mono">{tense.regularPatterns.ar.tú}</span></div>
                  <div className="flex justify-between"><span>él/ella</span><span className="font-mono">{tense.regularPatterns.ar.él}</span></div>
                  <div className="flex justify-between"><span>nosotros</span><span className="font-mono">{tense.regularPatterns.ar.nosotros}</span></div>
                  <div className="flex justify-between"><span>vosotros</span><span className="font-mono">{tense.regularPatterns.ar.vosotros}</span></div>
                  <div className="flex justify-between"><span>ellos/ellas</span><span className="font-mono">{tense.regularPatterns.ar.ellos}</span></div>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border">
                <h3 className="font-semibold text-green-900 dark:text-green-100">-ER Verbs</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>yo</span><span className="font-mono">{tense.regularPatterns.er.yo}</span></div>
                  <div className="flex justify-between"><span>tú</span><span className="font-mono">{tense.regularPatterns.er.tú}</span></div>
                  <div className="flex justify-between"><span>él/ella</span><span className="font-mono">{tense.regularPatterns.er.él}</span></div>
                  <div className="flex justify-between"><span>nosotros</span><span className="font-mono">{tense.regularPatterns.er.nosotros}</span></div>
                  <div className="flex justify-between"><span>vosotros</span><span className="font-mono">{tense.regularPatterns.er.vosotros}</span></div>
                  <div className="flex justify-between"><span>ellos/ellas</span><span className="font-mono">{tense.regularPatterns.er.ellos}</span></div>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">-IR Verbs</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>yo</span><span className="font-mono">{tense.regularPatterns.ir.yo}</span></div>
                  <div className="flex justify-between"><span>tú</span><span className="font-mono">{tense.regularPatterns.ir.tú}</span></div>
                  <div className="flex justify-between"><span>él/ella</span><span className="font-mono">{tense.regularPatterns.ir.él}</span></div>
                  <div className="flex justify-between"><span>nosotros</span><span className="font-mono">{tense.regularPatterns.ir.nosotros}</span></div>
                  <div className="flex justify-between"><span>vosotros</span><span className="font-mono">{tense.regularPatterns.ir.vosotros}</span></div>
                  <div className="flex justify-between"><span>ellos/ellas</span><span className="font-mono">{tense.regularPatterns.ir.ellos}</span></div>
                </div>
              </div>
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
                      <div><span className="text-muted-foreground">yo:</span> <span className="font-medium">{example.conjugations.yo}</span></div>
                      <div><span className="text-muted-foreground">tú:</span> <span className="font-medium">{example.conjugations.tú}</span></div>
                      <div><span className="text-muted-foreground">él/ella:</span> <span className="font-medium">{example.conjugations.él}</span></div>
                      <div><span className="text-muted-foreground">nosotros:</span> <span className="font-medium">{example.conjugations.nosotros}</span></div>
                      <div><span className="text-muted-foreground">vosotros:</span> <span className="font-medium">{example.conjugations.vosotros}</span></div>
                      <div><span className="text-muted-foreground">ellos/ellas:</span> <span className="font-medium">{example.conjugations.ellos}</span></div>
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
                      <div><span className="text-muted-foreground">yo:</span> <span className="font-medium">{example.conjugations.yo}</span></div>
                      <div><span className="text-muted-foreground">tú:</span> <span className="font-medium">{example.conjugations.tú}</span></div>
                      <div><span className="text-muted-foreground">él/ella:</span> <span className="font-medium">{example.conjugations.él}</span></div>
                      <div><span className="text-muted-foreground">nosotros:</span> <span className="font-medium">{example.conjugations.nosotros}</span></div>
                      <div><span className="text-muted-foreground">vosotros:</span> <span className="font-medium">{example.conjugations.vosotros}</span></div>
                      <div><span className="text-muted-foreground">ellos/ellas:</span> <span className="font-medium">{example.conjugations.ellos}</span></div>
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
                  <p className="font-medium mb-1">{sentence.spanish}</p>
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
