import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { translate } from '@/packages/adapters/translate'

config({ path: '.env.local' })

const prisma = new PrismaClient()

async function translateSingleSong(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      translations: {
        where: { targetLang: 'en' }
      }
    }
  })

  if (!song || !song.lyricsRaw) {
    console.log('Song not found or no lyrics')
    return
  }

  if (song.translations.length > 0) {
    console.log('Song already has translation')
    return
  }

  console.log('Translating:', song.artist, '-', song.title)

  // Parse lyrics
  let lines: string[] = []
  try {
    const parsed = JSON.parse(song.lyricsRaw)
    lines = parsed.lines || []
  } catch {
    lines = song.lyricsRaw.split('\n').filter(l => l.trim())
  }

  console.log('Total lines to translate:', lines.length)

  // Translate all lines
  const translations: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (i % 10 === 0 && i > 0) {
      console.log(`Progress: ${i}/${lines.length} lines`)
    }

    try {
      const result = await translate(line, 'en')
      translations.push(result.text)
      await new Promise(r => setTimeout(r, 500)) // Rate limit
    } catch (err) {
      console.error(`Failed to translate line ${i + 1}:`, err)
      translations.push(line) // Keep original if translation fails
    }
  }

  // Translate title
  const titleTranslation = await translate(song.title, 'en')

  // Save to database
  await prisma.translation.create({
    data: {
      songId: song.id,
      targetLang: 'en',
      lyricsLines: JSON.stringify(translations),
      title: titleTranslation.text,
      provider: 'deepl',
      confidence: 0.9
    }
  })

  console.log(`✅ Saved ${translations.length} translations for "${song.title}"`)

  await prisma.$disconnect()
}

// Run if called directly
if (require.main === module) {
  const songId = process.argv[2] || 'cmfc1wrk70010wo78i23c1x98' // Te Esperé
  translateSingleSong(songId)
}

export { translateSingleSong }