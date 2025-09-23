#!/usr/bin/env tsx

/**
 * Check Level 5 Songs Hydration Status
 *
 * Analyzes all Level 5 songs and identifies which ones need:
 * - Spotify metadata (albumArt, previewUrl, etc.)
 * - Lyrics (lyricsRaw)
 * - Translations (English)
 * - Song summaries (songSummary)
 * - Color extraction (albumArtColor)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { prisma } from '../lib/prisma'

interface HydrationStatus {
  id: string
  title: string
  artist: string
  spotifyId: string | null
  needsSpotifyData: boolean
  needsLyrics: boolean
  needsTranslation: boolean
  needsSummary: boolean
  needsColorExtraction: boolean
  missingFields: string[]
}

async function checkLevel5Hydration() {
  console.log('🔍 Checking Level 5 Songs Hydration Status')
  console.log('=' + '='.repeat(50))

  // Get all Level 5 songs
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

  console.log(`\nFound ${songs.length} Level 5 songs\n`)

  const hydrationStatuses: HydrationStatus[] = []
  let totalNeedingHydration = 0

  for (const song of songs) {
    const missingFields: string[] = []

    // Check Spotify data
    const needsSpotifyData = !song.albumArt || !song.previewUrl || !song.popularity || !song.danceability
    if (needsSpotifyData) {
      if (!song.albumArt) missingFields.push('albumArt')
      if (!song.previewUrl) missingFields.push('previewUrl')
      if (!song.popularity) missingFields.push('popularity')
      if (!song.danceability) missingFields.push('audioFeatures')
    }

    // Check lyrics
    const needsLyrics = !song.lyricsRaw
    if (needsLyrics) {
      missingFields.push('lyricsRaw')
    }

    // Check translation
    const needsTranslation = song.translations.length === 0
    if (needsTranslation) {
      missingFields.push('translation-en')
    }

    // Check song summary
    const needsSummary = !song.songSummary
    if (needsSummary) {
      missingFields.push('songSummary')
    }

    // Check color extraction
    const needsColorExtraction = !song.albumArtColor && song.albumArt
    if (needsColorExtraction) {
      missingFields.push('albumArtColor')
    }

    const status: HydrationStatus = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      spotifyId: song.spotifyId,
      needsSpotifyData,
      needsLyrics,
      needsTranslation,
      needsSummary,
      needsColorExtraction,
      missingFields
    }

    hydrationStatuses.push(status)

    if (missingFields.length > 0) {
      totalNeedingHydration++
    }
  }

  // Display results
  console.log(`📊 Hydration Status Summary:`)
  console.log(`   Total songs: ${songs.length}`)
  console.log(`   Fully hydrated: ${songs.length - totalNeedingHydration}`)
  console.log(`   Need hydration: ${totalNeedingHydration}`)
  console.log()

  // Group by missing fields
  const fieldCounts = {
    albumArt: 0,
    previewUrl: 0,
    popularity: 0,
    audioFeatures: 0,
    lyricsRaw: 0,
    'translation-en': 0,
    songSummary: 0,
    albumArtColor: 0
  }

  hydrationStatuses.forEach(status => {
    status.missingFields.forEach(field => {
      if (field in fieldCounts) {
        fieldCounts[field as keyof typeof fieldCounts]++
      }
    })
  })

  console.log('📈 Missing Data Breakdown:')
  Object.entries(fieldCounts).forEach(([field, count]) => {
    if (count > 0) {
      console.log(`   ${field}: ${count} songs`)
    }
  })
  console.log()

  // Show songs that need hydration
  const needingHydration = hydrationStatuses.filter(s => s.missingFields.length > 0)

  if (needingHydration.length > 0) {
    console.log('🚨 Songs Needing Hydration:')
    console.log('-'.repeat(80))

    needingHydration.forEach((status, index) => {
      console.log(`${index + 1}. "${status.title}" by ${status.artist}`)
      console.log(`   ID: ${status.id}`)
      console.log(`   Spotify ID: ${status.spotifyId || 'MISSING'}`)
      console.log(`   Missing: ${status.missingFields.join(', ')}`)
      console.log()
    })

    console.log('💡 Recommended Actions:')
    console.log('1. Run batch hydration script for all Level 5 songs')
    console.log('2. Check songs without Spotify IDs manually')
    console.log('3. Verify Musixmatch API quota for lyrics')
    console.log('4. Ensure OpenAI API key is available for translations and summaries')
    console.log()

    // Generate song IDs for batch processing
    const songIds = needingHydration.map(s => s.id)
    console.log('🔧 Song IDs for batch processing:')
    console.log(songIds.join(' '))
    console.log()

  } else {
    console.log('✅ All Level 5 songs are fully hydrated!')
  }

  return {
    totalSongs: songs.length,
    fullyHydrated: songs.length - totalNeedingHydration,
    needingHydration: totalNeedingHydration,
    songIds: needingHydration.map(s => s.id),
    statuses: hydrationStatuses
  }
}

// Main execution
async function main() {
  try {
    const results = await checkLevel5Hydration()

    if (results.needingHydration > 0) {
      process.exit(1) // Exit with error code if hydration needed
    } else {
      process.exit(0) // Success
    }
  } catch (error) {
    console.error('❌ Error checking hydration status:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { checkLevel5Hydration, HydrationStatus }