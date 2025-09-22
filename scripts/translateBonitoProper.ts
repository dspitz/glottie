import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

config({ path: '.env.local' })

const prisma = new PrismaClient()

async function translateBonito() {
  const songId = 'cmfm3ztxq000w8mv3rhzmx0bw'

  // Delete existing translation
  await prisma.translation.deleteMany({
    where: { songId }
  })
  console.log('✅ Deleted existing translations')

  // Get the song
  const song = await prisma.song.findUnique({
    where: { id: songId }
  })

  if (!song || !song.lyricsRaw) {
    console.log('❌ Song not found or no lyrics')
    return
  }

  // Parse lyrics
  const parsed = JSON.parse(song.lyricsRaw)
  const lines = parsed.lines || []

  console.log(`📝 Translating ${lines.length} lines from "${song.title}"`)

  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  // Batch translate - split into chunks to avoid token limits
  const chunkSize = 10
  const translations: string[] = []

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize)
    const chunkText = chunk.join('\n')

    console.log(`Translating lines ${i + 1}-${Math.min(i + chunkSize, lines.length)}...`)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional Spanish to English translator for song lyrics. Translate each line preserving the meaning and poetic nature. Return ONLY the translations, one per line, maintaining the exact same number of lines as the input. If a line is empty, return an empty line. Do not add any explanations or notes.'
          },
          {
            role: 'user',
            content: chunkText
          }
        ],
        temperature: 0.3
      })

      const translatedText = response.choices[0].message.content?.trim() || ''
      const translatedLines = translatedText.split('\n')

      // Ensure we have the same number of lines
      if (translatedLines.length !== chunk.length) {
        console.warn(`⚠️ Line count mismatch: expected ${chunk.length}, got ${translatedLines.length}`)
        // Pad or trim as needed
        while (translatedLines.length < chunk.length) {
          translatedLines.push(chunk[translatedLines.length]) // Use original as fallback
        }
        if (translatedLines.length > chunk.length) {
          translatedLines.splice(chunk.length)
        }
      }

      translations.push(...translatedLines)

      // Rate limiting
      await new Promise(r => setTimeout(r, 500))

    } catch (error) {
      console.error(`❌ Error translating chunk at line ${i + 1}:`, error)
      // Keep original lines on error
      translations.push(...chunk)
    }
  }

  console.log(`✅ Translated ${translations.length} lines`)

  // Save to database
  await prisma.translation.create({
    data: {
      songId: song.id,
      targetLang: 'en',
      lyricsLines: JSON.stringify(translations),
      title: song.title, // We'll translate the title too
      provider: 'openai',
      confidence: 0.95
    }
  })

  console.log('✅ Saved translations to database')

  // Verify the first few translations
  console.log('\n📚 Sample translations:')
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log(`  ES: ${lines[i]}`)
    console.log(`  EN: ${translations[i]}`)
    console.log('')
  }

  await prisma.$disconnect()
}

translateBonito().catch(console.error)