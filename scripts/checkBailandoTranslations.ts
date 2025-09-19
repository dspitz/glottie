#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function checkBailando() {
  const song = await prisma.song.findUnique({
    where: { id: 'cmfm3ztww00048mv3y4sn8tpl' },
    include: { translations: true }
  })

  if (!song) {
    console.log('Song not found!')
    return
  }

  console.log('Song:', song.title, 'by', song.artist)
  console.log('Lyrics provider:', song.lyricsProvider)
  console.log('Has lyrics:', !!song.lyricsRaw)

  // Check lyrics format
  if (song.lyricsRaw) {
    try {
      const parsed = JSON.parse(song.lyricsRaw)
      console.log('Lyrics format: JSON')
      console.log('Has lines:', !!parsed.lines)
      console.log('Has synchronized:', !!parsed.synchronized)
      if (parsed.lines) {
        console.log('Total lines:', parsed.lines.length)
        console.log('First 3 lines:', parsed.lines.slice(0, 3))
      }
    } catch {
      console.log('Lyrics format: Plain text')
    }
  }

  console.log('\nTranslations:', song.translations.length)

  for (const trans of song.translations) {
    console.log('\nTranslation to:', trans.targetLang)
    console.log('Provider:', trans.provider)
    console.log('Confidence:', trans.confidence)

    try {
      const lines = JSON.parse(trans.lyricsLines)
      console.log('Total translated lines:', lines.length)
      console.log('First 10 translations:')
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const original = JSON.parse(song.lyricsRaw).lines[i]
        console.log(`  ${i+1}. "${original}" -> "${lines[i]}"`)
      }

      // Check for Spanish text in translations
      const spanishWords = ['bailando', 'corazón', 'cuando', 'contigo', 'quiero', 'noche', 'cuerpo']
      const spanishInTranslations = lines.filter((line: string) =>
        spanishWords.some(word => line.toLowerCase().includes(word))
      ).length

      console.log('\nLines that still contain Spanish words:', spanishInTranslations, '/', lines.length)

      // Show which lines are still in Spanish
      if (spanishInTranslations > 0) {
        console.log('\nExamples of untranslated lines:')
        lines.forEach((line: string, index: number) => {
          if (spanishWords.some(word => line.toLowerCase().includes(word))) {
            if (index < 20) { // Show first 20 examples
              console.log(`  Line ${index + 1}: "${line}"`)
            }
          }
        })
      }
    } catch (e: any) {
      console.log('Error parsing translations:', e.message)
    }
  }

  await prisma.$disconnect()
}

checkBailando().catch(console.error)