import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Fix the synchronized lyrics format for all Buena Vista Social Club songs
 * Convert from {startTime, endTime} to {time, text} format
 */
async function fixTimestamps() {
  console.log('🎵 Fixing timestamps for Buena Vista Social Club songs...\n')

  try {
    // Get all BVSC songs
    const songs = await prisma.song.findMany({
      where: {
        artist: "Buena Vista Social Club",
        lyricsRaw: { not: null }
      }
    })

    console.log(`📝 Found ${songs.length} songs to fix\n`)

    let successCount = 0
    let errorCount = 0

    for (const song of songs) {
      console.log(`🎵 Processing: ${song.title}`)

      try {
        if (!song.lyricsRaw) {
          console.log('  ⏭️  No lyrics, skipping\n')
          continue
        }

        const lyrics = JSON.parse(song.lyricsRaw)

        // Check if we have synchronized data
        if (!lyrics.synchronized || !lyrics.synchronized.lines) {
          console.log('  ⏭️  No synchronized data, skipping\n')
          continue
        }

        // Convert the format
        const originalLines = lyrics.synchronized.lines
        const convertedLines = originalLines.map((line: any) => {
          // Convert startTime from milliseconds to seconds
          const timeInSeconds = line.startTime / 1000

          return {
            time: timeInSeconds,
            text: line.text,
            // Keep the original data for reference
            startTime: line.startTime,
            endTime: line.endTime,
            words: line.words
          }
        })

        // Update the synchronized data structure
        lyrics.synchronized.lines = convertedLines

        // Save back to database
        await prisma.song.update({
          where: { id: song.id },
          data: {
            lyricsRaw: JSON.stringify(lyrics)
          }
        })

        console.log(`  ✅ Fixed ${convertedLines.length} lines`)
        console.log(`     First line time: ${convertedLines[0].time}s (was ${originalLines[0].startTime}ms)`)
        successCount++

      } catch (error) {
        console.log(`  ❌ Error: ${error}`)
        errorCount++
      }

      console.log('')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Summary:')
    console.log(`  ✅ Successfully fixed: ${successCount} songs`)
    console.log(`  ❌ Errors: ${errorCount} songs`)
    console.log(`  📝 Total processed: ${songs.length} songs`)

    // Verify the fix
    console.log('\n🔍 Verifying fix...')
    const verifyTest = await prisma.song.findFirst({
      where: {
        artist: "Buena Vista Social Club",
        title: "Chan Chan"
      }
    })

    if (verifyTest && verifyTest.lyricsRaw) {
      const testLyrics = JSON.parse(verifyTest.lyricsRaw)
      if (testLyrics.synchronized && testLyrics.synchronized.lines[0]) {
        const firstLine = testLyrics.synchronized.lines[0]
        console.log('  First line of Chan Chan:')
        console.log(`    time: ${firstLine.time}s`)
        console.log(`    text: "${firstLine.text}"`)
        console.log(`    ✅ Format is correct!`)
      }
    }

  } catch (error) {
    console.error('❌ Error fixing timestamps:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixTimestamps()