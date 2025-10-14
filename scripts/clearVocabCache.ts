/**
 * Clear Vocabulary Enrichment Cache
 *
 * Deletes all cached enriched vocabulary so songs will be re-enriched
 * with the expanded tense list on next visit.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearVocabCache() {
  try {
    console.log('Clearing vocabulary enrichment cache...')

    const result = await prisma.vocabularyEnriched.deleteMany({})

    console.log(`✅ Deleted ${result.count} cached vocabulary entries`)
    console.log('\nNext time you visit a song, it will be re-enriched with all 8 tenses:')
    console.log('  - Present')
    console.log('  - Preterite/Passé Composé')
    console.log('  - Imperfect')
    console.log('  - Future')
    console.log('  - Conditional')
    console.log('  - Subjunctive')
    console.log('  - Present Perfect (optional)')
    console.log('  - Pluperfect (optional)')

  } catch (error) {
    console.error('Error clearing cache:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

clearVocabCache()
