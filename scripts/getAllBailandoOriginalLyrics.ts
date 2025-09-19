#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function getAllOriginalLyrics() {
  const song = await prisma.song.findUnique({
    where: { id: 'cmfm3ztww00048mv3y4sn8tpl' }
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

  console.log('ALL ORIGINAL LYRICS:')
  console.log('====================')
  originalLines.forEach((line, i) => {
    console.log(`${i+1}. ${line}`)
  })

  console.log('\nTotal lines:', originalLines.length)

  await prisma.$disconnect()
}

getAllOriginalLyrics().catch(console.error)