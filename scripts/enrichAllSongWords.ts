/**
 * Enrich All Song Words
 *
 * Extracts all unique words from song lyrics and enriches them with:
 * - Multi-language translations (12 languages)
 * - Verb conjugations (6 core tenses)
 * - Synonyms, antonyms, definitions, examples
 *
 * This pre-caches vocabulary so users get instant lookups.
 */

import { PrismaClient } from '@prisma/client'
import { enrichVocabularyBatch } from '../lib/vocabularyEnrichment'

const prisma = new PrismaClient()

async function enrichAllSongWords() {
  console.log('🚀 Starting vocabulary enrichment for all song words...\n')

  // Fetch all songs with lyrics
  const songs = await prisma.song.findMany({
    where: {
      hasLyrics: true,
      lyricsRaw: { not: null }
    },
    select: {
      id: true,
      title: true,
      language: true,
      lyricsRaw: true
    }
  })

  console.log(`Found ${songs.length} songs with lyrics\n`)

  // Extract unique words per language
  const spanishWords = new Set<string>()
  const frenchWords = new Set<string>()

  for (const song of songs) {
    try {
      const lyricsData = JSON.parse(song.lyricsRaw!)
      const lines: string[] = lyricsData.lines || []

      for (const line of lines) {
        if (!line) continue

        // Tokenize: remove punctuation, split by spaces
        const words = line
          .toLowerCase()
          .replace(/[.,!?;:"'()\[\]{}¿¡—\-]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 0 && !/^[0-9]+$/.test(w))

        if (song.language === 'es') {
          words.forEach(w => spanishWords.add(w))
        } else if (song.language === 'fr') {
          words.forEach(w => frenchWords.add(w))
        }
      }
    } catch (e) {
      console.log(`⚠️  Skipping ${song.title} - parse error`)
    }
  }

  console.log('📊 Unique words extracted:')
  console.log(`  Spanish: ${spanishWords.size}`)
  console.log(`  French: ${frenchWords.size}`)
  console.log(`  Total: ${spanishWords.size + frenchWords.size}\n`)

  // Check what's already enriched
  const alreadyEnrichedSpanish = await prisma.vocabularyEnriched.count({
    where: { language: 'es' }
  })
  const alreadyEnrichedFrench = await prisma.vocabularyEnriched.count({
    where: { language: 'fr' }
  })

  console.log('✅ Already enriched:')
  console.log(`  Spanish: ${alreadyEnrichedSpanish}`)
  console.log(`  French: ${alreadyEnrichedFrench}\n`)

  // Filter out already enriched words
  const enrichedSpanishWords = await prisma.vocabularyEnriched.findMany({
    where: { language: 'es' },
    select: { word: true }
  })
  const enrichedFrenchWords = await prisma.vocabularyEnriched.findMany({
    where: { language: 'fr' },
    select: { word: true }
  })

  const enrichedSpanishSet = new Set(enrichedSpanishWords.map(w => w.word))
  const enrichedFrenchSet = new Set(enrichedFrenchWords.map(w => w.word))

  const newSpanishWords = Array.from(spanishWords).filter(w => !enrichedSpanishSet.has(w))
  const newFrenchWords = Array.from(frenchWords).filter(w => !enrichedFrenchSet.has(w))

  console.log('🆕 Need to enrich:')
  console.log(`  Spanish: ${newSpanishWords.length}`)
  console.log(`  French: ${newFrenchWords.length}`)
  console.log(`  Total: ${newSpanishWords.length + newFrenchWords.length}\n`)

  const totalNewWords = newSpanishWords.length + newFrenchWords.length
  const estimatedCost = totalNewWords * 0.06
  const estimatedTime = Math.ceil(totalNewWords / 10) * 3 // 10 words per batch, ~3 seconds per batch

  console.log('💰 Cost estimate: $' + estimatedCost.toFixed(2))
  console.log('⏱️  Estimated time: ~' + Math.ceil(estimatedTime / 60) + ' minutes\n')
  console.log('🔄 Starting enrichment...\n')

  let successCount = 0
  let failCount = 0

  // Process Spanish words
  if (newSpanishWords.length > 0) {
    console.log('📚 Processing Spanish words...\n')
    for (let i = 0; i < newSpanishWords.length; i += 10) {
      const batch = newSpanishWords.slice(i, i + 10)
      const batchNum = Math.floor(i / 10) + 1
      const totalBatches = Math.ceil(newSpanishWords.length / 10)

      console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.slice(0, 5).join(', ')}...`)

      try {
        await enrichVocabularyBatch(batch, 'es')
        successCount += batch.length
        console.log(`  ✅ Enriched ${batch.length} Spanish words`)
      } catch (error: any) {
        failCount += batch.length
        console.error(`  ❌ Error enriching Spanish batch:`, error.message)
      }

      // Rate limiting delay (avoid OpenAI throttling)
      if (i + 10 < newSpanishWords.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  // Process French words
  if (newFrenchWords.length > 0) {
    console.log('\n📚 Processing French words...\n')
    for (let i = 0; i < newFrenchWords.length; i += 10) {
      const batch = newFrenchWords.slice(i, i + 10)
      const batchNum = Math.floor(i / 10) + 1
      const totalBatches = Math.ceil(newFrenchWords.length / 10)

      console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.slice(0, 5).join(', ')}...`)

      try {
        await enrichVocabularyBatch(batch, 'fr')
        successCount += batch.length
        console.log(`  ✅ Enriched ${batch.length} French words`)
      } catch (error: any) {
        failCount += batch.length
        console.error(`  ❌ Error enriching French batch:`, error.message)
      }

      // Rate limiting delay
      if (i + 10 < newFrenchWords.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  // Final stats
  const finalSpanishCount = await prisma.vocabularyEnriched.count({
    where: { language: 'es' }
  })
  const finalFrenchCount = await prisma.vocabularyEnriched.count({
    where: { language: 'fr' }
  })

  console.log('\n' + '='.repeat(60))
  console.log('✨ Enrichment Complete!\n')
  console.log('📊 Final Statistics:')
  console.log(`  Spanish words enriched: ${finalSpanishCount}`)
  console.log(`  French words enriched: ${finalFrenchCount}`)
  console.log(`  Total enriched: ${finalSpanishCount + finalFrenchCount}`)
  console.log('')
  console.log('📈 This Session:')
  console.log(`  Successfully enriched: ${successCount}`)
  console.log(`  Failed: ${failCount}`)
  console.log(`  Success rate: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`)
  console.log('')
  console.log('💡 Each word now has:')
  console.log('  ✓ Translations in 12 languages (en, es, fr, it, pt, de, zh, ja, ko, ar, ru, hi)')
  console.log('  ✓ Verb conjugations (6 core tenses)')
  console.log('  ✓ Synonyms & antonyms')
  console.log('  ✓ Definitions & example sentences')
  console.log('')
  console.log('🚀 Users will now get instant vocabulary lookups!')
  console.log('='.repeat(60))

  await prisma.$disconnect()
}

enrichAllSongWords()
