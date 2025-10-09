import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding verified French songs for levels 2-5...\n')

  // Songs to add (without spotifyId - will be found during hydration)
  const songs = [
    // Level 2
    { title: 'Je veux', artist: 'Zaz', level: 2 },
    { title: 'Formidable', artist: 'Stromae', level: 2 },
    { title: 'Tout oublier', artist: 'Angèle', level: 2 },
    { title: 'On ira', artist: 'Zaz', level: 2 },

    // Level 3
    { title: 'Alors on danse', artist: 'Stromae', level: 3 },
    { title: 'Balance ton quoi', artist: 'Angèle', level: 3 },
    { title: 'Comme des enfants', artist: 'Cœur de pirate', level: 3 },

    // Level 4
    { title: 'Je l\'aime à mourir', artist: 'Francis Cabrel', level: 4 },
    { title: 'L\'aventurier', artist: 'Indochine', level: 4 },

    // Level 5
    { title: 'L\'enfer', artist: 'Stromae', level: 5 },
    { title: 'Djadja', artist: 'Aya Nakamura', level: 5 },
  ]

  for (const songData of songs) {
    const { title, artist, level } = songData

    // Check if song already exists
    const existing = await prisma.song.findFirst({
      where: {
        title,
        artist,
        language: 'fr',
      }
    })

    if (existing) {
      console.log(`⏭️  Skipping ${title} - ${artist} (already exists)`)
      continue
    }

    // Get the next order number for this level
    const lastSong = await prisma.song.findFirst({
      where: { language: 'fr', level },
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastSong?.order || 0) + 1

    // Create the song (without spotifyId - hydration will find it)
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        level,
        language: 'fr',
        order: nextOrder,
      }
    })

    console.log(`✅ Added: ${title} - ${artist} (Level ${level}, Order ${nextOrder})`)
    console.log(`   Song ID: ${song.id}`)
  }

  console.log('\n✨ Done! Songs ready for hydration.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
