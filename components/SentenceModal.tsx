import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { translateText } from '@/lib/client'
import { Loader2 } from 'lucide-react'

interface SentenceModalProps {
  isOpen: boolean
  onClose: () => void
  sentence: string
  translations?: string[]
  backgroundColor?: string
}

export function SentenceModal({ 
  isOpen, 
  onClose, 
  sentence,
  translations,
  backgroundColor 
}: SentenceModalProps) {
  const [translation, setTranslation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen && sentence) {
      // If we have pre-computed translations (demo mode), use those
      if (translations && translations.length > 0) {
        setTranslation(translations[0])
        setIsLoading(false)
        setError('')
        return
      }

      // Otherwise fetch translation
      setIsLoading(true)
      setError('')
      
      translateText(sentence)
        .then((result) => {
          setTranslation(result.translation)
        })
        .catch((err) => {
          setError('Failed to translate sentence')
          console.error('Translation error:', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, sentence, translations])

  // Apply background color when modal opens
  useEffect(() => {
    if (isOpen && backgroundColor && typeof window !== 'undefined') {
      // Create or update style element for modal background
      let styleEl = document.getElementById('modal-bg-style') as HTMLStyleElement
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = 'modal-bg-style'
        document.head.appendChild(styleEl)
      }
      
      styleEl.textContent = `
        [data-state="open"] {
          background-color: ${backgroundColor} !important;
        }
        
        .modal-overlay {
          background-color: ${backgroundColor}80 !important;
        }
      `
      
      return () => {
        styleEl?.remove()
      }
    }
  }, [isOpen, backgroundColor])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sentence Translation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Original sentence */}
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              Spanish
            </h3>
            <p className="text-lg">{sentence}</p>
          </div>

          {/* Translation */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">
              English Translation
            </h3>
            
            {isLoading && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </div>
            )}
            
            {error && (
              <p className="text-destructive">{error}</p>
            )}
            
            {!isLoading && !error && translation && (
              <p className="text-lg">{translation}</p>
            )}
          </div>

          {/* Tips */}
          <div className="text-sm text-muted-foreground">
            <p>
              💡 <strong>Tip:</strong> Click on individual words in the lyrics to see definitions and conjugations.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}