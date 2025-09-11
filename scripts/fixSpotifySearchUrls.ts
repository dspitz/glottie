import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { searchSpotifyTracks } from '@/packages/adapters/spotify'

config({ path: '.env.local' })

const prisma = new PrismaClient()

async function fixSpotifySearchUrls() {
  console.log('🔍 Finding songs with Spotify search URLs...')
  
  try {
    // Get all songs with search URLs (these need fixing)
    const songsWithSearchUrls = await prisma.song.findMany({
      where: {
        spotifyUrl: { contains: '/search/' }
      },
      select: {
        id: true,
        spotifyId: true,
        spotifyUrl: true,
        title: true,
        artist: true
      }
    })

    console.log(`Found ${songsWithSearchUrls.length} songs with search URLs that need fixing`)

    if (songsWithSearchUrls.length === 0) {
      console.log('✅ No songs need fixing!')
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const song of songsWithSearchUrls) {
      try {
        console.log(`\n🎵 Searching for: ${song.artist} - ${song.title}`)
        
        // Search Spotify for the actual track
        const searchResults = await searchSpotifyTracks(`${song.title} ${song.artist}`, 1)
        
        if (searchResults.length > 0) {
          const track = searchResults[0]
          
          // Update the song with real Spotify data
          await prisma.song.update({
            where: { id: song.id },
            data: {
              spotifyId: track.id,
              spotifyUrl: track.external_urls.spotify,
              // Clear any existing album art so it gets refetched with real data
              albumArt: null,
              albumArtSmall: null,
              previewUrl: track.preview_url
            }
          })
          
          console.log(`   ✅ Updated: ${track.external_urls.spotify}`)
          successCount++
        } else {
          console.log(`   ❌ No results found for: ${song.artist} - ${song.title}`)
          errorCount++
        }
        
        // Rate limiting to avoid hitting Spotify API limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`   ❌ Error processing ${song.artist} - ${song.title}:`, error)
        errorCount++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Successfully fixed: ${successCount} songs`)
    console.log(`   ❌ Failed to fix: ${errorCount} songs`)
    
    if (successCount > 0) {
      console.log(`\n💡 Next step: Run the data pipeline to fetch album artwork for the fixed songs`)
      console.log(`   Command: DATABASE_URL="file:./dev.db" npx tsx scripts/completeDataPipeline.ts`)
    }

  } catch (error) {
    console.error('❌ Script failed:', error)
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
  fixSpotifySearchUrls()
}

export { fixSpotifySearchUrls }