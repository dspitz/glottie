import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })

const prisma = new PrismaClient()

interface LyricLine {
  text: string
  startTime: number
  endTime: number
  words?: Array<{
    text: string
    startTime: number
    endTime: number
  }>
}

interface SynchronizedData {
  lines: LyricLine[]
  hasWordTiming: boolean
  format: 'lrc' | 'estimated' | 'dfxp'
  duration?: number
}

async function testSyncedLyrics(songId?: string) {
  console.log('🎵 SYNCHRONIZED LYRICS TEST')
  console.log('=' .repeat(60))

  const targetSongId = songId || 'cmfc1wrk70010wo78i23c1x98' // Te Esperé

  // Get the song from database first
  const song = await prisma.song.findUnique({
    where: { id: targetSongId },
    include: {
      translations: {
        where: { targetLang: 'en' }
      }
    }
  })

  if (!song) {
    console.log('❌ Song not found in database')
    await prisma.$disconnect()
    return
  }

  console.log(`\n📀 Song: ${song.artist} - ${song.title}`)
  console.log(`🆔 ID: ${song.id}`)

  // Fetch synchronized data from API
  console.log('\n🌐 Fetching synchronized data from API...')
  const apiResponse = await fetch(`http://127.0.0.1:3000/api/lyrics/${targetSongId}`)
  const apiData = await apiResponse.json()

  if (!apiData.synchronized) {
    console.log('❌ No synchronized data found in API response')
    await prisma.$disconnect()
    return
  }

  // Parse synchronized data from API
  let syncData: SynchronizedData = apiData.synchronized

  console.log(`\n📊 SYNCHRONIZED DATA ANALYSIS:`)
  console.log(`  Format: ${syncData.format}`)
  console.log(`  Has word timing: ${syncData.hasWordTiming}`)
  console.log(`  Total lines: ${syncData.lines.length}`)
  console.log(`  Duration: ${syncData.duration ? `${(syncData.duration / 1000).toFixed(2)}s` : 'Not specified'}`)

  // Validate timing data
  console.log(`\n⏱️ TIMING VALIDATION:`)

  let validLines = 0
  let invalidLines = 0
  let overlappingLines = 0
  let gapsBetweenLines = []

  for (let i = 0; i < syncData.lines.length; i++) {
    const line = syncData.lines[i]

    // Check if timing is valid
    if (line.startTime >= 0 && line.endTime > line.startTime) {
      validLines++
    } else {
      invalidLines++
      if (i < 5) { // Show first 5 invalid lines
        console.log(`  ❌ Invalid timing at line ${i + 1}: start=${line.startTime}ms, end=${line.endTime}ms`)
      }
    }

    // Check for overlapping with next line
    if (i < syncData.lines.length - 1) {
      const nextLine = syncData.lines[i + 1]
      if (line.endTime > nextLine.startTime) {
        overlappingLines++
        if (overlappingLines <= 3) { // Show first 3 overlaps
          console.log(`  ⚠️ Overlap at lines ${i + 1}-${i + 2}: ${line.endTime}ms > ${nextLine.startTime}ms`)
        }
      }

      // Calculate gap
      const gap = nextLine.startTime - line.endTime
      if (gap > 0) {
        gapsBetweenLines.push(gap)
      }
    }
  }

  console.log(`  ✅ Valid lines: ${validLines}/${syncData.lines.length}`)
  if (invalidLines > 0) {
    console.log(`  ❌ Invalid lines: ${invalidLines}`)
  }
  if (overlappingLines > 0) {
    console.log(`  ⚠️ Overlapping lines: ${overlappingLines}`)
  }

  if (gapsBetweenLines.length > 0) {
    const avgGap = gapsBetweenLines.reduce((a, b) => a + b, 0) / gapsBetweenLines.length
    const maxGap = Math.max(...gapsBetweenLines)
    const minGap = Math.min(...gapsBetweenLines)
    console.log(`  📏 Gaps between lines:`)
    console.log(`     Average: ${(avgGap / 1000).toFixed(2)}s`)
    console.log(`     Min: ${(minGap / 1000).toFixed(2)}s`)
    console.log(`     Max: ${(maxGap / 1000).toFixed(2)}s`)
  }

  // Show sample of first and last few lines with timing
  console.log(`\n📝 SAMPLE LYRICS WITH TIMING:`)
  console.log(`\nFirst 3 lines:`)
  for (let i = 0; i < Math.min(3, syncData.lines.length); i++) {
    const line = syncData.lines[i]
    const startSec = (line.startTime / 1000).toFixed(2)
    const endSec = (line.endTime / 1000).toFixed(2)
    console.log(`  ${i + 1}. [${startSec}s - ${endSec}s] "${line.text.substring(0, 50)}${line.text.length > 50 ? '...' : ''}"`)
  }

  if (syncData.lines.length > 6) {
    console.log(`\nLast 3 lines:`)
    for (let i = syncData.lines.length - 3; i < syncData.lines.length; i++) {
      const line = syncData.lines[i]
      const startSec = (line.startTime / 1000).toFixed(2)
      const endSec = (line.endTime / 1000).toFixed(2)
      console.log(`  ${i + 1}. [${startSec}s - ${endSec}s] "${line.text.substring(0, 50)}${line.text.length > 50 ? '...' : ''}"`)
    }
  }

  // Check translations alignment
  if (apiData.translations && apiData.translations.en) {
    console.log(`\n🌐 TRANSLATION ALIGNMENT:`)
    const translatedLines = apiData.translations.en
    if (translatedLines.length === syncData.lines.length) {
      console.log(`  ✅ Translation lines match: ${translatedLines.length} lines`)

      // Show sample translation pairs
      console.log(`\n  Sample translation pairs:`)
      for (let i = 0; i < Math.min(2, syncData.lines.length); i++) {
        const origLine = syncData.lines[i].text.substring(0, 40)
        const transLine = translatedLines[i].substring(0, 40)
        console.log(`    Line ${i + 1}:`)
        console.log(`      ES: "${origLine}..."`)
        console.log(`      EN: "${transLine}..."`)
      }
    } else {
      console.log(`  ❌ Translation line count mismatch: ${translatedLines.length} vs ${syncData.lines.length}`)
    }
  } else if (song.translations.length > 0) {
    console.log(`\n🌐 TRANSLATION ALIGNMENT (from database):`)
    const translation = song.translations[0]
    try {
      const translatedLines = JSON.parse(translation.lyricsLines)
      if (translatedLines.length === syncData.lines.length) {
        console.log(`  ✅ Translation lines match: ${translatedLines.length} lines`)

        // Show sample translation pairs
        console.log(`\n  Sample translation pairs:`)
        for (let i = 0; i < Math.min(2, syncData.lines.length); i++) {
          const origLine = syncData.lines[i].text.substring(0, 40)
          const transLine = translatedLines[i].substring(0, 40)
          console.log(`    Line ${i + 1}:`)
          console.log(`      ES: "${origLine}..."`)
          console.log(`      EN: "${transLine}..."`)
        }
      } else {
        console.log(`  ❌ Translation line count mismatch: ${translatedLines.length} vs ${syncData.lines.length}`)
      }
    } catch (error) {
      console.log(`  ❌ Failed to parse translations:`, error)
    }
  } else {
    console.log(`\n⚠️ No translations found for this song`)
  }

  // Check if timing covers the full duration
  if (syncData.duration && syncData.lines.length > 0) {
    const lastLine = syncData.lines[syncData.lines.length - 1]
    const coverage = (lastLine.endTime / syncData.duration) * 100
    console.log(`\n📈 COVERAGE:`)
    console.log(`  Lyrics cover ${coverage.toFixed(1)}% of song duration`)
    if (coverage < 90) {
      console.log(`  ⚠️ Low coverage - lyrics may end too early`)
    }
  }

  // Summary
  console.log(`\n✨ SUMMARY:`)
  const status = invalidLines === 0 && overlappingLines === 0 ? '✅ READY' : '⚠️ NEEDS ATTENTION'
  console.log(`  Status: ${status}`)
  console.log(`  Quality Score: ${((validLines / syncData.lines.length) * 100).toFixed(1)}%`)

  await prisma.$disconnect()
}

// Run if called directly
if (require.main === module) {
  const songId = process.argv[2]
  testSyncedLyrics(songId)
}

export { testSyncedLyrics }