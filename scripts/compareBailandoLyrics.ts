#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function compareLyrics() {
  const song = await prisma.song.findUnique({
    where: { id: 'cmfm3ztww00048mv3y4sn8tpl' },
    include: { translations: true }
  })

  if (!song || !song.lyricsRaw) {
    console.log('Song not found')
    return
  }

  // Parse original lyrics
  let originalLines: string[] = []
  try {
    const parsed = JSON.parse(song.lyricsRaw)
    originalLines = parsed.lines || []
  } catch {
    originalLines = song.lyricsRaw.split('\n')
  }

  // Get manual translation
  const manualTranslation = song.translations.find(t => t.provider === 'manual')
  let translatedLines: string[] = []
  if (manualTranslation) {
    translatedLines = JSON.parse(manualTranslation.lyricsLines)
  }

  console.log('COMPARISON OF FIRST 20 LINES:')
  console.log('================================')
  for (let i = 0; i < Math.min(20, originalLines.length); i++) {
    console.log(`Line ${i+1}:`)
    console.log(`  Original: "${originalLines[i]}"`)
    console.log(`  Translation: "${translatedLines[i] || 'MISSING'}"`)
    console.log('')
  }

  // Show a sample from the middle
  console.log('\nSAMPLE FROM MIDDLE (lines 40-45):')
  console.log('===================================')
  for (let i = 39; i < Math.min(45, originalLines.length); i++) {
    console.log(`Line ${i+1}:`)
    console.log(`  Original: "${originalLines[i]}"`)
    console.log(`  Translation: "${translatedLines[i] || 'MISSING'}"`)
    console.log('')
  }

  await prisma.$disconnect()
}

compareLyrics().catch(console.error)