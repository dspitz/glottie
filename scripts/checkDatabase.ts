import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking current database content...')
  
  try {
    const songs = await prisma.song.findMany({
      include: { metrics: true },
      orderBy: { id: 'asc' }
    })
    
    console.log(`\n📊 Found ${songs.length} songs in database:`)
    
    let demoCount = 0
    let realCount = 0
    
    songs.forEach((song, index) => {
      const isDemoSong = song.spotifyId?.startsWith('demo_') || 
                        song.spotifyUrl?.includes('demo_') ||
                        !song.spotifyId
      
      if (isDemoSong) {
        demoCount++
        console.log(`❌ ${index + 1}. "${song.title}" by ${song.artist} [DEMO/FAKE - ID: ${song.spotifyId}]`)
      } else {
        realCount++
        console.log(`✅ ${index + 1}. "${song.title}" by ${song.artist} [REAL - ID: ${song.spotifyId}]`)
      }
    })
    
    console.log(`\n📈 Summary:`)
    console.log(`✅ Real songs: ${realCount}`)
    console.log(`❌ Demo/Fake songs: ${demoCount}`)
    console.log(`📊 Total: ${songs.length}`)
    
    if (demoCount > 0) {
      console.log(`\n🧹 ${demoCount} fake songs need to be removed`)
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()