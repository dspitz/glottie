/**
 * Count Unique Words in Song Lyrics
 *
 * Analyzes all songs with lyrics and counts unique words per language
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function countUniqueWords() {
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

  const spanishWords = new Set<string>()
  const frenchWords = new Set<string>()

  console.log(`Analyzing ${songs.length} songs...\n`)

  for (const song of songs) {
    try {
      const lyricsData = JSON.parse(song.lyricsRaw!)
      const lines: string[] = lyricsData.lines || []

      for (const line of lines) {
        if (!line) continue

        // Simple tokenization (remove punctuation, split by spaces)
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
      // Skip songs with parse errors
      console.log(`Skipping ${song.title} - parse error`)
    }
  }

  console.log('=== Unique Words Extracted from Lyrics ===\n')
  console.log('Spanish:')
  console.log('  Songs:', songs.filter(s => s.language === 'es').length)
  console.log('  Unique words:', spanishWords.size)
  console.log('')
  console.log('French:')
  console.log('  Songs:', songs.filter(s => s.language === 'fr').length)
  console.log('  Unique words:', frenchWords.size)
  console.log('')
  console.log('TOTAL unique words:', spanishWords.size + frenchWords.size)
  console.log('')

  // Calculate enrichment cost
  const totalWords = spanishWords.size + frenchWords.size
  const costPerWord = 0.06 // $0.06 per word for GPT-4 enrichment
  const totalCost = totalWords * costPerWord

  console.log('=== Enrichment Cost Estimate ===\n')
  console.log(`Cost to enrich all words: $${totalCost.toFixed(2)}`)
  console.log(`  Spanish (${spanishWords.size} words): $${(spanishWords.size * costPerWord).toFixed(2)}`)
  console.log(`  French (${frenchWords.size} words): $${(frenchWords.size * costPerWord).toFixed(2)}`)
  console.log('')
  console.log('Sample Spanish words:', Array.from(spanishWords).slice(0, 15).join(', '))
  console.log('Sample French words:', Array.from(frenchWords).slice(0, 15).join(', '))

  await prisma.$disconnect()
}

countUniqueWords()
