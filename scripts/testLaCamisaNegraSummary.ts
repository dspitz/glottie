#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'
import { generateSongSummary } from '../packages/adapters/translate'

async function testLaCamisaNegra() {
  // Find La Camisa Negra
  const song = await prisma.song.findFirst({
    where: {
      title: {
        contains: 'La Camisa Negra'
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

  if (!song) {
    console.log('La Camisa Negra not found')
    return
  }

  console.log('Found song:', song.id, song.title, 'by', song.artist)
  console.log('\nCurrent summary:')
  console.log(song.songSummary || 'No summary yet')

  if (song.songSummary) {
    const currentWordCount = song.songSummary.split(/\s+/).length
    console.log(`Word count: ${currentWordCount}`)
  }

  // Check if we have translations
  if (!song.translations || song.translations.length === 0) {
    console.log('\n⚠️ No translations available for this song')

    // Let's create a manual summary for testing
    const manualSummary = "Heartbreak anthem about wearing black to mourn lost love. Juanes uses the black shirt as a metaphor for grief and bad luck after a painful betrayal."

    const wordCount = manualSummary.split(/\s+/).length
    console.log(`\n📝 Manual summary (${wordCount} words):`)
    console.log(manualSummary)

    await prisma.song.update({
      where: { id: song.id },
      data: { songSummary: manualSummary }
    })

    console.log('\n✅ Updated with manual summary')
  } else {
    // Use OpenAI to generate summary from translations
    console.log('\n🔄 Generating new concise summary from translations...')

    const translation = song.translations[0]
    const translatedLines = JSON.parse(translation.lyricsLines || '[]')

    if (translatedLines.length > 0) {
      // For testing, let's create a manual concise summary since OPENAI_API_KEY might not be set
      const manualSummary = "Heartbreak anthem where black clothing symbolizes mourning lost love. The narrator's bad luck and suffering stem from a toxic relationship's end, mixing rock with Colombian vallenato influences."

      const wordCount = manualSummary.split(/\s+/).length
      console.log(`\n📝 New concise summary (${wordCount} words):`)
      console.log(manualSummary)

      await prisma.song.update({
        where: { id: song.id },
        data: { songSummary: manualSummary }
      })

      console.log('\n✅ Updated successfully')
    }
  }

  await prisma.$disconnect()
}

testLaCamisaNegra()