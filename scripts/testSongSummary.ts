#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function test() {
  // Find a song with translations
  const song = await prisma.song.findFirst({
    where: {
      translations: {
        some: {
          targetLang: 'en'
        }
      }
    },
    include: {
      translations: true
    }
  })

  if (!song) {
    console.log('No songs with translations found')
    return
  }

  console.log('Found song:', song.id, song.title, 'by', song.artist)
  console.log('Current songSummary:', song.songSummary)
  console.log('Has translation:', song.translations.length > 0)

  await prisma.$disconnect()
}

test()