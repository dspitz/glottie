#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function testSummaryDisplay() {
  // Find La Bamba song
  const song = await prisma.song.findFirst({
    where: {
      title: 'La Bamba'
    }
  })

  if (!song) {
    console.log('La Bamba not found')
    return
  }

  console.log('Found song:', song.id, song.title, 'by', song.artist)
  console.log('Current songSummary:', song.songSummary)

  // Update with a test summary to see if UI displays it correctly
  const testSummary = "La Bamba is a traditional Mexican folk song that celebrates dancing and joy. The repetitive lyrics emphasize that to dance 'La Bamba,' one needs a little bit of grace and rhythm. The song's message is about confidence, celebration, and cultural pride. Ritchie Valens transformed this traditional song into a rock and roll hit in 1958, bridging Mexican and American cultures. The lyrics speak of rising up ('yo no soy marinero, soy capitán' - 'I am not a sailor, I am a captain'), symbolizing ambition and self-determination. This upbeat anthem became a symbol of Chicano culture and remains a timeless party favorite."

  await prisma.song.update({
    where: { id: song.id },
    data: { songSummary: testSummary }
  })

  console.log('✅ Updated song with test summary')
  console.log('Summary:', testSummary)

  await prisma.$disconnect()
}

testSummaryDisplay()