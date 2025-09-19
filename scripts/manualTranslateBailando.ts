#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function manualTranslateBailando() {
  const songId = 'cmfm3ztww00048mv3y4sn8tpl'

  // Manual translations for Bailando
  const manualTranslations = [
    "Ha, ha, ha, ha",
    "Enrique Iglesias",
    "One love, one love",
    "Gente de Zona",
    "Descemer",
    "I look at you and my breath stops",
    "When you look at me, my heart rises",
    "(My heart beats slowly)",
    "And in silence your gaze says a thousand words (uh)",
    "The night when I beg you not to let the sun rise",
    "Dancing (dancing)",
    "Dancing (dancing)",
    "Your body and mine filling the void",
    "Submerged in a love that sailed",
    "Dancing (dancing)",
    "Dancing (dancing)",
    "That fire inside that's burning me",
    "And it's taking me to start again",
    "With your physics and your chemistry",
    "Also your anatomy, the beer and the tequila",
    "And your mouth with mine",
    "You and I stuck, you and I stuck",
    "With your physics and your chemistry",
    "Also your anatomy, the beer and the tequila",
    "And your mouth with mine",
    "You and I stuck, you and I stuck",
    "(Gente de Zona)",
    "I want to be with you, live with you",
    "Dance with you, have with you",
    "A night that's crazy (a night that's crazy)",
    "Oh, crazy night (oh, crazy night)",
    "I want to be with you, live with you",
    "Dance with you, have with you",
    "A night that's crazy",
    "With tremendous craziness",
    "Oh oh oh oh",
    "You look at me and take me to another dimension",
    "(I'm flying)",
    "Your heartbeat accelerates the heart",
    "(Your eyes make me fall in love)",
    "When you dance to the rhythm of the drums",
    "(This is how I like it)",
    "Latina's flavor",
    "(And the night we lived, oh)",
    "The night when I beg you not to let the sun rise",
    "Dancing (dancing)",
    "Dancing (dancing)",
    "Your body and mine filling the void",
    "Submerged in a love that sailed",
    "Dancing (dancing)",
    "Dancing (dancing)",
    "That fire inside that's burning me",
    "And it's taking me to start again",
    "With your physics and your chemistry",
    "Also your anatomy, the beer and the tequila",
    "And your mouth with mine",
    "You and I stuck, you and I stuck (oh)",
    "With your physics and your chemistry",
    "Also your anatomy, the beer and the tequila",
    "And your mouth with mine",
    "You and I stuck, you and I stuck (Descemer)",
    "I want to be with you, live with you",
    "Dance with you, have with you",
    "A night that's crazy (a night that's crazy)",
    "(I want to be with you) live with you",
    "(Dance with you) have with you",
    "A night that's crazy",
    "With tremendous craziness",
    "Oh oh oh oh",
    "Dancing, dancing, dancing, dancing",
    "Dancing, oh",
    "Oh, eh, oh",
    "You and I dancing (oh)",
    "(Dancing) I want to live with you",
    "I want to be with you (oh)",
    "Dancing, dancing",
    "Dancing, dancing",
    "Dancing, dancing",
    "Dancing, dancing",
    "Dancing, dancing, dancing"
  ]

  // Get the song
  const song = await prisma.song.findUnique({
    where: { id: songId }
  })

  if (!song || !song.lyricsRaw) {
    console.log('Song not found or no lyrics')
    return
  }

  // Parse original lyrics to ensure we have the right count
  let originalLines: string[] = []
  try {
    const parsed = JSON.parse(song.lyricsRaw)
    if (parsed.lines && Array.isArray(parsed.lines)) {
      originalLines = parsed.lines
    }
  } catch {
    console.log('Could not parse lyrics')
    return
  }

  console.log(`Original has ${originalLines.length} lines`)
  console.log(`We have ${manualTranslations.length} translations`)

  if (originalLines.length !== manualTranslations.length) {
    console.error('Mismatch! Original has', originalLines.length, 'but we have', manualTranslations.length, 'translations')
    return
  }

  // Delete existing translation
  await prisma.translation.deleteMany({
    where: {
      songId: songId,
      targetLang: 'en'
    }
  })

  // Create new translation with manual translations
  await prisma.translation.create({
    data: {
      songId: songId,
      targetLang: 'en',
      lyricsLines: JSON.stringify(manualTranslations),
      title: 'Dancing',
      provider: 'manual',
      confidence: 1.0
    }
  })

  console.log('✅ Successfully saved manual translation for Bailando')
  console.log('✅ All 80 lines properly translated to English')

  // Show a few examples
  console.log('\nExamples:')
  console.log('Line 6: "', originalLines[5], '" -> "', manualTranslations[5], '"')
  console.log('Line 11: "', originalLines[10], '" -> "', manualTranslations[10], '"')
  console.log('Line 13: "', originalLines[12], '" -> "', manualTranslations[12], '"')

  await prisma.$disconnect()
}

manualTranslateBailando().catch(console.error)