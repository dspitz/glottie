#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function updateSummary() {
  // Find La Bamba song
  const song = await prisma.song.findFirst({
    where: {
      id: 'cmfm3ztwq00008mv3palj7g00'
    }
  })

  if (!song) {
    console.log('La Bamba not found')
    return
  }

  console.log('Found song:', song.title, 'by', song.artist)
  console.log('Current summary word count: 97 words')

  // New concise summary (36 words or less)
  const conciseSummary = "Traditional Mexican folk song celebrating dance and joy. Ritchie Valens transformed it into rock and roll in 1958, bridging cultures. The lyrics emphasize grace, rhythm, and rising up—becoming a timeless symbol of Chicano pride."

  // Count words to verify
  const wordCount = conciseSummary.split(/\s+/).length
  console.log(`New summary word count: ${wordCount} words`)

  await prisma.song.update({
    where: { id: song.id },
    data: { songSummary: conciseSummary }
  })

  console.log('✅ Updated La Bamba with concise summary')
  console.log('Summary:', conciseSummary)

  await prisma.$disconnect()
}

updateSummary()