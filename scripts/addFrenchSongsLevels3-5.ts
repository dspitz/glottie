import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding French songs for levels 3-5...')

  const songs = [
    // Level 3 (1 more song)
    {
      title: 'Tous les mêmes',
      artist: 'Stromae',
      level: 3,
      language: 'fr',
      spotifyId: '0BRjO6ga9RKCKjfDqeFgWV', // Tous les mêmes
    },

    // Level 4 (5 songs)
    {
      title: 'Carmen',
      artist: 'Stromae',
      level: 4,
      language: 'fr',
      spotifyId: '3wMbFwGLAc0kCf3uLXwlJA', // Carmen
    },
    {
      title: 'Décollage',
      artist: 'Soprano',
      level: 4,
      language: 'fr',
      spotifyId: '6K4t31amVTZDgR3sKmwUJJ', // Décollage
    },
    {
      title: 'Désenchantée',
      artist: 'Mylène Farmer',
      level: 4,
      language: 'fr',
      spotifyId: '7tQ3xx8SpCfKtBdAvSORaJ', // Désenchantée
    },
    {
      title: 'Avenir',
      artist: 'Louane',
      level: 4,
      language: 'fr',
      spotifyId: '2dLLR6qlu5UJ5gk0ZH8EQI', // Avenir
    },
    {
      title: 'Pour un infidèle',
      artist: 'Céline Dion',
      level: 4,
      language: 'fr',
      spotifyId: '1pKYYY0dkg23sQQXi0Q5zN', // Pour un infidèle
    },

    // Level 5 (5 songs)
    {
      title: 'Ta reine',
      artist: 'Angèle',
      level: 5,
      language: 'fr',
      spotifyId: '2D8JP84coKxQszSyCvJY2R', // Ta reine
    },
    {
      title: 'Quand c\'est?',
      artist: 'Stromae',
      level: 5,
      language: 'fr',
      spotifyId: '3TUh5FA0YtaQAqwm5i7RpB', // Quand c'est?
    },
    {
      title: 'L\'enfer',
      artist: 'Stromae',
      level: 5,
      language: 'fr',
      spotifyId: '1vQKxtBAYa7Y8dEwZA1YOH', // L'enfer
    },
    {
      title: 'La même',
      artist: 'Maître Gims ft. Vianney',
      level: 5,
      language: 'fr',
      spotifyId: '3NUyPvnwT4lDchGTP91M6G', // La même
    },
    {
      title: 'La grenade',
      artist: 'Clara Luciani',
      level: 5,
      language: 'fr',
      spotifyId: '0NWPNLqYb0nZvznuTBSgzs', // La grenade
    },
  ]

  for (const songData of songs) {
    const { title, artist, level, language, spotifyId } = songData

    // Check if song already exists
    const existing = await prisma.song.findFirst({
      where: {
        title,
        artist,
        language,
      }
    })

    if (existing) {
      console.log(`⏭️  Skipping ${title} - ${artist} (already exists)`)
      continue
    }

    // Get the next order number for this level
    const lastSong = await prisma.song.findFirst({
      where: { language, level },
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastSong?.order || 0) + 1

    // Create the song
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        level,
        language,
        spotifyId,
        order: nextOrder,
      }
    })

    console.log(`✅ Added: ${title} - ${artist} (Level ${level}, Order ${nextOrder})`)
    console.log(`   Song ID: ${song.id}`)
  }

  console.log('\n✨ Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
