import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Database seeding...')
  
  // Check current song count
  const existingSongs = await prisma.song.count()
  
  if (existingSongs > 0) {
    console.log(`📊 Found ${existingSongs} existing songs in database`)
    console.log('✅ Database already contains songs. No seeding needed.')
    console.log('')
    console.log('💡 To populate with real Spanish songs, run:')
    console.log('   npm run script:populate-real-songs')
    console.log('')
    console.log('💡 To remove all songs and start fresh, run:')
    console.log('   npx prisma db reset')
    return
  }
  
  console.log('📭 Database is empty.')
  console.log('')
  console.log('🎵 To populate with real Spanish songs from Spotify, run:')
  console.log('   npm run script:populate-real-songs')
  console.log('')
  console.log('⚙️  Make sure you have set up your environment variables:')
  console.log('   SPOTIFY_CLIENT_ID=your_client_id')
  console.log('   SPOTIFY_CLIENT_SECRET=your_client_secret')
  console.log('   DATABASE_URL=file:./dev.db')
  console.log('')
  console.log('✨ No demo songs will be added. Real content only!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding check failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })