#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function cleanupIncompleteSongs() {
  console.log('🧹 Starting cleanup of songs without full lyrics or sync data...')

  try {
    // Get all songs from the database
    const songs = await prisma.song.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        artist: true,
        lyricsRaw: true,
        lyricsProvider: true
      }
    })

    console.log(`📊 Found ${songs.length} active songs to check`)

    const songsToDelete: Array<{ id: string, title: string, artist: string, reason: string }> = []

    for (const song of songs) {
      let shouldDelete = false
      let reason = ''

      if (!song.lyricsRaw) {
        shouldDelete = true
        reason = 'No lyrics data'
      } else {
        try {
          const lyricsData = JSON.parse(song.lyricsRaw as string)

          // Check if song has synchronized data
          const hasSyncData = lyricsData.synchronized?.lines?.length > 0

          // Check if song has full lyrics (more than 5 lines)
          const hasFullLyrics = lyricsData.lines?.length > 5

          if (!hasSyncData) {
            shouldDelete = true
            reason = 'No synchronized lyrics data'
          } else if (!hasFullLyrics) {
            shouldDelete = true
            reason = `Only ${lyricsData.lines?.length || 0} lines (excerpt only)`
          }
        } catch (error) {
          shouldDelete = true
          reason = 'Invalid lyrics data format'
        }
      }

      if (shouldDelete) {
        songsToDelete.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          reason
        })
      }
    }

    console.log(`\n🔍 Found ${songsToDelete.length} songs to delete:\n`)

    // Display songs that will be deleted
    songsToDelete.forEach((song, index) => {
      console.log(`${index + 1}. "${song.title}" by ${song.artist}`)
      console.log(`   Reason: ${song.reason}`)
    })

    if (songsToDelete.length > 0) {
      console.log('\n⚠️  Deleting these songs...')

      // Delete the songs
      const deleteResult = await prisma.song.deleteMany({
        where: {
          id: {
            in: songsToDelete.map(s => s.id)
          }
        }
      })

      console.log(`\n✅ Successfully deleted ${deleteResult.count} songs`)
    } else {
      console.log('\n✅ All songs have full lyrics with sync data!')
    }

    // Show remaining song count
    const remainingCount = await prisma.song.count({
      where: { isActive: true }
    })

    console.log(`\n📊 Remaining songs in library: ${remainingCount}`)

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupIncompleteSongs().catch(console.error)