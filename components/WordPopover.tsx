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

  useEffect(() => {
    if (isOpen && word && !definition) {
      setIsLoading(true)
      setError('')
      
      defineWord(word.toLowerCase().trim())
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
      
      <PopoverContent className="w-80 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {/* Word header */}
          <div className="border-b pb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{word}</h3>
              {definition && (
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {definition.pos}
                </span>
              )}
            </div>
            {definition && definition.lemma !== word && (
              <p className="text-sm text-muted-foreground">
                Lemma: {definition.lemma}
              </p>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading definition...
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-destructive text-sm">
              <p>{error}</p>
            </div>
          )}

          {/* Definition content */}
          {!isLoading && !error && definition && (
            <>
              {/* Definitions */}
              <div>
                <h4 className="flex items-center font-medium text-sm mb-2">
                  <Book className="mr-1 h-4 w-4" />
                  Definitions
                </h4>
                <ul className="space-y-1">
                  {definition.definitions.map((def: string, index: number) => (
                    <li key={index} className="text-sm">
                      • {def}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples */}
              {definition.examples && definition.examples.length > 0 && (
                <div>
                  <h4 className="flex items-center font-medium text-sm mb-2">
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Examples
                  </h4>
                  <ul className="space-y-1">
                    {definition.examples.slice(0, 2).map((example: string, index: number) => (
                      <li key={index} className="text-sm italic text-muted-foreground">
                        "{example}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conjugations for verbs */}
              {definition.conjugations && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Conjugations</h4>
                  <div className="space-y-2 text-xs">
                    {/* Present tense */}
                    <div>
                      <p className="font-medium text-muted-foreground">Presente:</p>
                      <div className="grid grid-cols-2 gap-1 ml-2">
                        {Object.entries(definition.conjugations.presente).map(([person, form]) => (
                          <span key={person} className="text-xs">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Preterite */}
                    <div>
                      <p className="font-medium text-muted-foreground">Pretérito:</p>
                      <div className="grid grid-cols-2 gap-1 ml-2">
                        {Object.entries(definition.conjugations.preterito).map(([person, form]) => (
                          <span key={person} className="text-xs">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Future */}
                    <div>
                      <p className="font-medium text-muted-foreground">Futuro:</p>
                      <div className="grid grid-cols-2 gap-1 ml-2">
                        {Object.entries(definition.conjugations.futuro).map(([person, form]) => (
                          <span key={person} className="text-xs">
                            {person}: <strong>{form}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
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