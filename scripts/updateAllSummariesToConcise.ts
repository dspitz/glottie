#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'
import { generateSongSummary } from '../packages/adapters/translate'

async function updateAllSummaries() {
  console.log('🔄 Updating all song summaries to concise format (36 words max)...\n')

  try {
    // Get all songs with summaries longer than ideal
    const songs = await prisma.song.findMany({
      where: {
        songSummary: {
          not: null
        }
      },
      include: {
        translations: {
          where: {
            targetLang: 'en'
          }
        }
      }
    })

    console.log(`Found ${songs.length} songs with summaries to check\n`)

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const song of songs) {
      // Check current summary word count
      const currentWordCount = song.songSummary ? song.songSummary.split(/\s+/).length : 0

      console.log(`\n📄 ${song.title} by ${song.artist}`)
      console.log(`   Current summary: ${currentWordCount} words`)

      // Skip if already concise (under 40 words to allow some existing ones)
      if (currentWordCount <= 40 && currentWordCount > 0) {
        console.log(`   ✓ Already concise, skipping`)
        skippedCount++
        continue
      }

      // Check if we have translations
      if (!song.translations || song.translations.length === 0) {
        console.log(`   ⚠️ No translations available, skipping`)
        skippedCount++
        continue
      }

      try {
        // Parse the translation
        const translation = song.translations[0]
        const translatedLines = JSON.parse(translation.lyricsLines || '[]')

        if (translatedLines.length === 0) {
          console.log(`   ⚠️ Empty translations, skipping`)
          skippedCount++
          continue
        }

        // Generate new concise summary
        console.log(`   🔄 Generating concise summary...`)
        const newSummary = await generateSongSummary(translatedLines, song.title, song.artist)

        if (newSummary && newSummary !== "Problem fetching translations") {
          const newWordCount = newSummary.split(/\s+/).length
          console.log(`   ✅ New summary: ${newWordCount} words`)

          // Update the song
          await prisma.song.update({
            where: { id: song.id },
            data: { songSummary: newSummary }
          })

          updatedCount++
        } else {
          console.log(`   ❌ Failed to generate summary`)
          errorCount++
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
        errorCount++
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n==============================================')
    console.log(`✅ Summary Update Complete!`)
    console.log(`   Updated: ${updatedCount} songs`)
    console.log(`   Skipped: ${skippedCount} songs`)
    console.log(`   Errors: ${errorCount} songs`)
    console.log('==============================================\n')

  } catch (error) {
    console.error('❌ Error updating summaries:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Add manual override for specific song
async function updateSpecificSong(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      translations: {
        where: { targetLang: 'en' }
      }
    }
  })

  if (!song) {
    console.log('Song not found')
    return
  }

  if (!song.translations || song.translations.length === 0) {
    console.log('No translations available')
    return
  }

  const translation = song.translations[0]
  const translatedLines = JSON.parse(translation.lyricsLines || '[]')

  const newSummary = await generateSongSummary(translatedLines, song.title, song.artist)

  if (newSummary && newSummary !== "Problem fetching translations") {
    await prisma.song.update({
      where: { id: songId },
      data: { songSummary: newSummary }
    })
    console.log(`Updated ${song.title}: ${newSummary}`)
  }
}

// Check for command line arguments
const args = process.argv.slice(2)
if (args[0] === '--song' && args[1]) {
  updateSpecificSong(args[1])
} else {
  updateAllSummaries()
}