'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Bookmark, BookOpen } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VocabularyModal } from '@/components/vocab/VocabularyModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFloodColor, getSecondaryColor } from '@/lib/languageUtils'

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

interface EngagedWord {
  word: string
  clickCount: number
  vocabulary: VocabularyWord | null
  translation: string | null
  definition: string | null
  lastClickedAt: string | null
}

interface BookmarkedLine {
  id: string
  songId: string
  songTitle: string
  songArtist: string
  lineText: string
  lineTranslation: string | null
  lineIndex: number
  bookmarkedAt: string
}

export default function LearningsPage() {
  const { language } = useLanguage()
  const [engagedWords, setEngagedWords] = useState<EngagedWord[]>([])
  const [bookmarkedLines, setBookmarkedLines] = useState<BookmarkedLine[]>([])
  const [isLoadingEngaged, setIsLoadingEngaged] = useState(true)
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true)
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    document.body.style.backgroundColor = getFloodColor(language)
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [language])

  // Load most engaged words
  useEffect(() => {
    const loadEngagedWords = async (showLoading = true) => {
      if (showLoading) setIsLoadingEngaged(true)
      try {
        const response = await fetch(`/api/word-clicks?limit=20&language=${language}`)
        const data = await response.json()

        // Sort by click count (desc) then by recency (desc) within each tier
        const sorted = (data.words || []).sort((a: EngagedWord, b: EngagedWord) => {
          if (b.clickCount !== a.clickCount) {
            return b.clickCount - a.clickCount
          }
          // Within same click count, most recent first
          const aTime = a.lastClickedAt ? new Date(a.lastClickedAt).getTime() : 0
          const bTime = b.lastClickedAt ? new Date(b.lastClickedAt).getTime() : 0
          return bTime - aTime
        })

        setEngagedWords(sorted)
      } catch (error) {
        // console.error('Error loading engaged words:', error)
      } finally {
        if (showLoading) setIsLoadingEngaged(false)
      }
    }

    // Initial load with loading state
    loadEngagedWords(true)

    // Poll for updates every 3 seconds without showing loading
    const interval = setInterval(() => loadEngagedWords(false), 3000)
    return () => clearInterval(interval)
  }, [language])

  // Load bookmarked lines
  useEffect(() => {
    const loadBookmarks = async () => {
      setIsLoadingBookmarks(true)
      console.log('🔖 Loading bookmarks for language:', language)
      try {
        // Try to fetch from API first (for authenticated users)
        const response = await fetch(`/api/bookmarks/lines?language=${language}`)
        const apiBookmarks = await response.json()
        console.log('🔖 API bookmarks:', apiBookmarks.length)

        // Also load from localStorage (for non-authenticated users or as backup)
        let localBookmarks: BookmarkedLine[] = []
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('bookmarkedLines')
          console.log('🔖 localStorage has bookmarks:', !!saved)
          if (saved) {
            try {
              const parsed = JSON.parse(saved)
              console.log('🔖 Total bookmarks in localStorage:', parsed.length)

              // For old bookmarks without songLanguage, we need to fetch song data
              const bookmarksWithLanguage = await Promise.all(
                parsed.map(async (bookmark: any, index: number) => {
                  console.log(`🔖 Processing bookmark ${index}:`, {
                    songId: bookmark.songId,
                    hasLanguage: !!bookmark.songLanguage,
                    storedLanguage: bookmark.songLanguage,
                    lineText: bookmark.lineText?.substring(0, 30)
                  })

                  // If bookmark already has language, use it
                  if (bookmark.songLanguage) {
                    const matches = bookmark.songLanguage === language
                    console.log(`🔖 Bookmark ${index} has language '${bookmark.songLanguage}', looking for '${language}': ${matches ? 'MATCH' : 'NO MATCH'}`)
                    return matches ? bookmark : null
                  }

                  // For old bookmarks, fetch from API to get language
                  console.log(`🔖 Bookmark ${index} missing language, fetching from API...`)
                  try {
                    const songRes = await fetch(`/api/lyrics/${bookmark.songId}`)
                    if (songRes.ok) {
                      const songData = await songRes.json()
                      console.log(`🔖 Bookmark ${index} song data:`, {
                        title: songData.title,
                        language: songData.language,
                        matches: songData.language === language
                      })

                      // Update bookmark with language info
                      const updatedBookmark = {
                        ...bookmark,
                        songLanguage: songData.language,
                        songTitle: bookmark.songTitle || songData.title,
                        songArtist: bookmark.songArtist || songData.artist
                      }

                      // Only return if it matches current language
                      return updatedBookmark.songLanguage === language ? updatedBookmark : null
                    } else {
                      console.error(`🔖 Bookmark ${index} API failed:`, songRes.status)
                    }
                  } catch (e) {
                    console.error(`🔖 Bookmark ${index} error:`, e)
                  }
                  return null
                })
              )

              // Filter out nulls and map to BookmarkedLine format
              localBookmarks = bookmarksWithLanguage
                .filter(Boolean)
                .map((bookmark: any) => ({
                  id: bookmark.id,
                  songId: bookmark.songId,
                  songTitle: bookmark.songTitle || 'Unknown Song',
                  songArtist: bookmark.songArtist || 'Unknown Artist',
                  lineText: bookmark.lineText,
                  lineTranslation: bookmark.lineTranslation,
                  lineIndex: bookmark.lineIndex,
                  bookmarkedAt: bookmark.bookmarkedAt
                }))

              console.log('🔖 localStorage bookmarks matching language:', localBookmarks.length)

              // Save updated bookmarks back to localStorage with language metadata
              if (bookmarksWithLanguage.some(b => b)) {
                const allUpdatedBookmarks = parsed.map((bookmark: any) => {
                  const updated = bookmarksWithLanguage.find((b: any) => b?.id === bookmark.id)
                  return updated || bookmark
                })
                localStorage.setItem('bookmarkedLines', JSON.stringify(allUpdatedBookmarks))
              }
            } catch (e) {
              console.error('Error parsing localStorage bookmarks:', e)
            }
          }
        }

        // Merge API and localStorage bookmarks, removing duplicates
        const allBookmarks = [...apiBookmarks]
        localBookmarks.forEach(local => {
          const exists = allBookmarks.some(
            api => api.songId === local.songId && api.lineIndex === local.lineIndex
          )
          if (!exists) {
            allBookmarks.push(local)
          }
        })

        console.log('🔖 Total bookmarks after merge:', allBookmarks.length)
        console.log('🔖 Bookmarks:', allBookmarks)
        setBookmarkedLines(allBookmarks)
      } catch (error) {
        // console.error('Error loading bookmarked lines:', error)
      } finally {
        setIsLoadingBookmarks(false)
      }
    }
    loadBookmarks()
  }, [language])

  const handleEngagedWordClick = async (engaged: EngagedWord) => {
    // If it has vocabulary data, use that
    if (engaged.vocabulary) {
      setSelectedWord(engaged.vocabulary)
      setModalOpen(true)
      return
    }

    // Otherwise, create a temporary VocabularyWord-like object for the modal
    let definition = engaged.definition
    if (!definition && engaged.word) {
      try {
        const response = await fetch(`/api/define`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: engaged.word })
        })
        const data = await response.json()
        definition = JSON.stringify(data)
      } catch (error) {
        // console.error('Failed to fetch definition:', error)
      }
    }

    // Create a temporary word object
    const tempWord: VocabularyWord = {
      id: `temp-${engaged.word}`,
      word: engaged.word,
      translation: engaged.translation || '',
      partOfSpeech: 'other',
      frequency: 0,
      usefulnessScore: 0,
      definition: definition,
      examples: null,
      conjugations: null,
      synonyms: null
    }

    setSelectedWord(tempWord)
    setModalOpen(true)
  }

  const renderEngagedWord = (engaged: EngagedWord) => {
    // Determine part of speech
    let partOfSpeech = 'other'
    const vocab = engaged.vocabulary

    if (vocab) {
      partOfSpeech = vocab.partOfSpeech
    } else if (engaged.definition) {
      try {
        const def = JSON.parse(engaged.definition)
        if (def.pos) {
          const posLower = def.pos.toLowerCase()
          if (posLower.includes('noun')) partOfSpeech = 'noun'
          else if (posLower.includes('verb')) partOfSpeech = 'verb'
          else if (posLower.includes('adj')) partOfSpeech = 'adjective'
          else if (posLower.includes('adv')) partOfSpeech = 'adverb'
        }
      } catch (e) {
        // Keep default
      }
    }

    const partOfSpeechColors = {
      noun: 'bg-blue-100 text-blue-800',
      verb: 'bg-green-100 text-green-800',
      adjective: 'bg-purple-100 text-purple-800',
      adverb: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    }

    const partOfSpeechLabels = {
      noun: 'Noun',
      verb: 'Verb',
      adjective: 'Adj',
      adverb: 'Adv',
      other: 'Other'
    }

    const translation = vocab?.translation || engaged.translation

    return (
      <div
        key={engaged.word}
        className="p-3 border-2 border-border bg-card hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-between"
        style={{ borderRadius: '24px', gap: '16px' }}
        onClick={() => handleEngagedWordClick(engaged)}
      >
        <div className="flex items-center flex-1 min-w-0" style={{ gap: '16px' }}>
          <div className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm shrink-0">
            {engaged.clickCount}×
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">{engaged.word}</h3>
            {translation ? (
              <p className="text-sm text-muted-foreground truncate" style={{ marginTop: '8px' }}>{translation}</p>
            ) : (
              <p className="text-sm text-muted-foreground" style={{ marginTop: '8px' }}>Click to see definition</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${partOfSpeechColors[partOfSpeech as keyof typeof partOfSpeechColors]}`}>
          {partOfSpeechLabels[partOfSpeech as keyof typeof partOfSpeechLabels]}
        </span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 pb-20">
      <div className="max-w-2xl mx-auto pt-8 pb-6">
        <h1 className="text-center" style={{ fontSize: '44px', lineHeight: '52px', fontWeight: 500, color: getSecondaryColor(language), marginTop: '32px', marginBottom: '32px' }}>Learnings</h1>
        <Tabs defaultValue="words" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="words" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Engaged Words
            </TabsTrigger>
            <TabsTrigger value="phrases" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Phrases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="words" className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Words you've clicked on most frequently
              </p>
            </div>

            {isLoadingEngaged ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : engagedWords.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {engagedWords.map(renderEngagedWord)}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium mb-1">No engaged words yet</p>
                <p className="text-sm">Start clicking on words in songs to see them here!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="phrases" className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Phrases you've bookmarked from songs
              </p>
            </div>

            {isLoadingBookmarks ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : bookmarkedLines.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bookmarkedLines.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="p-3 border-2 border-border bg-card hover:shadow-md transition-all hover:scale-[1.01]"
                    style={{ borderRadius: '24px' }}
                  >
                    <div className="flex items-start justify-between mb-2" style={{ gap: '16px' }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground mb-1">{bookmark.lineText}</p>
                        {bookmark.lineTranslation && (
                          <p className="text-sm text-muted-foreground italic" style={{ marginTop: '8px' }}>{bookmark.lineTranslation}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground" style={{ gap: '8px' }}>
                      <BookOpen className="h-3 w-3" />
                      <span>{bookmark.songTitle}</span>
                      <span>•</span>
                      <span>{bookmark.songArtist}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium mb-1">No saved phrases yet</p>
                <p className="text-sm">Bookmark lyrics from songs to save them here!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
