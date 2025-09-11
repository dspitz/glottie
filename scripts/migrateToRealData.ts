import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

interface MigrationStats {
  totalSongs: number
  fakeSongsRemoved: number
  realSongsKept: number
  songsEnhanced: number
}

async function migrateToRealData(): Promise<MigrationStats> {
  console.log('🔄 Starting migration to real song data...')
  
  const stats: MigrationStats = {
    totalSongs: 0,
    fakeSongsRemoved: 0,
    realSongsKept: 0,
    songsEnhanced: 0
  }

  try {
    // Get current song count
    stats.totalSongs = await prisma.song.count()
    console.log(`📊 Found ${stats.totalSongs} total songs in database`)

    // 1. Identify and mark fake songs as inactive instead of deleting (preserve IDs for any existing references)
    console.log('\n🧹 Step 1: Marking fake songs as inactive...')
    
    const fakeSpotifyIds = [
      'curated_', 'billboard_', 'demo_', 'test_', 'placeholder_', 'fake_'
    ]
    
    for (const fakePrefix of fakeSpotifyIds) {
      const updateResult = await prisma.song.updateMany({
        where: {
          spotifyId: {
            startsWith: fakePrefix
          }
        },
        data: {
          isActive: false
        }
      })
      
      stats.fakeSongsRemoved += updateResult.count
      console.log(`   ❌ Marked ${updateResult.count} songs with '${fakePrefix}*' as inactive`)
    }

    // Also mark songs with null spotifyId as inactive if they look like test data
    const nullSpotifyResult = await prisma.song.updateMany({
      where: {
        AND: [
          { spotifyId: null },
          {
            OR: [
              { title: { contains: 'Test' } },
              { title: { contains: 'Demo' } },
              { artist: { contains: 'Demo' } },
              { artist: { contains: 'Test' } }
            ]
          }
        ]
      },
      data: {
        isActive: false
      }
    })
    
    stats.fakeSongsRemoved += nullSpotifyResult.count
    console.log(`   ❌ Marked ${nullSpotifyResult.count} test/demo songs with null Spotify IDs as inactive`)

    // 2. Count and enhance real songs
    console.log('\n✅ Step 2: Analyzing real songs...')
    
    const realSongs = await prisma.song.findMany({
      where: {
        AND: [
          { isActive: true },
          { spotifyId: { not: null } },
          { 
            NOT: {
              OR: fakeSpotifyIds.map(prefix => ({
                spotifyId: { startsWith: prefix }
              }))
            }
          }
        ]
      },
      include: {
        metrics: true
      }
    })

    stats.realSongsKept = realSongs.length
    console.log(`   🎵 Found ${stats.realSongsKept} real songs to keep and enhance`)

    // 3. Update real songs with new schema defaults
    console.log('\n🔧 Step 3: Updating real songs with enhanced data...')
    
    for (const song of realSongs) {
      const updateData: any = {}
      
      // Set default values for new fields if they're not already set
      if (song.lyricsProvider === null && song.lyricsRaw) {
        updateData.lyricsProvider = 'unknown' // We don't know the original provider
      }
      
      if (typeof song.lyricsLicensed === 'undefined') {
        updateData.lyricsLicensed = Boolean(song.lyricsRaw) // If we have raw lyrics, assume licensed
      }
      
      // Only update if we have data to change
      if (Object.keys(updateData).length > 0) {
        await prisma.song.update({
          where: { id: song.id },
          data: updateData
        })
        stats.songsEnhanced++
      }
    }
    
    console.log(`   ✨ Enhanced ${stats.songsEnhanced} songs with new metadata`)

    // 4. Show final statistics
    console.log('\n📈 Step 4: Final statistics...')
    
    const [activeSongs, inactiveSongs, songsWithLyrics, songsWithArtwork] = await Promise.all([
      prisma.song.count({ where: { isActive: true } }),
      prisma.song.count({ where: { isActive: false } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { lyricsRaw: { not: null } }] } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { albumArt: { not: null } }] } })
    ])
    
    console.log(`\n📊 Migration Summary:`)
    console.log(`   Total songs before: ${stats.totalSongs}`)
    console.log(`   Active songs after: ${activeSongs}`)
    console.log(`   Inactive songs: ${inactiveSongs}`)
    console.log(`   Songs with lyrics: ${songsWithLyrics}`)
    console.log(`   Songs with artwork: ${songsWithArtwork}`)
    console.log(`   Songs enhanced: ${stats.songsEnhanced}`)
    
    // 5. Show examples of kept songs
    console.log('\n🎵 Sample of active songs:')
    const sampleSongs = await prisma.song.findMany({
      where: { isActive: true },
      select: {
        title: true,
        artist: true,
        spotifyId: true,
        albumArt: true,
        lyricsRaw: true
      },
      take: 5
    })
    
    sampleSongs.forEach((song, i) => {
      console.log(`   ${i + 1}. "${song.title}" by ${song.artist}`)
      console.log(`      Spotify: ${song.spotifyId ? '✅' : '❌'} | Artwork: ${song.albumArt ? '✅' : '❌'} | Lyrics: ${song.lyricsRaw ? '✅' : '❌'}`)
    })

    return stats

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export for use in other scripts
export { migrateToRealData }

// Run if called directly
if (require.main === module) {
  migrateToRealData()
    .then((stats) => {
      console.log('\n✅ Migration completed successfully!')
      console.log(`Final stats:`, stats)
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    })
}