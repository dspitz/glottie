import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { getLyricsByTrack } from '../packages/adapters/lyricsProvider'
import { analyzeLine } from '../packages/core/morphology'
import { computeDifficulty } from '../packages/core/scoring'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function populateLyrics() {
  console.log('🎵 Populating real lyrics for existing songs...')
  
  try {
    // Get songs without lyrics (where lyricsRaw is null)
    const songsWithoutLyrics = await prisma.song.findMany({
      where: {
        lyricsRaw: null
      },
      take: 20, // Process 20 songs at a time to respect API limits
      orderBy: {
        createdAt: 'asc' // Start with oldest songs
      }
    })
    
    console.log(`🔍 Found ${songsWithoutLyrics.length} songs without lyrics`)
    
    if (songsWithoutLyrics.length === 0) {
      console.log('✅ All songs already have lyrics!')
      return
    }
    
    let updatedCount = 0
    let failedCount = 0
    
    for (const song of songsWithoutLyrics) {
      try {
        console.log(`\\n📡 Fetching lyrics for "${song.title}" by ${song.artist}...`)
        
        // Fetch lyrics using the provider system
        const lyricsResult = await getLyricsByTrack(song.artist, song.title)
        
        if (lyricsResult.error || lyricsResult.lines.length === 0) {
          console.warn(`   ⚠️  No lyrics found: ${lyricsResult.error || 'No lines returned'}`)
          failedCount++
          continue
        }
        
        // Parse lyrics for difficulty analysis
        const parsedLines = lyricsResult.lines.map((line, index) => 
          analyzeLine(line, index)
        )
        
        // Recompute difficulty with real lyrics
        const { metrics, difficultyScore } = computeDifficulty(parsedLines)
        
        // Update song with lyrics and recalculated metrics
        const updateData: any = {
          lyricsRaw: lyricsResult.licensed ? lyricsResult.raw : null,
          lyricsParsed: JSON.stringify(parsedLines)
        }
        
        // Update metrics if they exist
        if (song.level) {
          await prisma.metrics.upsert({
            where: { songId: song.id },
            create: {
              songId: song.id,
              wordCount: metrics.wordCount,
              uniqueWordCount: metrics.uniqueWordCount,
              typeTokenRatio: metrics.typeTokenRatio,
              avgWordFreqZipf: metrics.avgWordFreqZipf,
              verbDensity: metrics.verbDensity,
              tenseWeights: metrics.tenseWeights,
              idiomCount: metrics.idiomCount,
              punctComplexity: metrics.punctComplexity,
              difficultyScore: difficultyScore,
            },
            update: {
              wordCount: metrics.wordCount,
              uniqueWordCount: metrics.uniqueWordCount,
              typeTokenRatio: metrics.typeTokenRatio,
              avgWordFreqZipf: metrics.avgWordFreqZipf,
              verbDensity: metrics.verbDensity,
              tenseWeights: metrics.tenseWeights,
              idiomCount: metrics.idiomCount,
              punctComplexity: metrics.punctComplexity,
              difficultyScore: difficultyScore,
            }
          })
        }
        
        await prisma.song.update({
          where: { id: song.id },
          data: updateData
        })
        
        updatedCount++
        console.log(`   ✅ Updated with ${lyricsResult.lines.length} lines (${lyricsResult.provider})`)
        console.log(`   📊 New difficulty score: ${difficultyScore.toFixed(2)}`)
        
        if (lyricsResult.attribution) {
          console.log(`   ℹ️  ${lyricsResult.attribution}`)
        }
        
        // Respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        
      } catch (error) {
        console.error(`   ❌ Failed to update "${song.title}":`, error)
        failedCount++
      }
    }
    
    console.log(`\\n📊 Summary:`)
    console.log(`✅ Updated: ${updatedCount} songs with lyrics`)
    console.log(`❌ Failed: ${failedCount} songs`)
    
    if (updatedCount > 0) {
      console.log(`\\n💡 To continue populating more songs, run this script again.`)
    }
    
    // Show updated statistics
    const totalSongsWithLyrics = await prisma.song.count({
      where: { lyricsRaw: { not: null } }
    })
    
    const totalSongs = await prisma.song.count()
    
    console.log(`\\n📈 Overall Progress:`)
    console.log(`📚 Songs with lyrics: ${totalSongsWithLyrics}/${totalSongs} (${((totalSongsWithLyrics/totalSongs)*100).toFixed(1)}%)`)
    
  } catch (error) {
    console.error('❌ Failed to populate lyrics:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  populateLyrics()
    .catch(console.error)
    .finally(() => process.exit())
}

export default populateLyrics