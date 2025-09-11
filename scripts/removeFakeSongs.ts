import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function removeFakeSongs() {
  console.log('🧹 Removing all fake/demo songs from database...')
  
  try {
    // First, find all fake songs
    const fakeSongs = await prisma.song.findMany({
      where: {
        OR: [
          { spotifyId: { startsWith: 'demo_' } },
          { spotifyUrl: { contains: 'demo_' } },
          { spotifyId: null },
          // Also match the specific fake artists from seed_songs.json
          { artist: { in: [
            'Los Hermanos', 'María Elena', 'Carlos Viento', 'Río Sonoro',
            'Joven Académico', 'Grupo Laboral', 'Chef Popular', 'Orquesta Moderna',
            'Atletas Unidos', 'Digital Futuro'
          ] } }
        ]
      },
      include: { metrics: true }
    })
    
    if (fakeSongs.length === 0) {
      console.log('✅ No fake songs found in database')
      return
    }
    
    console.log(`\n🎯 Found ${fakeSongs.length} fake songs to remove:`)
    fakeSongs.forEach((song, index) => {
      console.log(`   ${index + 1}. "${song.title}" by ${song.artist} (ID: ${song.spotifyId || 'null'})`)
    })
    
    // Delete metrics first (due to foreign key constraints)
    const metricsToDelete = fakeSongs.filter(song => song.metrics).length
    if (metricsToDelete > 0) {
      console.log(`\n🔧 Deleting ${metricsToDelete} associated metrics records...`)
      await prisma.metrics.deleteMany({
        where: {
          songId: { in: fakeSongs.map(song => song.id) }
        }
      })
      console.log('✅ Metrics deleted')
    }
    
    // Now delete the songs
    console.log(`\n🗑️  Deleting ${fakeSongs.length} fake songs...`)
    const deleteResult = await prisma.song.deleteMany({
      where: {
        id: { in: fakeSongs.map(song => song.id) }
      }
    })
    
    console.log(`✅ Successfully deleted ${deleteResult.count} fake songs`)
    
    // Verify the cleanup
    const remainingSongs = await prisma.song.count()
    console.log(`\n📊 Remaining songs in database: ${remainingSongs}`)
    
    // Show a few remaining songs to verify they're all real
    const sampleRemaining = await prisma.song.findMany({
      take: 5,
      select: { title: true, artist: true, spotifyId: true }
    })
    
    console.log('\n🔍 Sample of remaining songs (should all be real):')
    sampleRemaining.forEach((song, index) => {
      console.log(`   ${index + 1}. "${song.title}" by ${song.artist} (ID: ${song.spotifyId})`)
    })
    
  } catch (error) {
    console.error('❌ Failed to remove fake songs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeFakeSongs()