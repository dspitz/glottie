import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { translate } from '@/packages/adapters/translate'

config({ path: '.env.local' })

const prisma = new PrismaClient()

const TARGET_LANGUAGES = ['en'] // Start with English only to test

async function batchTranslateContent() {
  console.log('Starting batch translation of educational content...')
  
  try {
    // Get all songs with lyrics (including those with partial translations)
    const songsToTranslate = await prisma.song.findMany({
      where: {
        lyricsRaw: { not: null }
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
      take: 10 // Process 10 songs at a time
    })

    console.log(`Found ${songsToTranslate.length} songs that need translations`)

    for (const song of songsToTranslate) {
      // Skip if already has English translation
      if (song.translations && song.translations.length > 0) {
        console.log(`\n✓ Skipping: ${song.artist} - ${song.title} (already has translation)`)
        continue
      }

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
              const translation = await translate(line, targetLang)
              translatedLines.push(translation.text)

              // Show progress for long songs
              if (i % 10 === 0 && i > 0) {
                console.log(`      Progress: ${i}/${lyrics.length} lines`)
              }

              // Longer delay to respect API rate limits (DeepL free tier: 3 requests per second)
              await new Promise(resolve => setTimeout(resolve, 500)) // 0.5 second between translations
            } catch (lineError) {
              console.error(`      Failed to translate line ${i + 1}: ${lineError}`)
              translatedLines.push(line) // Keep original if translation fails
            }
          }

          // Translate the title
          const titleTranslation = await translate(song.title, targetLang)
          
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
      
      // Longer delay between songs to respect API limits
      await new Promise(resolve => setTimeout(resolve, 1000))
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