#!/usr/bin/env tsx

/**
 * Batch Hydration Script - Process all songs that need hydration
 * Runs songHydration.ts on multiple songs in parallel batches
 */

import { prisma } from '../lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function getSongsNeedingHydration() {
  const songs = await prisma.song.findMany({
    where: {
      isActive: true,
      OR: [
        { albumArtColor: null },
        { lyricsRaw: null },
        { translations: { none: { targetLang: 'en' } } }
      ]
    },
    select: {
      id: true,
      title: true,
      artist: true,
      albumArtColor: true,
      lyricsRaw: true,
      translations: {
        where: { targetLang: 'en' },
        select: { id: true }
      }
    },
    orderBy: [
      { level: 'asc' },
      { order: 'asc' }
    ]
  })

  return songs
}

async function hydrateSongBatch(songIds: string[]) {
  const promises = songIds.map(async (songId) => {
    const env = {
      DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
      SPOTIFY_CLIENT_ID: "074c9198ca534a588df3b95c7eaf2e98",
      SPOTIFY_CLIENT_SECRET: "b6911b7446704d61acdb47af4d2c2489",
      MUSIXMATCH_API_KEY: "b6bdee9e895ac0d91209a79a31498440",
      MUSIXMATCH_FULL_LYRICS: "true",
      GENIUS_CLIENT_ID: "XiUSsRid9NDylXKWJKF6W7wnYOS-t9K_JsmLFcKT5V4aNHzsUh3IZ43OJ6Jda98c",
      GENIUS_CLIENT_SECRET: "YAe4Kgo2KTpRC46HQebiDaYC8LPf43OTkeZJWm_NQK3g-nqCyw7dclt5uDKzpVLSOlpDI1MLL7vIdzz3HlhHPw",
      TRANSLATOR: "deepl",
      DEEPL_API_KEY: "d82b7daf-ac15-4795-a5bc-79cd7014daae:fx"
    }

    const envString = Object.entries(env).map(([k, v]) => `${k}="${v}"`).join(' ')

    try {
      console.log(`  🎵 Starting hydration for ${songId}`)
      const { stdout, stderr } = await execAsync(
        `${envString} npx tsx scripts/songHydration.ts --force ${songId}`,
        { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
      )

      // Extract success/error from output
      if (stdout.includes('✅')) {
        console.log(`  ✅ Completed ${songId}`)
        return { songId, success: true }
      } else {
        console.log(`  ⚠️ Partial success for ${songId}`)
        return { songId, success: true, partial: true }
      }
    } catch (error) {
      console.error(`  ❌ Failed ${songId}:`, error)
      return { songId, success: false, error }
    }
  })

  return Promise.all(promises)
}

async function main() {
  console.log('🚀 Batch Hydration Pipeline')
  console.log('=' + '='.repeat(60))

  try {
    // Get songs needing hydration
    const songs = await getSongsNeedingHydration()

    console.log(`\n📊 Songs needing hydration: ${songs.length}`)

    if (songs.length === 0) {
      console.log('✅ All songs are fully hydrated!')
      return
    }

    // Show what needs updating
    const missingColor = songs.filter(s => !s.albumArtColor).length
    const missingLyrics = songs.filter(s => !s.lyricsRaw).length
    const missingTranslations = songs.filter(s => s.translations.length === 0).length

    console.log(`  Missing color: ${missingColor}`)
    console.log(`  Missing lyrics: ${missingLyrics}`)
    console.log(`  Missing translations: ${missingTranslations}`)

    // Process in batches of 3
    const BATCH_SIZE = 3
    const songIds = songs.map(s => s.id)

    console.log(`\n🔄 Processing ${songIds.length} songs in batches of ${BATCH_SIZE}...`)
    console.log(`⏱️ Estimated time: ${Math.ceil(songIds.length / BATCH_SIZE) * 50} seconds\n`)

    let successCount = 0
    let partialCount = 0
    let failCount = 0

    for (let i = 0; i < songIds.length; i += BATCH_SIZE) {
      const batch = songIds.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(songIds.length / BATCH_SIZE)

      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} songs)`)
      console.log('-'.repeat(40))

      const results = await hydrateSongBatch(batch)

      // Count results
      results.forEach(r => {
        if (r.success && !r.partial) successCount++
        else if (r.success && r.partial) partialCount++
        else failCount++
      })

      // Pause between batches to respect rate limits
      if (i + BATCH_SIZE < songIds.length) {
        console.log('⏳ Pausing 3 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('🎉 Batch Hydration Complete!')
    console.log(`✅ Fully successful: ${successCount}`)
    console.log(`⚠️ Partial success: ${partialCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log(`📊 Success rate: ${Math.round((successCount + partialCount) / songIds.length * 100)}%`)

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

if (require.main === module) {
  main()
}

export { main as batchHydrate }