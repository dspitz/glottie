/**
 * Vocabulary Auto-Enrichment
 *
 * Automatically enriches new vocabulary words during song hydration.
 * Extracts words from song lyrics and enriches any that aren't already cached.
 */

import { PrismaClient } from '@prisma/client'
import { getEnrichedVocabulary } from './vocabularyEnrichment'

const prisma = new PrismaClient()

export interface VocabEnrichmentStats {
  totalWords: number
  newWords: number
  alreadyCached: number
  enriched: number
  failed: number
  errors: string[]
}

/**
 * Extract and enrich vocabulary from a song
 */
export async function extractAndEnrichVocabulary(
  songId: string,
  language: string
): Promise<VocabEnrichmentStats> {
  const stats: VocabEnrichmentStats = {
    totalWords: 0,
    newWords: 0,
    alreadyCached: 0,
    enriched: 0,
    failed: 0,
    errors: [],
  }

  try {
    // Fetch song with lyrics
    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: { lyricsRaw: true },
    })

    if (!song || !song.lyricsRaw) {
      stats.errors.push('Song has no lyrics')
      return stats
    }

    // Parse lyrics
    let lyrics: string[]
    try {
      const lyricsData = JSON.parse(song.lyricsRaw)
      lyrics = lyricsData.lines || []
    } catch (e) {
      stats.errors.push('Failed to parse lyrics')
      return stats
    }

    // Extract unique words
    const uniqueWords = new Set<string>()
    for (const line of lyrics) {
      if (!line) continue

      // Tokenize: remove punctuation, split by spaces
      const words = line
        .toLowerCase()
        .replace(/[.,!?;:"'()\[\]{}¿¡—\-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0 && !/^[0-9]+$/.test(w))

      words.forEach(w => uniqueWords.add(w))
    }

    const words = Array.from(uniqueWords)
    stats.totalWords = words.length

    // Check which words are already cached
    const cached = await prisma.vocabularyEnriched.findMany({
      where: {
        word: { in: words },
        language,
      },
      select: { word: true },
    })

    const cachedWords = new Set(cached.map(c => c.word))
    const newWords = words.filter(w => !cachedWords.has(w))

    stats.alreadyCached = cachedWords.size
    stats.newWords = newWords.length

    // Enrich new words if any
    if (newWords.length > 0) {
      console.log(`  🔤 Found ${newWords.length} new words to enrich`)

      try {
        // Use the existing enrichment function (it handles caching internally)
        await getEnrichedVocabulary(newWords, language)
        stats.enriched = newWords.length
        console.log(`  ✅ Enriched ${newWords.length} new words`)
      } catch (error: any) {
        stats.failed = newWords.length
        stats.errors.push(`Enrichment failed: ${error.message}`)
        console.error(`  ❌ Failed to enrich words:`, error.message)
      }
    } else {
      console.log(`  ✓ All ${stats.totalWords} words already cached`)
    }

    return stats
  } catch (error: any) {
    stats.errors.push(`Unexpected error: ${error.message}`)
    return stats
  }
}

/**
 * Extract words from lyrics without enrichment (for dry-run mode)
 */
export async function extractWordsFromSong(
  songId: string
): Promise<string[]> {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { lyricsRaw: true },
  })

  if (!song || !song.lyricsRaw) return []

  try {
    const lyricsData = JSON.parse(song.lyricsRaw)
    const lyrics: string[] = lyricsData.lines || []

    const uniqueWords = new Set<string>()
    for (const line of lyrics) {
      if (!line) continue

      const words = line
        .toLowerCase()
        .replace(/[.,!?;:"'()\[\]{}¿¡—\-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0 && !/^[0-9]+$/.test(w))

      words.forEach(w => uniqueWords.add(w))
    }

    return Array.from(uniqueWords)
  } catch (e) {
    return []
  }
}
