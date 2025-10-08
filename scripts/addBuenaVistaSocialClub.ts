import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BuenaVistaSong {
  title: string
  artist: string
  level: number
  spotifyId?: string
  description?: string
}

// Top 10 Buena Vista Social Club songs distributed across levels
const buenaVistaSongs: BuenaVistaSong[] = [
  // Level 1 - Simple, repetitive lyrics
  {
    title: "Chan Chan",
    artist: "Buena Vista Social Club",
    level: 1,
    spotifyId: "7jh46VyH2t6a4PC3NJdqBY",
    description: "Simple story with repetitive chorus, clear pronunciation"
  },
  {
    title: "Dos Gardenias",
    artist: "Buena Vista Social Club",
    level: 1,
    spotifyId: "6qGZosXeWNJRFzRmEH41kL",
    description: "Romantic ballad with simple vocabulary and clear vocals"
  },

  // Level 2 - Moderate complexity
  {
    title: "El Cuarto de Tula",
    artist: "Buena Vista Social Club",
    level: 2,
    spotifyId: "2pDPOMkJhcCgqPDcZCeKfx",
    description: "Narrative song with moderate vocabulary and good rhythm"
  },
  {
    title: "Veinte Años",
    artist: "Buena Vista Social Club",
    level: 2,
    spotifyId: "5lDriBxJd7bHihTngtQ5Gg",
    description: "Classic bolero with poetic but accessible language"
  },

  // Level 3 - More complex
  {
    title: "Candela",
    artist: "Buena Vista Social Club",
    level: 3,
    spotifyId: "4N6PN74VRlB7nGUTDzeJLH",
    description: "Upbeat son with faster tempo and Cuban slang"
  },
  {
    title: "De Camino a La Vereda",
    artist: "Buena Vista Social Club",
    level: 3,
    spotifyId: "1WPcCMHWJN92wSymqFqtdx",
    description: "Traditional son with rural vocabulary and metaphors"
  },
  {
    title: "Pueblo Nuevo",
    artist: "Buena Vista Social Club",
    level: 3,
    spotifyId: "48FCdVjOeCuL8pptbuBLqU",
    description: "Complex narrative with historical references"
  },

  // Level 4 - Complex lyrics and faster tempo
  {
    title: "El Carretero",
    artist: "Buena Vista Social Club",
    level: 4,
    spotifyId: "2vZMXRlErEJ6N1uMgFfccM",
    description: "Fast-paced guajira with rural Cuban vocabulary"
  },
  {
    title: "Orgullecida",
    artist: "Buena Vista Social Club",
    level: 4,
    spotifyId: "0e6U7W0hC82pvdojiJPseC",
    description: "Complex bolero with sophisticated vocabulary"
  },

  // Level 5 - Most challenging
  {
    title: "La Bayamesa",
    artist: "Buena Vista Social Club",
    level: 5,
    spotifyId: "5R8HjJYQXvSypwZt1vnKpI",
    description: "Traditional son with archaic language and cultural references"
  }
]

async function addBuenaVistaSocialClubSongs() {
  console.log('🎵 Adding Buena Vista Social Club songs to database...')

  try {
    let successCount = 0
    let skipCount = 0

    for (const song of buenaVistaSongs) {
      // Check if song already exists
      const existing = await prisma.song.findFirst({
        where: {
          OR: [
            { spotifyId: song.spotifyId },
            {
              AND: [
                { title: song.title },
                { artist: song.artist }
              ]
            }
          ]
        }
      })

      if (existing) {
        console.log(`⏭️  Song "${song.title}" already exists, skipping...`)
        skipCount++
        continue
      }

      // Create the song
      const levelName = getLevelName(song.level)

      const newSong = await prisma.song.create({
        data: {
          title: song.title,
          artist: song.artist,
          spotifyId: song.spotifyId,
          level: song.level,
          levelName: levelName,
          description: song.description,
          language: 'es',
          isActive: true,
          hasLyrics: false, // Will be updated when hydrated
          hasTranslations: false, // Will be updated when hydrated
          synced: false // Will be updated when hydrated
        }
      })

      console.log(`✅ Added: ${newSong.title} (Level ${newSong.level})`)
      successCount++
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Successfully added: ${successCount} songs`)
    console.log(`⏭️  Skipped (already exist): ${skipCount} songs`)
    console.log(`📝 Total processed: ${buenaVistaSongs.length} songs`)

    // Show distribution across levels
    console.log('\n📈 Level Distribution:')
    for (let level = 1; level <= 5; level++) {
      const count = buenaVistaSongs.filter(s => s.level === level).length
      if (count > 0) {
        console.log(`   Level ${level}: ${count} songs`)
      }
    }

    console.log('\n💡 Next steps:')
    console.log('1. Run the hydration script to fetch lyrics and metadata from Spotify/Musixmatch')
    console.log('2. Example hydration command:')

    // Get the IDs of newly added songs for easy hydration
    const newSongs = await prisma.song.findMany({
      where: {
        artist: "Buena Vista Social Club",
        lyricsRaw: null
      },
      select: {
        id: true,
        title: true
      }
    })

    if (newSongs.length > 0) {
      console.log('\n🎵 Songs ready for hydration:')
      newSongs.forEach(song => {
        console.log(`   ${song.title}: ${song.id}`)
      })

      console.log('\n📝 Hydration commands:')
      newSongs.forEach(song => {
        console.log(`DATABASE_URL="file:./dev.db" SPOTIFY_CLIENT_ID="074c9198ca534a588df3b95c7eaf2e98" SPOTIFY_CLIENT_SECRET="b6911b7446704d61acdb47af4d2c2489" MUSIXMATCH_API_KEY="b6bdee9e895ac0d91209a79a31498440" MUSIXMATCH_FULL_LYRICS="true" TRANSLATOR=openai OPENAI_API_KEY="$OPENAI_API_KEY" npx tsx scripts/songHydration.ts ${song.id}`)
      })
    }

  } catch (error) {
    console.error('❌ Error adding songs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function getLevelName(level: number): string {
  const levelNames: { [key: number]: string } = {
    1: "Beginner",
    2: "Upper Beginner",
    3: "Intermediate",
    4: "Upper Intermediate",
    5: "Advanced"
  }
  return levelNames[level] || "Unknown"
}

// Run the script
addBuenaVistaSocialClubSongs()