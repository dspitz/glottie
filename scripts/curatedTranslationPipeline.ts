#!/usr/bin/env tsx

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { translate } from '@/packages/adapters/translate'

config({ path: '.env.local' })

const prisma = new PrismaClient()

interface TranslationProgress {
  total: number
  completed: number
  failed: number
  skipped: number
  currentLevel: number
}

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

        const waitTime = Math.pow(2, attempt) * 2000 // 4s, 8s, 16s
        console.log(`    ⏳ Rate limited, waiting ${waitTime/1000}s before retry ${attempt}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else {
        throw error
      }
    }
  }
  throw new Error('Failed after all retries')
}

async function curatedTranslationPipeline() {
  console.log('🌍 Curated Translation Pipeline for Spanish Learning Songs')
  console.log('=' + '='.repeat(70))

  try {
    // Get curated songs with lyrics that need translations
    const songsToTranslate = await prisma.song.findMany({
      where: {
        level: { in: [1, 2, 3, 4, 5] },
        isActive: true,
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
        level: true,
        levelName: true,
        order: true,
        lyricsRaw: true
      },
      orderBy: [
        { level: 'asc' },
        { order: 'asc' }
      ]
    })

    console.log(`📊 Found ${songsToTranslate.length} curated songs needing English translations`)

    if (songsToTranslate.length === 0) {
      console.log('✅ All curated songs with lyrics already have translations!')
      return
    }

    const progress: TranslationProgress = {
      total: songsToTranslate.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      currentLevel: 1
    }

    // Group by level for better organization
    const songsByLevel = songsToTranslate.reduce((acc, song) => {
      if (!acc[song.level!]) acc[song.level!] = []
      acc[song.level!].push(song)
      return acc
    }, {} as Record<number, typeof songsToTranslate>)

    console.log('\n📋 Translation Plan:')
    Object.keys(songsByLevel).forEach(level => {
      const levelSongs = songsByLevel[Number(level)]
      console.log(`  Level ${level}: ${levelSongs.length} songs (${levelSongs[0]?.levelName})`)
    })

    for (const level of [1, 2, 3, 4, 5]) {
      if (!songsByLevel[level]) continue

      const levelSongs = songsByLevel[level]
      progress.currentLevel = level

      console.log(`\n🎯 Processing Level ${level} (${levelSongs[0]?.levelName}) - ${levelSongs.length} songs`)
      console.log('-'.repeat(60))

      for (let i = 0; i < levelSongs.length; i++) {
        const song = levelSongs[i]
        const songProgress = `[Level ${level}: ${i + 1}/${levelSongs.length}]`
        const overallProgress = `[Overall: ${progress.completed + progress.failed + progress.skipped + 1}/${progress.total}]`

        try {
          console.log(`${overallProgress} ${songProgress} "${song.title}" by ${song.artist}`)

          if (!song.lyricsRaw) {
            console.log(`  ⚠️ No lyrics available, skipping`)
            progress.skipped++
            continue
          }

          // Parse lyrics - handle both string and JSON formats
          let lyrics: string[] = []
          try {
            const parsed = JSON.parse(song.lyricsRaw)
            if (parsed.lines && Array.isArray(parsed.lines)) {
              lyrics = parsed.lines
            } else if (parsed.synchronized?.lines) {
              lyrics = parsed.synchronized.lines.map((line: any) => line.text || line)
            } else {
              lyrics = song.lyricsRaw.split('\n').filter(line => line.trim().length > 0)
            }
          } catch {
            lyrics = song.lyricsRaw.split('\n').filter(line => line.trim().length > 0)
          }

          if (lyrics.length === 0) {
            console.log(`  ⚠️ No parseable lyrics found, skipping`)
            progress.skipped++
            continue
          }

          console.log(`  📝 Translating ${lyrics.length} lines...`)

          // Translate lines individually with progress tracking
          const translatedLines: string[] = []
          const startTime = Date.now()

          for (let lineIndex = 0; lineIndex < lyrics.length; lineIndex++) {
            const line = lyrics[lineIndex].trim()

            if (!line) {
              translatedLines.push('')
              continue
            }

            try {
              const translation = await translateWithRetry(line, 'en')
              translatedLines.push(translation.text)

              // Show progress for long songs
              if (lineIndex > 0 && (lineIndex % 10 === 0 || lineIndex === lyrics.length - 1)) {
                const elapsed = Math.round((Date.now() - startTime) / 1000)
                console.log(`    Progress: ${lineIndex + 1}/${lyrics.length} lines (${elapsed}s elapsed)`)
              }

              // Respect DeepL rate limits (5 requests per second max)
              await new Promise(resolve => setTimeout(resolve, 300))

            } catch (lineError) {
              console.error(`    Failed line ${lineIndex + 1}: ${lineError}`)
              translatedLines.push(line) // Keep original if translation fails
            }
          }

          // Translate the title
          const titleTranslation = await translateWithRetry(song.title, 'en')

          // Save translation to database
          await prisma.translation.upsert({
            where: {
              songId_targetLang: {
                songId: song.id,
                targetLang: 'en'
              }
            },
            update: {
              lyricsLines: JSON.stringify(translatedLines),
              title: titleTranslation.text,
              provider: titleTranslation.provider,
              confidence: 0.85
            },
            create: {
              songId: song.id,
              targetLang: 'en',
              lyricsLines: JSON.stringify(translatedLines),
              title: titleTranslation.text,
              provider: titleTranslation.provider,
              confidence: 0.85
            }
          })

          progress.completed++
          const totalTime = Math.round((Date.now() - startTime) / 1000)
          console.log(`  ✅ Completed in ${totalTime}s - "${titleTranslation.text}"`)

          // Longer delay between songs to be respectful of rate limits
          await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (error) {
          console.error(`  ❌ Failed to translate: ${error}`)
          progress.failed++
        }
      }

      // Level completion summary
      const levelCompleted = levelSongs.length - (songsToTranslate.length - progress.completed - progress.failed - progress.skipped)
      console.log(`\n✅ Level ${level} complete: ${levelCompleted}/${levelSongs.length} songs translated`)

      // Brief pause between levels
      if (level < 5) {
        console.log('⏳ Pausing 5 seconds before next level...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(70))
    console.log('🎉 Curated Translation Pipeline Complete!')
    console.log(`📊 Results:`)
    console.log(`  ✅ Successfully translated: ${progress.completed}/${progress.total} songs (${Math.round(progress.completed/progress.total*100)}%)`)
    console.log(`  ❌ Failed: ${progress.failed} songs`)
    console.log(`  ⚠️ Skipped (no lyrics): ${progress.skipped} songs`)

    // Quality verification
    const translationCount = await prisma.translation.count({
      where: { targetLang: 'en' }
    })

    console.log(`\n📈 Database Status:`)
    console.log(`  🌍 Total English translations: ${translationCount}`)

    // Sample translations for quality check
    const sampleTranslations = await prisma.translation.findMany({
      include: {
        song: {
          select: {
            title: true,
            artist: true,
            level: true
          }
        }
      },
      where: { targetLang: 'en' },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    console.log('\n🔍 Recent Translations Sample:')
    sampleTranslations.forEach(translation => {
      console.log(`  Level ${translation.song.level}: "${translation.title}" (${translation.song.artist})`)
    })

    console.log('='.repeat(70))

  } catch (error) {
    console.error('❌ Fatal error:', error)
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
  curatedTranslationPipeline()
}

export { curatedTranslationPipeline }