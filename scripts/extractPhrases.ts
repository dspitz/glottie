#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import {
  scorePhraseUsefulness,
  isUsefulPhrase,
  PHRASE_CATEGORIES,
  USEFULNESS_THRESHOLD
} from '../packages/core/phraseScoring'

const prisma = new PrismaClient()

interface ExtractedPhrase {
  songId: string
  originalText: string
  translatedText: string
  lineIndex: number
  timestamp: number | null
  usefulnessScore: number
  category: string
  wordCount: number
}

async function initializeCategories() {
  console.log('Initializing phrase categories...')

  for (const [name, info] of Object.entries(PHRASE_CATEGORIES)) {
    await prisma.phraseCategory.upsert({
      where: { name },
      update: {
        displayName: info.displayName,
        icon: info.icon,
        order: info.order
      },
      create: {
        name,
        displayName: info.displayName,
        icon: info.icon,
        order: info.order,
        description: `Collection of ${info.displayName.toLowerCase()}`
      }
    })
  }

  console.log(`✅ Initialized ${Object.keys(PHRASE_CATEGORIES).length} categories`)
}

async function extractPhrasesFromSong(songId: string): Promise<ExtractedPhrase[]> {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      translations: {
        where: { targetLang: 'en' }
      }
    }
  })

  if (!song || !song.lyricsRaw) {
    return []
  }

  const translation = song.translations[0]
  if (!translation || !translation.lyricsLines) {
    console.log(`⚠️  No English translation found for song: ${song.title}`)
    return []
  }

  const phrases: ExtractedPhrase[] = []

  try {
    // Parse lyrics
    const lyricsData = JSON.parse(song.lyricsRaw)
    const translationLines = JSON.parse(translation.lyricsLines)

    // Get synchronized data if available
    const syncedLines = lyricsData.synchronized?.lines || []
    const hasTimestamps = syncedLines.length > 0

    // Process each line
    const lines = lyricsData.lines || []
    for (let i = 0; i < lines.length; i++) {
      const originalLine = lines[i]?.trim()
      const translatedLine = translationLines[i]?.trim()

      // Skip empty lines or lines without translation
      if (!originalLine || !translatedLine || originalLine.length < 5) {
        continue
      }

      // Skip lines that are just the artist name
      if (originalLine.toLowerCase() === song.artist.toLowerCase()) {
        continue
      }

      // Get timestamp if available
      const timestamp = hasTimestamps && syncedLines[i]?.time || null

      // Score the phrase
      const scoreResult = scorePhraseUsefulness(originalLine)

      // Only keep useful phrases
      if (isUsefulPhrase(scoreResult.score)) {
        const wordCount = originalLine.split(/\s+/).filter(w => w.length > 0).length

        phrases.push({
          songId,
          originalText: originalLine,
          translatedText: translatedLine,
          lineIndex: i,
          timestamp,
          usefulnessScore: scoreResult.score,
          category: scoreResult.category,
          wordCount
        })
      }
    }
  } catch (error) {
    console.error(`Error processing song ${song.title}:`, error)
  }

  return phrases
}

async function main() {
  console.log('🎵 Starting phrase extraction from all songs...\n')

  try {
    // Initialize categories
    await initializeCategories()
    console.log()

    // Clear existing phrases (optional - comment out to append)
    const deleteCount = await prisma.phrase.count()
    if (deleteCount > 0) {
      console.log(`Clearing ${deleteCount} existing phrases...`)
      await prisma.phrase.deleteMany()
    }

    // Get all songs with lyrics
    const songs = await prisma.song.findMany({
      where: {
        lyricsRaw: { not: null },
        hasTranslations: true
      },
      select: {
        id: true,
        title: true,
        artist: true
      }
    })

    console.log(`Found ${songs.length} songs to process\n`)

    let totalPhrases = 0
    const categoryCount: Record<string, number> = {}

    // Process each song
    for (const song of songs) {
      process.stdout.write(`Processing: ${song.title} by ${song.artist}...`)

      const phrases = await extractPhrasesFromSong(song.id)

      if (phrases.length > 0) {
        // Insert phrases into database
        await prisma.phrase.createMany({
          data: phrases
        })

        // Update counts
        totalPhrases += phrases.length
        phrases.forEach(p => {
          categoryCount[p.category] = (categoryCount[p.category] || 0) + 1
        })

        console.log(` ✅ ${phrases.length} phrases`)
      } else {
        console.log(` ⏭️  No useful phrases`)
      }
    }

    // Update category counts
    for (const [category, count] of Object.entries(categoryCount)) {
      await prisma.phraseCategory.update({
        where: { name: category },
        data: { phraseCount: count }
      })
    }

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 EXTRACTION COMPLETE')
    console.log('='.repeat(60))
    console.log(`Total phrases extracted: ${totalPhrases}`)
    console.log(`Usefulness threshold: ${USEFULNESS_THRESHOLD}`)
    console.log('\nPhrases by category:')

    const categories = await prisma.phraseCategory.findMany({
      orderBy: { order: 'asc' }
    })

    for (const cat of categories) {
      if (cat.phraseCount > 0) {
        console.log(`  ${cat.displayName}: ${cat.phraseCount}`)
      }
    }

    // Show top phrases by score
    console.log('\n🌟 Top 10 most useful phrases:')
    const topPhrases = await prisma.phrase.findMany({
      take: 10,
      orderBy: { usefulnessScore: 'desc' },
      include: { song: true }
    })

    topPhrases.forEach((phrase, i) => {
      console.log(`  ${i + 1}. "${phrase.translatedText}" (${phrase.originalText})`)
      console.log(`     Score: ${phrase.usefulnessScore.toFixed(3)} | From: ${phrase.song.title}`)
    })

  } catch (error) {
    console.error('Error extracting phrases:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main().catch(console.error)