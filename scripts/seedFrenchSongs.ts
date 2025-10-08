import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const frenchSongs = [
  // Level 1 - Beginner
  {
    title: 'La Vie en Rose',
    artist: 'Édith Piaf',
    spotifyId: '4r8lRYnoOGdEh7iY561xQj',
    language: 'fr',
    level: 1,
    levelName: 'Beginner',
    isActive: true,
    album: 'La Vie en Rose',
    year: 1947
  },
  {
    title: 'Aux Champs-Élysées',
    artist: 'Joe Dassin',
    spotifyId: '1gOuEOxz4VEfvHEYs8Zckd',
    language: 'fr',
    level: 1,
    levelName: 'Beginner',
    isActive: true,
    album: 'Les Champs-Élysées',
    year: 1969
  },
  {
    title: 'Non, je ne regrette rien',
    artist: 'Édith Piaf',
    spotifyId: '4gn7vD8w2qwvOQ4CnJR2qN',
    language: 'fr',
    level: 1,
    levelName: 'Beginner',
    isActive: true,
    album: 'Non, je ne regrette rien',
    year: 1960
  },
  {
    title: 'Dernière Danse',
    artist: 'Indila',
    spotifyId: '3QzEtIGF4lAjRJ8jdcZUCN',
    language: 'fr',
    level: 1,
    levelName: 'Beginner',
    isActive: true,
    album: 'Mini World',
    year: 2014
  },
  {
    title: 'La Foule',
    artist: 'Édith Piaf',
    spotifyId: '6bpDDH8pF2Bf54wDfOGKMG',
    language: 'fr',
    level: 1,
    levelName: 'Beginner',
    isActive: true,
    album: 'La Foule',
    year: 1957
  },

  // Level 2 - Upper Beginner
  {
    title: 'Papaoutai',
    artist: 'Stromae',
    spotifyId: '5Eije3VfoMNxv2ps4r3Rfy',
    language: 'fr',
    level: 2,
    levelName: 'Upper Beginner',
    isActive: true,
    album: 'Racine Carrée',
    year: 2013
  },
  {
    title: 'Formidable',
    artist: 'Stromae',
    spotifyId: '2XGvVtt6xJ9QZwsAtukxZP',
    language: 'fr',
    level: 2,
    levelName: 'Upper Beginner',
    isActive: true,
    album: 'Racine Carrée',
    year: 2013
  },
  {
    title: 'Je veux',
    artist: 'Zaz',
    spotifyId: '1Gqos7UrWvjYwvkU1M5sCR',
    language: 'fr',
    level: 2,
    levelName: 'Upper Beginner',
    isActive: true,
    album: 'Zaz',
    year: 2010
  },
  {
    title: 'Tout oublier',
    artist: 'Angèle',
    spotifyId: '2HRqTpkrJO5gguehhxj5wt',
    language: 'fr',
    level: 2,
    levelName: 'Upper Beginner',
    isActive: true,
    album: 'Brol',
    year: 2018
  },
  {
    title: "L'amour existe encore",
    artist: 'Céline Dion',
    spotifyId: '6oGBxEbGSUj23EZJlEJ9Gm',
    language: 'fr',
    level: 2,
    levelName: 'Upper Beginner',
    isActive: true,
    album: 'Dion chante Plamondon',
    year: 1991
  },

  // Level 3 - Intermediate
  {
    title: 'Alors on danse',
    artist: 'Stromae',
    spotifyId: '2LorMQF6vHAHmbTiMJcvqV',
    language: 'fr',
    level: 3,
    levelName: 'Intermediate',
    isActive: true,
    album: 'Cheese',
    year: 2010
  },
  {
    title: 'Balance ton quoi',
    artist: 'Angèle',
    spotifyId: '0WmH9coPJvGeIzCg0wCGdr',
    language: 'fr',
    level: 3,
    levelName: 'Intermediate',
    isActive: true,
    album: 'Brol',
    year: 2018
  },
  {
    title: 'La Seine',
    artist: 'Vanessa Paradis',
    spotifyId: '1RbFTyFNcRpyGHPYxS4GgF',
    language: 'fr',
    level: 3,
    levelName: 'Intermediate',
    isActive: true,
    album: 'A Monster in Paris',
    year: 2011
  },
  {
    title: 'Comme des enfants',
    artist: 'Cœur de Pirate',
    spotifyId: '6VDNzWqJPSABhJyB5fQJDf',
    language: 'fr',
    level: 3,
    levelName: 'Intermediate',
    isActive: true,
    album: 'Cœur de Pirate',
    year: 2008
  }
]

async function seedFrenchSongs() {
  console.log('🇫🇷 Seeding French songs...\n')

  let created = 0
  let skipped = 0

  for (const song of frenchSongs) {
    try {
      // Check if song already exists
      const existing = await prisma.song.findUnique({
        where: { spotifyId: song.spotifyId }
      })

      if (existing) {
        console.log(`⏭️  Skipped: ${song.title} by ${song.artist} (already exists)`)
        skipped++
        continue
      }

      await prisma.song.create({
        data: song
      })
      console.log(`✅ Added: ${song.title} by ${song.artist} (Level ${song.level})`)
      created++
    } catch (error) {
      console.error(`❌ Error adding ${song.title}:`, error)
    }
  }

  console.log(`\n✨ Seeding complete!`)
  console.log(`   Created: ${created} songs`)
  console.log(`   Skipped: ${skipped} songs`)
  console.log(`   Total: ${frenchSongs.length} songs\n`)
}

seedFrenchSongs()
  .catch((error) => {
    console.error('Error seeding French songs:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
