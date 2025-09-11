import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import MultiSourceDiscovery from '../packages/adapters/songDiscovery'
import { analyzeLine } from '../packages/core/morphology'
import { computeDifficulty, assignLevel } from '../packages/core/scoring'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function populateRealSongs() {
  console.log('🎵 Discovering real Spanish songs from multiple sources...')
  
  const discovery = new MultiSourceDiscovery()
  const availableSources = discovery.getAvailableSources()
  
  console.log(`📡 Available sources: ${availableSources.join(', ')}`)
  
  try {
    // Discover songs from all sources
    const songs = await discovery.discoverSongs(100) // Get top 100 songs
    
    console.log(`\n🎯 Found ${songs.length} Spanish songs to add`)
    
    let addedCount = 0
    let skippedCount = 0
    
    for (const song of songs) {
      try {
        // Check if song already exists
        const existing = await prisma.song.findFirst({
          where: {
            OR: [
              { spotifyId: song.id },
              { 
                AND: [
                  { title: song.name },
                  { artist: song.artists[0].name }
                ]
              }
            ]
          }
        })
        
        if (existing) {
          skippedCount++
          console.log(`⏭️  Skipping "${song.name}" by ${song.artists[0].name} (already exists)`)
          continue
        }
        
        // Create placeholder lyrics for difficulty scoring
        // In real implementation, you'd fetch actual lyrics here
        const placeholderLyrics = [
          `${song.name} es una canción popular`,
          `Interpretada por ${song.artists[0].name}`,
          'Esta es una canción en español',
          'Con ritmo y melodía hermosa',
          'Que nos hace sentir alegría'
        ]
        
        // Parse and score the placeholder content
        const parsedLines = placeholderLyrics.map((line, index) => 
          analyzeLine(line, index)
        )
        
        const { metrics, difficultyScore } = computeDifficulty(parsedLines)
        const level = assignLevel(difficultyScore)
        
        // Create song entry
        const createdSong = await prisma.song.create({
          data: {
            title: song.name,
            artist: song.artists[0].name,
            album: song.album.name,
            year: parseInt(song.album.release_date) || new Date().getFullYear(),
            spotifyId: song.id,
            spotifyUrl: song.external_urls.spotify,
            previewUrl: song.preview_url,
            language: 'es',
            lyricsRaw: null, // Will be populated when lyrics are fetched
            lyricsParsed: JSON.stringify(parsedLines),
            level: level,
            metrics: {
              create: {
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
            }
          },
          include: { metrics: true }
        })
        
        addedCount++
        console.log(`✅ Added "${createdSong.title}" by ${createdSong.artist} - Level ${createdSong.level} (Score: ${createdSong.metrics?.difficultyScore.toFixed(2)})`)
        
        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (songError) {
        console.error(`❌ Failed to add "${song.name}" by ${song.artists[0].name}:`, songError)
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`✅ Added: ${addedCount} songs`)
    console.log(`⏭️  Skipped: ${skippedCount} songs (already existed)`)
    console.log(`❌ Failed: ${songs.length - addedCount - skippedCount} songs`)
    
    // Show level distribution
    const allSongs = await prisma.song.findMany({
      include: { metrics: true }
    })
    
    const levelCounts = allSongs.reduce((acc, song) => {
      const level = song.level || 1
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    console.log('\n🎚️ Level Distribution:')
    for (let i = 1; i <= 10; i++) {
      const count = levelCounts[i] || 0
      console.log(`Level ${i}: ${count} songs`)
    }
    
  } catch (error) {
    console.error('❌ Failed to populate songs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  populateRealSongs()
    .catch(console.error)
    .finally(() => process.exit())
}

export default populateRealSongs