'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, BookOpen } from 'lucide-react'
import { fetchVocabulary } from '@/lib/client'
import { VocabularyCard } from '@/components/vocab/VocabularyCard'
import { VocabularyModal } from '@/components/vocab/VocabularyModal'
import { useDebounce } from '@/hooks/useDebounce'

interface VocabularyWord {
  id: string
  word: string
  translation: string
  partOfSpeech: string
  frequency: number
  usefulnessScore: number
  definition?: string | null
  examples?: string | null
  conjugations?: string | null
  synonyms?: string | null
}

interface VocabularyResponse {
  vocabulary: VocabularyWord[]
  totalCount: number
}

export default function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Load vocabulary
  useEffect(() => {
    const loadVocabulary = async () => {
      setIsLoading(true)
      try {
        const data: VocabularyResponse = await fetchVocabulary({
          search: debouncedSearch || undefined,
          limit: 100
        })
        setVocabulary(data.vocabulary)
        setTotalCount(data.totalCount)
      } catch (error) {
        console.error('Error loading vocabulary:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadVocabulary()
  }, [debouncedSearch])

  const handleWordClick = (word: VocabularyWord) => {
    setSelectedWord(word)
    setModalOpen(true)
  }

  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Key Vocabulary</h1>
        <p className="text-muted-foreground text-sm mb-6">
          The {vocabulary.length} most important Spanish words to learn
        </p>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vocabulary List */}
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))
          ) : vocabulary.length > 0 ? (
            <>
              {vocabulary.map((word) => (
                <VocabularyCard
                  key={word.id}
                  word={word}
                  onClick={() => handleWordClick(word)}
                />
              ))}
            </>
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vocabulary found</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        {!searchQuery && totalCount > 100 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Showing top 100 words from {totalCount} total vocabulary
          </div>
        )}
      </div>

      {/* Vocabulary Modal */}
      <VocabularyModal
        word={selectedWord}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}