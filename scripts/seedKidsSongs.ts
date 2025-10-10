import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SPANISH_KIDS_SONGS = [
  {
    title: 'La Vaca Lola',
    artist: 'La Granja de Zenón',
    language: 'es',
    level: 0,
  },
  {
    title: 'Pin Pon',
    artist: 'Canciones Infantiles',
    language: 'es',
    level: 0,
  },
  {
    title: 'Los Pollitos Dicen',
    artist: 'Canciones Infantiles',
    language: 'es',
    level: 0,
  },
  {
    title: 'Estrellita Dónde Estás',
    artist: 'Canciones Infantiles',
    language: 'es',
    level: 0,
  },
  {
    title: 'El Barquito Chiquitito',
    artist: 'Canciones Infantiles',
    language: 'es',
    level: 0,
  },
  {
    title: 'Debajo Un Botón',
    artist: 'Miliki',
    language: 'es',
    level: 0,
  },
  {
    title: 'Soy Una Taza',
    artist: 'Barney',
    language: 'es',
    level: 0,
  },
  {
    title: 'La Araña Pequeñita',
    artist: 'Canciones Infantiles',
    language: 'es',
    level: 0,
  },
]

const FRENCH_KIDS_SONGS = [
  {
    title: 'Frère Jacques',
    artist: 'Chansons Enfantines',
    language: 'fr',
    level: 0,
  },
  {
    title: 'Au Clair de la Lune',
    artist: 'Chansons Enfantines',
    language: 'fr',
    level: 0,
  },
  {
    title: 'Alouette',
    artist: 'Chansons Enfantines',
    language: 'fr',
    level: 0,
  },
  {
    title: 'Petit Escargot',
    artist: 'Chansons Enfantines',
    language: 'fr',
    level: 0,
  },
  {
    title: 'Une Souris Verte',
    artist: 'Chansons Enfantines',
    language: 'fr',
    level: 0,
  },
  {
    title: 'Savez-vous Planter les Choux',
    artist: 'Chansons Enfantines',
    language: 'fr',
    level: 0,
  },
  {
    title: 'Pomme de Reinette et Pomme d\'Api',
    artist: 'Chansons Enfantines',
    language: 'fr',
    level: 0,
  },
  {
    title: 'Sur le Pont d\'Avignon',
    artist: 'Chansons Enfantines',
    language: 'fr',
    level: 0,
  },
]

async function main() {
  console.log('🎵 Seeding kids songs (Level 0)...\n')

  const allSongs = [...SPANISH_KIDS_SONGS, ...FRENCH_KIDS_SONGS]

  for (const songData of allSongs) {
    // Check if song already exists
    const existing = await prisma.song.findFirst({
      where: {
        title: songData.title,
        artist: songData.artist,
      },
    })

    if (existing) {
      console.log(`⏭️  Skipping "${songData.title}" by ${songData.artist} (already exists)`)
      continue
    }

    const song = await prisma.song.create({
      data: songData,
    })

    console.log(`✅ Created: ${song.title} by ${song.artist} (${song.language.toUpperCase()}) - ID: ${song.id}`)
  }

  console.log('\n✨ Done! Kids songs seeded successfully.')
  console.log('\n📝 Next steps:')
  console.log('   Run songHydration.ts for each song ID to fetch lyrics and translations')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
