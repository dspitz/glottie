#!/usr/bin/env tsx

/**
 * Batch Hydration Script for Level 5 Songs
 *
 * Processes all Level 5 songs with comprehensive hydration including:
 * - Spotify metadata (albumArt, previewUrl, popularity, audio features)
 * - Musixmatch lyrics (with PAID API for full synchronized lyrics)
 * - OpenAI translations (line-by-line English translations)
 * - Song summaries (36 words max AI-generated summaries)
 * - Color extraction from album artwork
 *
 * Usage:
 *   npx tsx scripts/batchHydrateLevel5.ts
 *   npx tsx scripts/batchHydrateLevel5.ts --dry-run
 *   npx tsx scripts/batchHydrateLevel5.ts --force
 *   npx tsx scripts/batchHydrateLevel5.ts --continue-from-index 5
 *
 * Environment variables required:
 *   - DATABASE_URL
 *   - SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET
 *   - MUSIXMATCH_API_KEY (paid license for full lyrics)
 *   - TRANSLATOR=openai
 *   - OPENAI_API_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { prisma } from '../lib/prisma'
import { hydrateSong, HydrationOptions, HydrationStats } from './songHydration'

interface BatchResults {
  totalSongs: number
  processed: number
  successful: number
  failed: number
  skipped: number
  errors: Array<{ songId: string; title: string; error: string }>
  startTime: Date
  endTime?: Date
}

async function getLevel5SongsNeedingHydration(force: boolean = false): Promise<Array<{
  id: string
  title: string
  artist: string
  spotifyId: string | null
  order: number | null
  missingFields: string[]
}>> {

  const songs = await prisma.song.findMany({
    where: {
      level: 5,
      isActive: true
    },
    include: {
      translations: {
        where: { targetLang: 'en' }
      }
    },
    orderBy: [
      { order: 'asc' },
      { title: 'asc' }
    ]
  })

  const needingHydration = songs.map(song => {
    const missingFields: string[] = []

    // Check what's missing
    if (!song.albumArt) missingFields.push('albumArt')
    if (!song.previewUrl) missingFields.push('previewUrl')
    if (!song.popularity) missingFields.push('popularity')
    if (!song.danceability) missingFields.push('audioFeatures')
    if (!song.lyricsRaw) missingFields.push('lyricsRaw')
    if (song.translations.length === 0) missingFields.push('translation-en')
    if (!song.songSummary) missingFields.push('songSummary')
    if (!song.albumArtColor && song.albumArt) missingFields.push('albumArtColor')

    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      spotifyId: song.spotifyId,
      order: song.order,
      missingFields
    }
  })

  // Return all songs if force mode, or only those missing data
  return force ? needingHydration : needingHydration.filter(song => song.missingFields.length > 0)
}

async function batchHydrateLevel5Songs(options: HydrationOptions & {
  continueFromIndex?: number
} = {}): Promise<BatchResults> {

  const results: BatchResults = {
    totalSongs: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    startTime: new Date()
  }

  try {
    console.log('🚀 Level 5 Songs Batch Hydration Pipeline')
    console.log('=' + '='.repeat(60))
    console.log(`Started at: ${results.startTime.toISOString()}`)

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made')
    }
    if (options.force) {
      console.log('💪 FORCE MODE - Will update even if data exists')
    }
    console.log()

    // Get songs that need hydration
    const songs = await getLevel5SongsNeedingHydration(options.force)
    results.totalSongs = songs.length

    if (songs.length === 0) {
      console.log('✅ All Level 5 songs are already fully hydrated!')
      return results
    }

    console.log(`📋 Found ${songs.length} Level 5 songs needing hydration:`)
    songs.forEach((song, index) => {
      const status = song.missingFields.length === 0 ? '(force mode)' : `(missing: ${song.missingFields.join(', ')})`
      console.log(`   ${index + 1}. "${song.title}" by ${song.artist} ${status}`)
    })
    console.log()

    // Continue from specific index if requested
    const startIndex = options.continueFromIndex || 0
    if (startIndex > 0) {
      console.log(`⏭️ Continuing from index ${startIndex}...`)
    }

    // Process each song
    for (let i = startIndex; i < songs.length; i++) {
      const song = songs[i]

      console.log(`\n[${ i + 1 }/${songs.length}] Processing "${song.title}" by ${song.artist}`)
      console.log(`Song ID: ${song.id}`)
      console.log(`Spotify ID: ${song.spotifyId || 'MISSING'}`)
      console.log(`Order: ${song.order || 'None'}`)

      if (song.missingFields.length > 0) {
        console.log(`Missing fields: ${song.missingFields.join(', ')}`)
      }

      try {
        const hydrationStats = await hydrateSong(song.id, options)
        results.processed++

        if (hydrationStats.errors.length === 0) {
          results.successful++
          console.log(`✅ Successfully hydrated "${song.title}"`)
        } else {
          results.failed++
          const errorSummary = hydrationStats.errors.join('; ')
          results.errors.push({
            songId: song.id,
            title: song.title,
            error: errorSummary
          })
          console.log(`⚠️ Partial hydration for "${song.title}": ${errorSummary}`)
        }

        // Rate limiting between requests
        if (i < songs.length - 1) {
          console.log('⏱️ Waiting 2 seconds before next song...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : String(error)
        results.errors.push({
          songId: song.id,
          title: song.title,
          error: errorMessage
        })
        console.error(`❌ Failed to hydrate "${song.title}": ${errorMessage}`)

        // Continue with next song on error
        continue
      }
    }

  } catch (error) {
    console.error('❌ Fatal error in batch hydration:', error)
    throw error
  }

  results.endTime = new Date()
  return results
}

function printBatchSummary(results: BatchResults) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 BATCH HYDRATION SUMMARY')
  console.log('='.repeat(60))

  const duration = results.endTime
    ? Math.round((results.endTime.getTime() - results.startTime.getTime()) / 1000)
    : 0

  console.log(`⏱️ Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`)
  console.log(`📊 Total songs: ${results.totalSongs}`)
  console.log(`✅ Successful: ${results.successful}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⏭️ Skipped: ${results.skipped}`)
  console.log(`📈 Success rate: ${results.totalSongs > 0 ? Math.round((results.successful / results.totalSongs) * 100) : 0}%`)

  if (results.errors.length > 0) {
    console.log(`\n🚨 Errors encountered:`)
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. "${error.title}" (${error.songId}):`)
      console.log(`      ${error.error}`)
    })
  }

  if (results.successful > 0) {
    console.log(`\n🎉 Successfully hydrated ${results.successful} Level 5 songs!`)
  }

  if (results.failed > 0) {
    console.log(`\n💡 Recommendations:`)
    console.log(`   1. Check API keys and quotas for failed songs`)
    console.log(`   2. Verify Spotify IDs for songs without metadata`)
    console.log(`   3. Re-run with --force to retry failed songs`)
    console.log(`   4. Use --continue-from-index to resume from specific song`)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Level 5 Songs Batch Hydration Script
====================================

Usage:
  npx tsx scripts/batchHydrateLevel5.ts [options]

Options:
  --dry-run             Preview changes without applying them
  --force               Update all songs even if data exists
  --continue-from-index N   Start processing from song at index N (0-based)
  --verbose             Show detailed progress information
  --help, -h            Show this help message

Examples:
  npx tsx scripts/batchHydrateLevel5.ts
  npx tsx scripts/batchHydrateLevel5.ts --dry-run
  npx tsx scripts/batchHydrateLevel5.ts --force
  npx tsx scripts/batchHydrateLevel5.ts --continue-from-index 5

Environment Variables Required:
  DATABASE_URL                 - SQLite database path
  SPOTIFY_CLIENT_ID           - Spotify API credentials
  SPOTIFY_CLIENT_SECRET       - Spotify API credentials
  MUSIXMATCH_API_KEY          - Musixmatch API (PAID for full lyrics)
  TRANSLATOR=openai           - Translation provider
  OPENAI_API_KEY              - OpenAI API for translations and summaries

Note: Make sure you have sufficient API quotas before running on all songs.
`)
    process.exit(0)
  }

  const options: HydrationOptions & { continueFromIndex?: number } = {
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose')
  }

  // Parse continue-from-index
  const continueIndex = args.findIndex(arg => arg === '--continue-from-index')
  if (continueIndex !== -1 && args[continueIndex + 1]) {
    const index = parseInt(args[continueIndex + 1], 10)
    if (!isNaN(index) && index >= 0) {
      options.continueFromIndex = index
    } else {
      console.error('❌ Invalid continue-from-index value. Must be a non-negative integer.')
      process.exit(1)
    }
  }

  // Verify environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'MUSIXMATCH_API_KEY',
    'OPENAI_API_KEY'
  ]

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingEnvVars.forEach(envVar => {
      console.error(`   - ${envVar}`)
    })
    console.error('\nPlease set these variables in your .env.local file')
    process.exit(1)
  }

  if (process.env.TRANSLATOR !== 'openai') {
    console.warn('⚠️ TRANSLATOR is not set to "openai". This may affect translation quality.')
  }

  try {
    const results = await batchHydrateLevel5Songs(options)
    printBatchSummary(results)

    // Exit with appropriate code
    if (results.failed > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { batchHydrateLevel5Songs, getLevel5SongsNeedingHydration, BatchResults }