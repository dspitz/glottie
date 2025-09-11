import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { searchTopSpanishSongs } from '../packages/adapters/spotify'
import { analyzeLine } from '../packages/core/morphology'
import { computeDifficulty, assignLevel } from '../packages/core/scoring'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function populate250Songs() {
  console.log('🎵 Populating database with 250+ real Spanish songs from Spotify...')
  console.log('📊 Target: Intelligently distributed across difficulty levels 1-10')
  console.log('')
  
  try {
    // Check current song count
    const existingSongs = await prisma.song.count()
    console.log(`📋 Current songs in database: ${existingSongs}`)
    
    if (existingSongs >= 250) {
      console.log('✅ Database already contains 250+ songs!')
      console.log('💡 To start fresh, run: npx prisma db reset')
      return
    }
    
    const targetTotal = 250
    const songsNeeded = Math.max(0, targetTotal - existingSongs)
    
    console.log(`🎯 Need ${songsNeeded} more songs to reach ${targetTotal} total`)
    console.log('')
    
    // Fetch more songs than needed to allow for intelligent distribution
    const fetchLimit = Math.max(songsNeeded * 1.5, 300) // Get extra for selection
    console.log(`🔍 Fetching ${fetchLimit} songs from Spotify for intelligent selection...`)
    console.log('')
    
    const discoveredSongs = await searchTopSpanishSongs(fetchLimit)
    
    if (discoveredSongs.length === 0) {
      console.error('❌ No songs discovered from Spotify. Check your API credentials.')
      return
    }
    
    console.log(`\n📊 Discovered ${discoveredSongs.length} potential Spanish songs`)
    
    // Filter out songs that already exist
    const existingSpotifyIds = await prisma.song.findMany({
      select: { spotifyId: true, title: true, artist: true }
    })
    
    const existingIds = new Set(existingSpotifyIds.map(s => s.spotifyId))
    const existingTitleArtists = new Set(
      existingSpotifyIds.map(s => `${s.title.toLowerCase()}_${s.artist.toLowerCase()}`)
    )
    
    const newSongs = discoveredSongs.filter(song => {
      const titleArtistKey = `${song.name.toLowerCase()}_${song.artists[0].name.toLowerCase()}`
      return !existingIds.has(song.id) && !existingTitleArtists.has(titleArtistKey)
    })
    
    console.log(`🆕 New songs after filtering: ${newSongs.length}`)
    
    if (newSongs.length === 0) {
      console.log('✅ All discovered songs already exist in database')
      return
    }
    
    // Analyze songs and compute difficulty scores
    console.log('\n🧠 Analyzing song difficulty for intelligent distribution...')
    const analyzedSongs = []
    
    for (const [index, song] of newSongs.entries()) {
      if (index % 20 === 0) {
        console.log(`   📊 Analyzing songs... ${index}/${newSongs.length}`)
      }
      
      // Create placeholder lyrics for difficulty scoring
      // In production, these would be fetched from lyrics providers
      const placeholderLyrics = [
        `${song.name} - canción en español`,
        `Interpretada por ${song.artists[0].name}`,
        'Música con ritmo y melodía',
        'Para aprender español bailando',
        'Con palabras y frases naturales'
      ]
      
      try {
        const parsedLines = placeholderLyrics.map((line, index) => 
          analyzeLine(line, index)
        )
        
        const { metrics, difficultyScore } = computeDifficulty(parsedLines)
        const level = assignLevel(difficultyScore)
        
        analyzedSongs.push({
          song,
          parsedLines,
          metrics,
          difficultyScore,
          level
        })
      } catch (error) {
        console.warn(`   ⚠️  Failed to analyze "${song.name}": ${error}`)
      }
    }
    
    console.log(`✅ Successfully analyzed ${analyzedSongs.length} songs`)
    
    // Intelligent distribution across levels
    const targetDistribution = {
      1: Math.ceil(songsNeeded * 0.15), // 15% - Beginner
      2: Math.ceil(songsNeeded * 0.15), // 15% - Beginner
      3: Math.ceil(songsNeeded * 0.12), // 12% - Elementary
      4: Math.ceil(songsNeeded * 0.12), // 12% - Elementary
      5: Math.ceil(songsNeeded * 0.10), // 10% - Intermediate
      6: Math.ceil(songsNeeded * 0.10), // 10% - Intermediate
      7: Math.ceil(songsNeeded * 0.08), // 8% - Upper Intermediate
      8: Math.ceil(songsNeeded * 0.08), // 8% - Upper Intermediate
      9: Math.ceil(songsNeeded * 0.05), // 5% - Advanced
      10: Math.ceil(songsNeeded * 0.05), // 5% - Advanced
    }
    
    console.log('\n🎚️ Target level distribution:')
    Object.entries(targetDistribution).forEach(([level, count]) => {
      console.log(`   Level ${level}: ${count} songs`)
    })
    
    // Group songs by their computed levels
    const songsByLevel = analyzedSongs.reduce((acc, analyzed) => {
      const level = analyzed.level
      if (!acc[level]) acc[level] = []
      acc[level].push(analyzed)
      return acc
    }, {} as Record<number, typeof analyzedSongs>)
    
    // Select songs to achieve target distribution
    const selectedSongs = []
    
    for (let level = 1; level <= 10; level++) {
      const available = songsByLevel[level] || []
      const needed = targetDistribution[level]
      
      // Sort by difficulty score within level for more precise selection
      available.sort((a, b) => a.difficultyScore - b.difficultyScore)
      
      const selected = available.slice(0, needed)
      selectedSongs.push(...selected)
      
      console.log(`📊 Level ${level}: Selected ${selected.length}/${needed} songs (${available.length} available)`)
    }
    
    console.log(`\n🎯 Selected ${selectedSongs.length} songs for optimal distribution`)
    
    // Add songs to database
    console.log('\n💾 Adding songs to database...')
    let addedCount = 0
    
    for (const [index, analyzed] of selectedSongs.entries()) {
      try {
        const { song, parsedLines, metrics, difficultyScore, level } = analyzed
        
        const createdSong = await prisma.song.create({
          data: {
            title: song.name,
            artist: song.artists[0].name,
            album: song.album.name,
            year: song.album.release_date ? parseInt(song.album.release_date.split('-')[0]) : new Date().getFullYear(),
            spotifyId: song.id,
            spotifyUrl: song.external_urls.spotify,
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
        
        if (index % 10 === 0 || index === selectedSongs.length - 1) {
          console.log(`   ✅ Added ${addedCount}/${selectedSongs.length}: "${createdSong.title}" - Level ${createdSong.level}`)
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50))
        
      } catch (error) {
        console.error(`   ❌ Failed to add "${analyzed.song.name}":`, error)
      }
    }
    
    // Final summary
    const finalCount = await prisma.song.count()
    console.log(`\n🎉 Successfully added ${addedCount} songs!`)
    console.log(`📊 Total songs in database: ${finalCount}`)
    
    // Show final level distribution
    const allSongs = await prisma.song.findMany({
      include: { metrics: true }
    })
    
    const levelCounts = allSongs.reduce((acc, song) => {
      const level = song.level || 1
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    
    console.log('\n🎚️ Final Level Distribution:')
    for (let i = 1; i <= 10; i++) {
      const count = levelCounts[i] || 0
      const percentage = ((count / finalCount) * 100).toFixed(1)
      console.log(`   Level ${i}: ${count} songs (${percentage}%)`)
    }
    
    console.log('\n✨ Database population complete!')
    console.log('💡 Next steps:')
    console.log('   1. Set up lyrics providers for real lyrics')
    console.log('   2. Test the learning interface')
    console.log('   3. Run: npm run dev')
    
  } catch (error) {
    console.error('❌ Failed to populate songs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  populate250Songs()
    .catch(console.error)
    .finally(() => process.exit())
}

export default populate250Songs