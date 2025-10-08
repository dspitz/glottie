'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { Tense } from '@/data/tenses'

interface TenseModalProps {
  tense: Tense | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TenseModal({ tense, open, onOpenChange }: TenseModalProps) {
  if (!tense) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-baseline gap-3">
            <span>{tense.name}</span>
            <span className="text-lg text-muted-foreground font-normal">
              {tense.nameSpanish}
            </span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{tense.description}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* When to Use */}
          <div>
            <h3 className="font-semibold mb-2">When to Use</h3>
            <ul className="space-y-1 ml-4">
              {tense.whenToUse.map((usage, i) => (
                <li key={i} className="text-sm list-disc">{usage}</li>
              ))}
            </ul>
          </div>

          {/* Regular Patterns */}
          <div>
            <h3 className="font-semibold mb-3">Regular Conjugation Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">-AR Verbs</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>yo</span><span className="font-mono">{tense.regularPatterns.ar.yo}</span></div>
                  <div className="flex justify-between"><span>tú</span><span className="font-mono">{tense.regularPatterns.ar.tú}</span></div>
                  <div className="flex justify-between"><span>él/ella</span><span className="font-mono">{tense.regularPatterns.ar.él}</span></div>
                  <div className="flex justify-between"><span>nosotros</span><span className="font-mono">{tense.regularPatterns.ar.nosotros}</span></div>
                  <div className="flex justify-between"><span>vosotros</span><span className="font-mono">{tense.regularPatterns.ar.vosotros}</span></div>
                  <div className="flex justify-between"><span>ellos/ellas</span><span className="font-mono">{tense.regularPatterns.ar.ellos}</span></div>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <h4 className="font-medium text-green-900 dark:text-green-100">-ER Verbs</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>yo</span><span className="font-mono">{tense.regularPatterns.er.yo}</span></div>
                  <div className="flex justify-between"><span>tú</span><span className="font-mono">{tense.regularPatterns.er.tú}</span></div>
                  <div className="flex justify-between"><span>él/ella</span><span className="font-mono">{tense.regularPatterns.er.él}</span></div>
                  <div className="flex justify-between"><span>nosotros</span><span className="font-mono">{tense.regularPatterns.er.nosotros}</span></div>
                  <div className="flex justify-between"><span>vosotros</span><span className="font-mono">{tense.regularPatterns.er.vosotros}</span></div>
                  <div className="flex justify-between"><span>ellos/ellas</span><span className="font-mono">{tense.regularPatterns.er.ellos}</span></div>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <h4 className="font-medium text-purple-900 dark:text-purple-100">-IR Verbs</h4>
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
          </div>

          {/* Examples with Tabs */}
          <Tabs defaultValue="regular" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="regular">Regular Examples</TabsTrigger>
              <TabsTrigger value="irregular">Irregular Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="regular" className="space-y-4 mt-4">
              {tense.regularExamples.map((example, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-lg">{example.infinitive}</h4>
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
                    <h4 className="font-semibold text-lg">{example.infinitive}</h4>
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

          {/* Example Sentences */}
          <div>
            <h3 className="font-semibold mb-3">Example Sentences</h3>
            <div className="space-y-2">
              {tense.exampleSentences.map((sentence, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">{sentence.spanish}</p>
                  <p className="text-sm text-muted-foreground italic">{sentence.english}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
