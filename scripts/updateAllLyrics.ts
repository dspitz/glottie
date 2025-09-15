#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'
import { getLyricsByTrack } from '../packages/adapters/lyricsProvider'

async function updateAllLyrics() {
  console.log('🎵 Starting clean lyrics update for all songs...')

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
        lyricsProvider: true
      }
    })

    console.log(`📊 Found ${songs.length} active songs to update`)

    let successCount = 0
    let syncedCount = 0
    let failedCount = 0

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i]
      const progress = `[${i + 1}/${songs.length}]`

      try {
        console.log(`\n${progress} Fetching lyrics for "${song.title}" by ${song.artist}`)

        // Fetch fresh lyrics with synchronized data
        const lyricsResult = await getLyricsByTrack(song.artist, song.title)

        if (lyricsResult.lines.length > 0) {
          // Check if we got synchronized data
          const hasSyncData = lyricsResult.synchronized &&
                             lyricsResult.synchronized.lines &&
                             lyricsResult.synchronized.lines.length > 0

          if (hasSyncData) {
            console.log(`  ✅ Found synchronized lyrics (${lyricsResult.synchronized.format} format)`)
            syncedCount++
          } else {
            console.log(`  ⚠️ Found lyrics but no sync data (provider: ${lyricsResult.provider})`)
          }

          // Update the song with new lyrics data
          await prisma.song.update({
            where: { id: song.id },
            data: {
              lyricsRaw: JSON.stringify(lyricsResult),
              lyricsProvider: lyricsResult.provider,
              lyricsLicensed: lyricsResult.licensed
            }
          })

          successCount++
          console.log(`  💾 Updated in database`)
        } else {
          console.log(`  ❌ No lyrics found: ${lyricsResult.error || 'Unknown error'}`)
          failedCount++
        }

        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`  ❌ Error updating song ${song.id}:`, error)
        failedCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Update Complete!')
    console.log(`✅ Successfully updated: ${successCount} songs`)
    console.log(`🎵 Songs with sync data: ${syncedCount}`)
    console.log(`❌ Failed updates: ${failedCount}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updateAllLyrics().catch(console.error)