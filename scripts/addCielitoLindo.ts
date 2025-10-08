import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addCielitoLindo() {
  console.log('🎵 Adding Cielito Lindo to the library...\n')

  try {
    // Cielito Lindo - Classic Mexican folk song
    // Using Pedro Infante's version as it's one of the most famous
    const song = {
      spotifyId: '2xTlxGCqFyqOlYEkFdJJf1', // Pedro Infante version
      title: 'Cielito Lindo',
      artist: 'Pedro Infante',
      album: 'Pedro Infante - 50 Éxitos',
      level: 2, // Level 2 - familiar melody, moderate vocabulary
      spotifyUrl: 'https://open.spotify.com/track/2xTlxGCqFyqOlYEkFdJJf1',
      previewUrl: null, // Will be fetched
      albumArt: 'https://i.scdn.co/image/ab67616d00001e02c5663e2e57db96c1caa35f46',
      albumArtSmall: 'https://i.scdn.co/image/ab67616d00004851c5663e2e57db96c1caa35f46',
      popularity: 65,
      genres: 'mariachi, ranchera', // Traditional Mexican genres
      year: 1953, // Pedro Infante recording year
    }

    // Check if song already exists
    const existing = await prisma.song.findUnique({
      where: { spotifyId: song.spotifyId }
    })

    if (existing) {
      console.log(`⚠️  Song already exists: ${song.title} by ${song.artist}`)
      console.log(`   ID: ${existing.id}`)
      return existing
    }

    // Create the song
    const created = await prisma.song.create({
      data: song
    })

    console.log(`✅ Successfully added: ${song.title} by ${song.artist}`)
    console.log(`   ID: ${created.id}`)
    console.log(`   Level: ${song.level}`)
    console.log(`   Genres: ${song.genres}`)
    console.log('\n🎵 Next steps:')
    console.log(`   1. Run hydration to fetch lyrics and translations:`)
    console.log(`      DATABASE_URL="file:./dev.db" SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" MUSIXMATCH_FULL_LYRICS="true" TRANSLATOR=openai OPENAI_API_KEY="$OPENAI_API_KEY" npx tsx scripts/songHydration.ts ${created.id}`)

    return created

  } catch (error) {
    console.error('❌ Error adding Cielito Lindo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
addCielitoLindo()