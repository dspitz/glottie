import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const songs = await prisma.song.findMany({
    where: { language: 'fr' },
    select: {
      id: true,
      title: true,
      artist: true,
      level: true,
      lyricsProvider: true,
      _count: {
        select: {
          translations: true
        }
      }
    },
    orderBy: [{ level: 'asc' }, { order: 'asc' }]
  })

  console.log('French songs after hydration:\n')

  const byLevel = songs.reduce((acc: any, s: any) => {
    if (!acc[s.level]) acc[s.level] = []
    acc[s.level].push(s)
    return acc
  }, {})

  Object.keys(byLevel)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(level => {
      const levelSongs = byLevel[level]
      console.log(`Level ${level} (${levelSongs.length} songs):`)
      levelSongs.forEach((s: any) => {
        const hasLyrics = s.lyricsProvider ? '✅' : '❌'
        const hasTranslation = s._count.translations > 0 ? '✅' : '❌'
        console.log(`  ${hasLyrics} ${hasTranslation} ${s.title} - ${s.artist}`)
      })
      console.log('')
    })

  console.log(`Total: ${songs.length} French songs`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
