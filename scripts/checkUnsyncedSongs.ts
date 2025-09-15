#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function checkUnsyncedSongs() {
  console.log('🔍 Checking for songs without synchronized lyrics...\n')

  try {
    const songs = await prisma.song.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        artist: true,
        lyricsProvider: true,
        lyricsRaw: true
      }
    })

    const unsyncedSongs: Array<{title: string, artist: string, provider: string}> = []
    const syncedSongs: Array<{title: string, artist: string}> = []

    for (const song of songs) {
      let hasSync = false

      if (song.lyricsRaw) {
        try {
          const lyricsData = JSON.parse(song.lyricsRaw)
          hasSync = !!(lyricsData.synchronized &&
                      lyricsData.synchronized.lines &&
                      lyricsData.synchronized.lines.length > 0)
        } catch (e) {
          // Not JSON, so no sync data
          hasSync = false
        }
      }

      if (hasSync) {
        syncedSongs.push({
          title: song.title,
          artist: song.artist
        })
      } else {
        unsyncedSongs.push({
          title: song.title,
          artist: song.artist,
          provider: song.lyricsProvider || 'none'
        })
      }
    }

    console.log('📊 Summary:')
    console.log(`✅ Songs with synchronized lyrics: ${syncedSongs.length}`)
    console.log(`❌ Songs WITHOUT synchronized lyrics: ${unsyncedSongs.length}`)
    console.log('\n' + '='.repeat(60) + '\n')

    if (unsyncedSongs.length > 0) {
      console.log('🚫 Songs WITHOUT synchronized lyrics:\n')
      unsyncedSongs.forEach((song, index) => {
        console.log(`${index + 1}. "${song.title}" by ${song.artist}`)
        console.log(`   Provider: ${song.provider}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUnsyncedSongs().catch(console.error)