#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function checkSong() {
  const song = await prisma.song.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      artist: true,
      previewUrl: true,
      spotifyId: true,
      lyricsRaw: true
    }
  })

  if (!song) {
    console.log('No active songs found')
    return
  }

  console.log('Song:', song.title, 'by', song.artist)
  console.log('ID:', song.id)
  console.log('Preview URL:', song.previewUrl || 'NONE')
  console.log('Spotify ID:', song.spotifyId || 'NONE')

  if (song.lyricsRaw) {
    const lyrics = JSON.parse(song.lyricsRaw as string)
    console.log('Has synchronized data:', !!lyrics.synchronized)
    if (lyrics.synchronized) {
      console.log('Sync format:', lyrics.synchronized.format)
      console.log('Line count:', lyrics.synchronized.lines?.length)
      console.log('Duration:', lyrics.synchronized.duration, 'ms')
    }
  }

  await prisma.$disconnect()
}

checkSong().catch(console.error)