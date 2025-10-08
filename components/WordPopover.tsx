import React, { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { defineWord } from '@/lib/client'
import { Loader2, Book, MessageSquare } from 'lucide-react'

interface ConjugationTable {
  presente: { [key: string]: string }
  preterito: { [key: string]: string }
  imperfecto: { [key: string]: string }
  futuro: { [key: string]: string }
  condicional: { [key: string]: string }
  subjuntivo_presente: { [key: string]: string }
  subjuntivo_imperfecto?: { [key: string]: string }
  imperativo?: { [key: string]: string }
  gerundio?: string
  participio?: string
}

interface WordPopoverProps {
  children: React.ReactNode
  word: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function WordPopover({ children, word, isOpen, onOpenChange }: WordPopoverProps) {
  const [definition, setDefinition] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [clickCount, setClickCount] = useState<number>(0)

  useEffect(() => {
    if (isOpen && word) {
      const normalizedWord = word.toLowerCase().trim()

      // Track word click for analytics (always track, even on repeat clicks)
      fetch('/api/word-clicks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: normalizedWord }),
      }).catch((err) => {
        console.error('Failed to track word click:', err)
      })

      // Fetch click count
      fetch(`/api/word-clicks?word=${encodeURIComponent(normalizedWord)}`)
        .then(res => res.json())
        .then(data => {
          if (data.words && data.words.length > 0) {
            setClickCount(data.words[0].clickCount)
          }
        })
        .catch((err) => {
          console.error('Failed to fetch click count:', err)
        })

      // Only fetch definition if we don't have it yet
      if (!definition) {
        setIsLoading(true)
        setError('')

        defineWord(normalizedWord)
          .then((result) => {
            setDefinition(result)
          })
          .catch((err) => {
            setError('Failed to get definition')
            console.error('Definition error:', err)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    }
  }, [isOpen, word, definition])

  // Reset when word changes
  useEffect(() => {
    setDefinition(null)
    setError('')
  }, [word])

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      
      <PopoverContent className="w-96 max-h-[600px] overflow-y-auto text-white">
        <div className="space-y-3">
          {/* Word header */}
          <div className="border-b border-white/20 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white">{word}</h3>
              <div className="flex items-center gap-2">
                {clickCount > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-bold">
                    {clickCount}× clicked
                  </span>
                )}
                {definition && (
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                    {definition.pos}
                  </span>
                )}
              </div>
            </div>
            {definition && definition.lemma !== word && (
              <p className="text-sm text-white/70">
                Lemma: {definition.lemma}
              </p>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-4 text-white/70">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading definition...
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-red-400 text-sm">
              <p>{error}</p>
            </div>
          )}

          {/* Definition content */}
          {!isLoading && !error && definition && (
            <>
              {/* Definitions */}
              <div>
                <ul className="space-y-1">
                  {definition.definitions.map((def: string, index: number) => (
                    <li key={index} className="text-lg text-white">
                      • {def}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples */}
              {definition.examples && definition.examples.length > 0 && (
                <div>
                  <h4 className="flex items-center font-medium text-sm mb-2 text-white">
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Examples
                  </h4>
                  <ul className="space-y-1">
                    {definition.examples.slice(0, 2).map((example: string, index: number) => (
                      <li key={index} className="text-sm italic text-white/70">
                        "{example}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conjugations for verbs */}
              {definition.conjugations && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm mb-2 border-b border-white/20 pb-1 text-white">Full Conjugations</h4>

                  {/* Non-finite forms */}
                  {(definition.conjugations.gerundio || definition.conjugations.participio) && (
                    <div className="bg-white/10 rounded p-2">
                      <p className="font-medium text-xs mb-1 text-white">Non-finite forms:</p>
                      {definition.conjugations.gerundio && (
                        <p className="text-xs text-white">Gerund: <strong>{definition.conjugations.gerundio}</strong></p>
                      )}
                      {definition.conjugations.participio && (
                        <p className="text-xs text-white">Past Participle: <strong>{definition.conjugations.participio}</strong></p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 text-xs">
                    {/* Present tense */}
                    <details className="group" open>
                      <summary className="cursor-pointer font-medium text-white/70 hover:text-white">
                        Presente (Present)
                      </summary>
                      <div className="grid grid-cols-2 gap-1 ml-2 mt-1">
                        {Object.entries(definition.conjugations.presente).map(([person, form]) => (
                          <span key={person} className="text-xs text-white">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </details>

                    {/* Preterite */}
                    <details className="group" open>
                      <summary className="cursor-pointer font-medium text-white/70 hover:text-white">
                        Pretérito (Preterite)
                      </summary>
                      <div className="grid grid-cols-2 gap-1 ml-2 mt-1">
                        {Object.entries(definition.conjugations.preterito).map(([person, form]) => (
                          <span key={person} className="text-xs text-white">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </details>

                    {/* Imperfect */}
                    <details className="group" open>
                      <summary className="cursor-pointer font-medium text-white/70 hover:text-white">
                        Imperfecto (Imperfect)
                      </summary>
                      <div className="grid grid-cols-2 gap-1 ml-2 mt-1">
                        {Object.entries(definition.conjugations.imperfecto).map(([person, form]) => (
                          <span key={person} className="text-xs text-white">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </details>

                    {/* Future */}
                    <details className="group" open>
                      <summary className="cursor-pointer font-medium text-white/70 hover:text-white">
                        Futuro (Future)
                      </summary>
                      <div className="grid grid-cols-2 gap-1 ml-2 mt-1">
                        {Object.entries(definition.conjugations.futuro).map(([person, form]) => (
                          <span key={person} className="text-xs text-white">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </details>

                    {/* Conditional */}
                    <details className="group" open>
                      <summary className="cursor-pointer font-medium text-white/70 hover:text-white">
                        Condicional (Conditional)
                      </summary>
                      <div className="grid grid-cols-2 gap-1 ml-2 mt-1">
                        {Object.entries(definition.conjugations.condicional).map(([person, form]) => (
                          <span key={person} className="text-xs text-white">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </details>

                    {/* Subjunctive Present */}
                    <details className="group" open>
                      <summary className="cursor-pointer font-medium text-white/70 hover:text-white">
                        Subjuntivo Presente (Present Subjunctive)
                      </summary>
                      <div className="grid grid-cols-2 gap-1 ml-2 mt-1">
                        {Object.entries(definition.conjugations.subjuntivo_presente).map(([person, form]) => (
                          <span key={person} className="text-xs text-white">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </details>

                    {/* Subjunctive Imperfect */}
                    {definition.conjugations.subjuntivo_imperfecto && (
                      <details className="group" open>
                        <summary className="cursor-pointer font-medium text-white/70 hover:text-white">
                          Subjuntivo Imperfecto (Imperfect Subjunctive)
                        </summary>
                        <div className="grid grid-cols-2 gap-1 ml-2 mt-1">
                          {Object.entries(definition.conjugations.subjuntivo_imperfecto).map(([person, form]) => (
                            <span key={person} className="text-xs text-white">
                              {person}: <strong>{form}</strong>
                            </span>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Imperative */}
                    {definition.conjugations.imperativo && (
                      <details className="group" open>
                        <summary className="cursor-pointer font-medium text-white/70 hover:text-white">
                          Imperativo (Imperative)
                        </summary>
                        <div className="grid grid-cols-2 gap-1 ml-2 mt-1">
                          {Object.entries(definition.conjugations.imperativo).map(([person, form]) => (
                            <span key={person} className="text-xs text-white">
                              {person}: <strong>{form}</strong>
                            </span>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}