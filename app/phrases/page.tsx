'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, BookOpen, HelpCircle, MessageSquare, Activity, Clock, Heart, Link, ChevronRight } from 'lucide-react'
import { fetchPhrases, fetchPhraseCategories } from '@/lib/client'
import { PhraseCard } from '@/components/phrases/PhraseCard'
import { useDebounce } from '@/hooks/useDebounce'

interface PhraseCategory {
  id: string
  name: string
  displayName: string
  icon?: string
  phraseCount: number
  description?: string
}

interface Phrase {
  id: string
  songId: string
  originalText: string
  translatedText: string
  lineIndex: number
  timestamp?: number | null
  usefulnessScore: number
  category: string
  wordCount: number
  song: {
    id: string
    title: string
    artist: string
    albumArt?: string | null
    spotifyId?: string | null
  }
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  greetings: <BookOpen className="h-6 w-6" />,
  questions: <HelpCircle className="h-6 w-6" />,
  expressions: <MessageSquare className="h-6 w-6" />,
  actions: <Activity className="h-6 w-6" />,
  time: <Clock className="h-6 w-6" />,
  emotions: <Heart className="h-6 w-6" />,
  connectors: <Link className="h-6 w-6" />,
  vocabulary: <BookOpen className="h-6 w-6" />
}

export default function PhrasesPage() {
  const [categories, setCategories] = useState<PhraseCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(false)
  const [totalPhrases, setTotalPhrases] = useState(0)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchPhraseCategories()
        setCategories(data)
        const total = data.reduce((sum: number, cat: PhraseCategory) => sum + cat.phraseCount, 0)
        setTotalPhrases(total)
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // Load phrases when category or search changes
  useEffect(() => {
    const loadPhrases = async () => {
      if (!selectedCategory && !debouncedSearch) {
        setPhrases([])
        return
      }

      setIsLoadingPhrases(true)
      try {
        const data = await fetchPhrases({
          category: selectedCategory || undefined,
          search: debouncedSearch || undefined,
          limit: 50
        })
        setPhrases(data)
      } catch (error) {
        console.error('Error loading phrases:', error)
      } finally {
        setIsLoadingPhrases(false)
      }
    }
    loadPhrases()
  }, [selectedCategory, debouncedSearch])

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(categoryName)
      setSearchQuery('')  // Clear search when selecting category
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (e.target.value) {
      setSelectedCategory(null)  // Clear category when searching
    }
  }

  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">Useful Phrases</h1>
        <p className="text-muted-foreground text-sm mb-4">
          {totalPhrases}+ practical phrases from your favorite songs
        </p>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search phrases..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        {/* Categories Grid */}
        {!searchQuery && !selectedCategory && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {isLoadingCategories ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))
            ) : (
              categories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-primary mb-2">
                      {categoryIcons[category.name] || <BookOpen className="h-6 w-6" />}
                    </div>
                    <h3 className="text-sm font-medium">{category.displayName}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.phraseCount} phrases
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Selected Category Header */}
        {selectedCategory && (
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <div className="flex items-center gap-2">
              {categoryIcons[selectedCategory]}
              <h2 className="text-lg font-semibold">
                {categories.find(c => c.name === selectedCategory)?.displayName}
              </h2>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all categories
            </button>
          </div>
        )}

        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-4 pb-2 border-b">
            <h2 className="text-lg font-semibold">
              Search results for "{searchQuery}"
            </h2>
            <p className="text-sm text-muted-foreground">
              {phrases.length} phrases found
            </p>
          </div>
        )}

        {/* Phrases List */}
        {(selectedCategory || searchQuery) && (
          <div className="space-y-3">
            {isLoadingPhrases ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))
            ) : phrases.length > 0 ? (
              phrases.map((phrase) => (
                <PhraseCard key={phrase.id} phrase={phrase} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No phrases found</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && !selectedCategory && categories.length === 0 && !isLoadingCategories && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No phrases available yet</p>
            <p className="text-sm mt-2">Check back after songs are processed</p>
          </div>
        )}
      </div>
    </div>
  )
}