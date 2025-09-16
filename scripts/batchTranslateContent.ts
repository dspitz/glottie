import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { translate } from '@/packages/adapters/translate'

config({ path: '.env.local' })

const prisma = new PrismaClient()

const TARGET_LANGUAGES = ['en'] // Start with English only to test

// Enhanced retry logic for rate limiting
async function translateWithRetry(text: string, targetLang: string, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await translate(text, targetLang)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        if (attempt === maxRetries) {
          console.error(`    ✗ Max retries reached for: "${text.substring(0, 50)}..."`)
          throw error
        }

        // Exponential backoff: 2s, 4s, 8s
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`    ⏳ Rate limited, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else {
        throw error
      }
    }
  }
  throw new Error('Failed after all retries')
}

async function batchTranslateContent() {
  console.log('Starting batch translation of educational content...')

  try {
    // Get songs that don't have English translations
    const songsToTranslate = await prisma.song.findMany({
      where: {
        lyricsRaw: { not: null },
        translations: {
          none: {
            targetLang: 'en'
          }
        }
      },
      select: {
        id: true,
        title: true,
        artist: true,
        lyricsRaw: true,
        translations: {
          where: {
            targetLang: 'en'
          }
        }
      },
      take: 5 // Process 5 songs at a time to reduce rate limiting
    })

    console.log(`Found ${songsToTranslate.length} songs that need translations`)

    for (const song of songsToTranslate) {
      // Songs are already filtered to not have English translations, so no need to skip

      console.log(`\nTranslating: ${song.artist} - ${song.title}`)

      if (!song.lyricsRaw) continue

      // Parse lyrics - handle both string and JSON formats
      let lyrics: string[] = []
      try {
        const parsed = JSON.parse(song.lyricsRaw)
        if (parsed.lines && Array.isArray(parsed.lines)) {
          lyrics = parsed.lines
        } else {
          lyrics = song.lyricsRaw.split('\n').filter(line => line.trim().length > 0)
        }
      } catch {
        lyrics = song.lyricsRaw.split('\n').filter(line => line.trim().length > 0)
      }
      
      for (const targetLang of TARGET_LANGUAGES) {
        try {
          console.log(`  → Translating to ${targetLang}...`)
          
          // Translate lines individually to avoid payload size issues
          const translatedLines: string[] = []
          console.log(`    Translating ${lyrics.length} lines...`)

          for (let i = 0; i < lyrics.length; i++) {
            const line = lyrics[i]
            try {
              const translation = await translateWithRetry(line, targetLang)
              translatedLines.push(translation.text)

              // Show progress for long songs
              if (i % 10 === 0 && i > 0) {
                console.log(`      Progress: ${i}/${lyrics.length} lines`)
              }

              // Increased delay to respect API rate limits (DeepL free tier: 3 requests per second)
              await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second between translations
            } catch (lineError) {
              console.error(`      Failed to translate line ${i + 1}: ${lineError}`)
              translatedLines.push(line) // Keep original if translation fails
            }
          }

          // Translate the title with retry logic
          const titleTranslation = await translateWithRetry(song.title, targetLang)
          
          // Save translation to database
          await prisma.translation.upsert({
            where: {
              songId_targetLang: {
                songId: song.id,
                targetLang: targetLang
              }
            },
            update: {
              lyricsLines: JSON.stringify(translatedLines),
              title: titleTranslation.text,
              provider: titleTranslation.provider,
              confidence: 0.8 // Assuming good confidence for demo translations
            },
            create: {
              songId: song.id,
              targetLang: targetLang,
              lyricsLines: JSON.stringify(translatedLines),
              title: titleTranslation.text,
              provider: titleTranslation.provider,
              confidence: 0.8
            }
          })

          console.log(`    ✓ Saved ${targetLang} translation (${translatedLines.length} lines)`)
          
        } catch (error) {
          console.error(`    ✗ Failed to translate to ${targetLang}:`, error)
        }
      }

      // Much longer delay between songs to respect API limits
      await new Promise(resolve => setTimeout(resolve, 3000)) // 3 seconds between songs
    }

    // Summary
    const totalTranslations = await prisma.translation.count()
    console.log(`\n✅ Batch translation complete!`)
    console.log(`📊 Total translations in database: ${totalTranslations}`)
    
    // Show sample translations
    const sampleTranslations = await prisma.translation.findMany({
      include: {
        song: {
          select: {
            title: true,
            artist: true
          }
        }
      },
      take: 3
    })

    console.log('\n📝 Sample translations:')
    for (const translation of sampleTranslations) {
      console.log(`  ${translation.song.artist} - "${translation.title}" (${translation.targetLang})`)
    }

  } catch (error) {
    console.error('Batch translation failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

if (require.main === module) {
  batchTranslateContent()
}

export { batchTranslateContent }