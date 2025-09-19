import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupIncompleteSongs() {
  console.log('🧹 Cleaning up incomplete songs from database')
  console.log('==========================================\n')

  try {
    // Get all songs to analyze
    const songs = await prisma.song.findMany({
      select: {
        id: true,
        title: true,
        artist: true,
        spotifyId: true,
        lyricsRaw: true,
        albumArt: true,
        albumArtSmall: true,
        isActive: true
      }
    })

    console.log(`Found ${songs.length} total songs in database\n`)

    const songsToDelete: Array<{ id: string, title: string, artist: string, reason: string }> = []

    for (const song of songs) {
      const missingItems = []

      if (!song.spotifyId) {
        missingItems.push('Spotify ID')
      }

      if (!song.lyricsRaw) {
        missingItems.push('lyrics')
      }

      if (!song.albumArt && !song.albumArtSmall) {
        missingItems.push('album art')
      }

      if (missingItems.length > 0) {
        songsToDelete.push({
          id: song.id,
          title: song.title,
          artist: song.artist,
          reason: `Missing: ${missingItems.join(', ')}`
        })
      }
    }

    console.log(`\n🔍 Found ${songsToDelete.length} songs to delete:\n`)

    // Display songs that will be deleted
    songsToDelete.forEach((song, index) => {
      console.log(`${index + 1}. "${song.title}" by ${song.artist}`)
      console.log(`   Reason: ${song.reason}`)
    })

    if (songsToDelete.length > 0) {
      console.log('\n⚠️  Deleting these songs...')

      // Delete the songs
      const deleteResult = await prisma.song.deleteMany({
        where: {
          id: {
            in: songsToDelete.map(s => s.id)
          }
        }
      })

      console.log(`\n✅ Successfully deleted ${deleteResult.count} songs`)
    } else {
      console.log('\n✅ All songs have complete data (Spotify ID, lyrics, and album art)!')
    }

    // Show remaining song count
    const remainingCount = await prisma.song.count({
      where: { isActive: true }
    })

    console.log(`\n📊 Remaining songs in library: ${remainingCount}`)

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupIncompleteSongs().catch(console.error)