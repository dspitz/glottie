import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkFrenchSongs() {
  const songs = await prisma.song.findMany({
    where: {
      language: 'fr',
      level: 1
    },
    select: {
      id: true,
      title: true,
      artist: true,
      spotifyId: true,
      lyricsRaw: true,
      albumArt: true,
      translations: {
        select: {
          targetLang: true,
          lyricsLines: true,
          provider: true
        }
      }
    },
    orderBy: {
      title: 'asc'
    }
  })

  console.log('French Level 1 Songs Status:\n')

  songs.forEach(song => {
    const hasLyrics = song.lyricsRaw && song.lyricsRaw.includes('synchronized')
    const translation = song.translations.find(t => t.targetLang === 'en')
    const hasTranslation = translation && translation.lyricsLines
    const translationProvider = translation?.provider || 'none'

    console.log(`${song.title} by ${song.artist}`)
    console.log(`  - Spotify ID: ${song.spotifyId}`)
    console.log(`  - Album Art: ${song.albumArt ? 'YES' : 'NO'}`)
    console.log(`  - Lyrics: ${hasLyrics ? 'YES' : 'NO'}`)
    console.log(`  - Translation: ${hasTranslation ? 'YES' : 'NO'} (provider: ${translationProvider})`)

    if (hasTranslation && translation.lyricsLines) {
      const lines = JSON.parse(translation.lyricsLines)
      console.log(`  - First line: ${lines[0]}`)
    }
    console.log('')
  })

  await prisma.$disconnect()
}

checkFrenchSongs()
