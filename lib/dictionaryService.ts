/**
 * Dictionary Service
 *
 * Provides comprehensive word lookup with:
 * 1. Cache-first strategy (VocabularyEnriched table)
 * 2. AI enrichment for common words (top 10k)
 * 3. Fallback to free dictionary APIs for rare words
 */

import { PrismaClient } from '@prisma/client'
import { getEnrichedVocabulary } from './vocabularyEnrichment'

const prisma = new PrismaClient()

interface DictionaryEntry {
  word: string
  language: string
  translations: Record<string, string>
  root?: string
  partOfSpeech: string
  conjugations?: any
  synonyms?: string[]
  antonyms?: string[]
  definition?: string
  exampleSentence?: string
  exampleTranslation?: string
  usefulnessScore?: number
  pronunciation?: string
  etymology?: string
  source: 'cache' | 'ai' | 'wiktionary' | 'free-dictionary'
}

// Top 10,000 most common words (would be loaded from file)
const COMMON_WORDS_SET = new Set<string>([
  // This would be populated from frequency lists
  // For now, we'll consider any word in Vocabulary table as "common"
])

/**
 * Main dictionary lookup function
 */
export async function lookupWord(
  word: string,
  language: string = 'es'
): Promise<DictionaryEntry | null> {
  const normalizedWord = word.toLowerCase()

  // Step 1: Check cache
  const cached = await prisma.vocabularyEnriched.findUnique({
    where: {
      word_language: {
        word: normalizedWord,
        language,
      },
    },
  })

  if (cached) {
    return {
      word: cached.word,
      language: cached.language,
      translations: JSON.parse(cached.translations),
      root: cached.root || undefined,
      partOfSpeech: cached.partOfSpeech,
      conjugations: cached.conjugations ? JSON.parse(cached.conjugations) : undefined,
      synonyms: cached.synonyms ? JSON.parse(cached.synonyms) : undefined,
      antonyms: cached.antonyms ? JSON.parse(cached.antonyms) : undefined,
      definition: cached.definition || undefined,
      exampleSentence: cached.exampleSentence || undefined,
      exampleTranslation: cached.exampleTranslation || undefined,
      usefulnessScore: cached.usefulnessScore || undefined,
      source: 'cache',
    }
  }

  // Step 2: Check if word is common enough for AI enrichment
  const isCommon = await isCommonWord(normalizedWord, language)

  if (isCommon) {
    try {
      console.log(`Word "${word}" is common, using AI enrichment`)
      const enriched = await getEnrichedVocabulary([normalizedWord], language)
      if (enriched.length > 0) {
        return {
          ...enriched[0],
          source: 'ai',
        }
      }
    } catch (error) {
      console.error('AI enrichment failed, falling back to dictionary APIs:', error)
    }
  }

  // Step 3: Try Wiktionary
  try {
    const wiktionaryEntry = await fetchFromWiktionary(normalizedWord, language)
    if (wiktionaryEntry) {
      return { ...wiktionaryEntry, source: 'wiktionary' }
    }
  } catch (error) {
    console.error('Wiktionary lookup failed:', error)
  }

  // Step 4: Try Free Dictionary API
  try {
    const freeDictEntry = await fetchFromFreeDictionary(normalizedWord, language)
    if (freeDictEntry) {
      return { ...freeDictEntry, source: 'free-dictionary' }
    }
  } catch (error) {
    console.error('Free dictionary lookup failed:', error)
  }

  // Step 5: No results found
  return null
}

/**
 * Check if word is common enough to justify AI enrichment
 */
async function isCommonWord(word: string, language: string): Promise<boolean> {
  // Check if word exists in Vocabulary table (words from songs)
  const inSongs = await prisma.vocabulary.findFirst({
    where: {
      word,
      language,
    },
  })

  if (inSongs) {
    // If word has high usefulness score or high frequency, it's common
    return inSongs.usefulnessScore >= 0.5 || inSongs.frequency >= 100
  }

  // Could also check against pre-loaded common words list
  return COMMON_WORDS_SET.has(word)
}

/**
 * Fetch word definition from Wiktionary API
 */
async function fetchFromWiktionary(
  word: string,
  language: string
): Promise<DictionaryEntry | null> {
  const langMap: Record<string, string> = {
    es: 'es',
    fr: 'fr',
    en: 'en',
  }

  const wiktionaryLang = langMap[language] || language

  try {
    const response = await fetch(
      `https://${wiktionaryLang}.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
    )

    if (!response.ok) return null

    const data = await response.json()

    // Wiktionary returns data grouped by part of speech
    if (!data || Object.keys(data).length === 0) return null

    // Get first part of speech
    const firstPos = Object.keys(data)[0]
    const definitions = data[firstPos]

    if (!definitions || definitions.length === 0) return null

    const firstDef = definitions[0]

    return {
      word,
      language,
      translations: {
        en: firstDef.definition || '',
      },
      partOfSpeech: firstPos,
      definition: firstDef.definition,
      exampleSentence: firstDef.examples?.[0] || undefined,
      source: 'wiktionary',
    }
  } catch (error) {
    console.error('Wiktionary fetch error:', error)
    return null
  }
}

/**
 * Fetch word definition from Free Dictionary API
 */
async function fetchFromFreeDictionary(
  word: string,
  language: string
): Promise<DictionaryEntry | null> {
  const langMap: Record<string, string> = {
    es: 'es',
    fr: 'fr',
    en: 'en',
  }

  const apiLang = langMap[language] || 'en'

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${apiLang}/${encodeURIComponent(word)}`
    )

    if (!response.ok) return null

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) return null

    const entry = data[0]
    const firstMeaning = entry.meanings?.[0]

    if (!firstMeaning) return null

    return {
      word,
      language,
      translations: {
        en: firstMeaning.definitions?.[0]?.definition || '',
      },
      partOfSpeech: firstMeaning.partOfSpeech || 'unknown',
      definition: firstMeaning.definitions?.[0]?.definition,
      exampleSentence: firstMeaning.definitions?.[0]?.example || undefined,
      synonyms: firstMeaning.synonyms || undefined,
      antonyms: firstMeaning.antonyms || undefined,
      pronunciation: entry.phonetic || undefined,
      source: 'free-dictionary',
    }
  } catch (error) {
    console.error('Free dictionary fetch error:', error)
    return null
  }
}

/**
 * Batch lookup for multiple words
 */
export async function lookupWords(
  words: string[],
  language: string = 'es'
): Promise<DictionaryEntry[]> {
  const results = await Promise.all(
    words.map(word => lookupWord(word, language))
  )

  return results.filter((entry): entry is DictionaryEntry => entry !== null)
}

/**
 * Search dictionary by prefix
 */
export async function searchDictionary(
  prefix: string,
  language: string = 'es',
  limit: number = 20
): Promise<DictionaryEntry[]> {
  // Search cached words first
  const cached = await prisma.vocabularyEnriched.findMany({
    where: {
      word: {
        startsWith: prefix.toLowerCase(),
      },
      language,
    },
    take: limit,
    orderBy: {
      usefulnessScore: 'desc',
    },
  })

  return cached.map(c => ({
    word: c.word,
    language: c.language,
    translations: JSON.parse(c.translations),
    root: c.root || undefined,
    partOfSpeech: c.partOfSpeech,
    conjugations: c.conjugations ? JSON.parse(c.conjugations) : undefined,
    synonyms: c.synonyms ? JSON.parse(c.synonyms) : undefined,
    antonyms: c.antonyms ? JSON.parse(c.antonyms) : undefined,
    definition: c.definition || undefined,
    exampleSentence: c.exampleSentence || undefined,
    exampleTranslation: c.exampleTranslation || undefined,
    usefulnessScore: c.usefulnessScore || undefined,
    source: 'cache' as const,
  }))
}
