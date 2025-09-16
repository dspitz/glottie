#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'
import { getLyricsByTrack } from '../packages/adapters/lyricsProvider'

interface LyricsStats {
  total: number
  musixmatchSuccess: number
  geniusSuccess: number
  publicDomainSuccess: number
  failed: number
  synchronizedCount: number
}

async function curatedLyricsAcquisition() {
  console.log('🎵 Curated Lyrics Acquisition for 100 Spanish Learning Songs')
  console.log('=' + '='.repeat(70))

  try {
    // Get curated songs that need lyrics
    const songs = await prisma.song.findMany({
      where: {
        level: { in: [1, 2, 3, 4, 5] },
        isActive: true,
        lyricsRaw: null
      },
      select: {
        id: true,
        title: true,
        artist: true,
        level: true,
        levelName: true,
        order: true
      },
      orderBy: [
        { level: 'asc' },
        { order: 'asc' }
      ]
    })

    console.log(`📊 Found ${songs.length} curated songs needing lyrics`)

    if (songs.length === 0) {
      console.log('✅ All curated songs already have lyrics!')
      return
    }

    const stats: LyricsStats = {
      total: songs.length,
      musixmatchSuccess: 0,
      geniusSuccess: 0,
      publicDomainSuccess: 0,
      failed: 0,
      synchronizedCount: 0
    }

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i]
      const progress = `[${i + 1}/${songs.length}]`

      try {
        console.log(`${progress} Level ${song.level} (${song.levelName}): "${song.title}" by ${song.artist}`)

        // Get lyrics using the existing provider system
        const lyricsResult = await getLyricsByTrack(song.artist, song.title)

        if (lyricsResult.error) {
          console.log(`  ❌ Failed: ${lyricsResult.error}`)
          stats.failed++
          continue
        }

        // Count synchronized lyrics
        const hasSynchronized = lyricsResult.synchronized?.lines?.length > 0
        if (hasSynchronized) {
          stats.synchronizedCount++
        }

        // Update database with lyrics
        await prisma.song.update({
          where: { id: song.id },
          data: {
            lyricsRaw: lyricsResult.raw || JSON.stringify({
              lines: lyricsResult.lines,
              synchronized: lyricsResult.synchronized
            }),
            lyricsProvider: lyricsResult.provider,
            lyricsLicensed: lyricsResult.licensed && !lyricsResult.isExcerpt,
            culturalContext: lyricsResult.culturalContext
          }
        })

        // Track success by provider
        if (lyricsResult.provider === 'musixmatch') {
          stats.musixmatchSuccess++
          console.log(`  ✅ Musixmatch: ${lyricsResult.lines.length} lines${hasSynchronized ? ' (synchronized)' : ''}`)
        } else if (lyricsResult.provider === 'genius') {
          stats.geniusSuccess++
          console.log(`  ✅ Genius: ${lyricsResult.lines.length} lines`)
        } else if (lyricsResult.provider === 'public-domain') {
          stats.publicDomainSuccess++
          console.log(`  ✅ Public domain: ${lyricsResult.lines.length} lines`)
        }

        // License status
        if (lyricsResult.licensed && !lyricsResult.isExcerpt) {
          console.log(`    📜 Full licensed lyrics`)
        } else if (lyricsResult.isExcerpt) {
          console.log(`    📄 Excerpt only (licensed)`)
        } else {
          console.log(`    🆓 Public domain`)
        }

        // Cultural context
        if (lyricsResult.culturalContext) {
          console.log(`    🌍 Cultural context included`)
        }

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`  ❌ Error processing song:`, error)
        stats.failed++
      }
    }

    // Final statistics
    console.log('\n' + '='.repeat(70))
    console.log('📊 Curated Lyrics Acquisition Complete!')
    console.log(`📈 Total processed: ${stats.total} songs`)
    console.log(`🎵 Musixmatch success: ${stats.musixmatchSuccess} songs (${Math.round(stats.musixmatchSuccess/stats.total*100)}%)`)
    console.log(`🎤 Genius success: ${stats.geniusSuccess} songs (${Math.round(stats.geniusSuccess/stats.total*100)}%)`)
    console.log(`🆓 Public domain: ${stats.publicDomainSuccess} songs (${Math.round(stats.publicDomainSuccess/stats.total*100)}%)`)
    console.log(`❌ Failed: ${stats.failed} songs (${Math.round(stats.failed/stats.total*100)}%)`)
    console.log(`🎼 Synchronized lyrics: ${stats.synchronizedCount} songs (${Math.round(stats.synchronizedCount/stats.total*100)}%)`)

    const successTotal = stats.musixmatchSuccess + stats.geniusSuccess + stats.publicDomainSuccess
    console.log(`✅ Overall success rate: ${Math.round(successTotal/stats.total*100)}%`)

    // Quality breakdown
    console.log('\n📊 Quality Breakdown:')
    console.log(`  🏆 Premium (Musixmatch + sync): ${stats.synchronizedCount} songs`)
    console.log(`  ⭐ High (Licensed full): ${stats.musixmatchSuccess + stats.geniusSuccess} songs`)
    console.log(`  ✅ Good (Public domain): ${stats.publicDomainSuccess} songs`)

    console.log('='.repeat(70))

    // Show sample of what we got for quality assurance
    console.log('\n🔍 Sample Quality Check:')
    const sampleCheck = await prisma.song.findMany({
      where: {
        level: { in: [1, 2, 3, 4, 5] },
        isActive: true,
        lyricsRaw: { not: null }
      },
      select: {
        title: true,
        artist: true,
        level: true,
        lyricsProvider: true,
        lyricsLicensed: true
      },
      take: 5,
      orderBy: [{ level: 'asc' }, { order: 'asc' }]
    })

    sampleCheck.forEach(song => {
      const quality = song.lyricsProvider === 'musixmatch' ? '🏆' :
                     song.lyricsProvider === 'genius' ? '⭐' : '✅'
      const license = song.lyricsLicensed ? '📜' : '🆓'
      console.log(`  ${quality}${license} Level ${song.level}: ${song.artist} - ${song.title} (${song.lyricsProvider})`)
    })

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
  curatedLyricsAcquisition()
}

export { curatedLyricsAcquisition }