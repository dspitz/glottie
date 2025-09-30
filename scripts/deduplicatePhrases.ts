#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deduplicatePhrases() {
  console.log('🔍 Starting phrase deduplication...\n')

  try {
    // Get all phrases
    const allPhrases = await prisma.phrase.findMany({
      include: {
        song: {
          select: {
            title: true,
            artist: true
          }
        }
      },
      orderBy: {
        usefulnessScore: 'desc'
      }
    })

    console.log(`Found ${allPhrases.length} total phrases`)

    // Group phrases by normalized translated text
    const phraseGroups = new Map<string, typeof allPhrases>()

    for (const phrase of allPhrases) {
      // Normalize: lowercase, trim, remove punctuation at end
      const normalized = phrase.translatedText
        .toLowerCase()
        .trim()
        .replace(/[.!?]+$/, '')

      if (!phraseGroups.has(normalized)) {
        phraseGroups.set(normalized, [])
      }
      phraseGroups.get(normalized)!.push(phrase)
    }

    console.log(`Found ${phraseGroups.size} unique phrases (after normalization)`)

    // Keep only the best instance of each phrase (highest score, earliest occurrence)
    const phrasesToKeep = new Set<string>()
    const phrasesToDelete = new Set<string>()

    for (const [normalized, phrases] of phraseGroups) {
      // Sort by score (desc), then by creation date (asc)
      phrases.sort((a, b) => {
        if (a.usefulnessScore !== b.usefulnessScore) {
          return b.usefulnessScore - a.usefulnessScore
        }
        return a.createdAt.getTime() - b.createdAt.getTime()
      })

      // Keep the first one, mark rest for deletion
      phrasesToKeep.add(phrases[0].id)
      for (let i = 1; i < phrases.length; i++) {
        phrasesToDelete.add(phrases[i].id)
      }
    }

    console.log(`\nKeeping ${phrasesToKeep.size} phrases`)
    console.log(`Deleting ${phrasesToDelete.size} duplicate phrases`)

    // Delete duplicates
    if (phrasesToDelete.size > 0) {
      const deleteResult = await prisma.phrase.deleteMany({
        where: {
          id: {
            in: Array.from(phrasesToDelete)
          }
        }
      })
      console.log(`✅ Deleted ${deleteResult.count} duplicate phrases`)
    }

    // Update category counts
    const categories = await prisma.phraseCategory.findMany()
    for (const category of categories) {
      const count = await prisma.phrase.count({
        where: { category: category.name }
      })
      await prisma.phraseCategory.update({
        where: { id: category.id },
        data: { phraseCount: count }
      })
    }

    // Show top 10 remaining phrases
    const topPhrases = await prisma.phrase.findMany({
      take: 10,
      orderBy: { usefulnessScore: 'desc' },
      include: {
        song: {
          select: {
            title: true,
            artist: true
          }
        }
      }
    })

    console.log('\n🌟 Top 10 phrases after deduplication:')
    topPhrases.forEach((phrase, i) => {
      console.log(`  ${i + 1}. "${phrase.translatedText}"`)
      console.log(`     Score: ${phrase.usefulnessScore.toFixed(3)} | From: ${phrase.song.title}`)
    })

    console.log('\n✅ Deduplication complete!')

  } catch (error) {
    console.error('Error during deduplication:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
deduplicatePhrases().catch(console.error)