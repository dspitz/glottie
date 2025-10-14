/**
 * Test Script: Vocabulary Enrichment
 *
 * Tests the GPT-based multi-language vocabulary enrichment system
 */

import { enrichVocabularyBatch, detectIdioms } from '../lib/vocabularyEnrichment'

async function main() {
  console.log('🧪 Testing Vocabulary Enrichment System\n')
  console.log('=' .repeat(60))

  // Test 1: Enrich Spanish vocabulary words
  console.log('\n📚 Test 1: Enriching Spanish Vocabulary Words')
  console.log('-'.repeat(60))

  const spanishWords = ['amor', 'tengo', 'negra', 'corazón', 'bailar']

  try {
    const enriched = await enrichVocabularyBatch(spanishWords, 'es', ['en', 'zh', 'fr'])

    enriched.forEach((word) => {
      console.log(`\n✨ ${word.word}`)
      console.log(`   Part of Speech: ${word.partOfSpeech}`)
      console.log(`   Root: ${word.root || 'N/A'}`)
      console.log(`   Translations:`)
      Object.entries(word.translations).forEach(([lang, translation]) => {
        console.log(`     ${lang}: ${translation}`)
      })
      console.log(`   Definition: ${word.definition}`)
      console.log(`   Example: ${word.exampleSentence}`)
      if (word.conjugations) {
        console.log(`   Has conjugations: Yes`)
      }
      if (word.synonyms && word.synonyms.length > 0) {
        console.log(`   Synonyms: ${word.synonyms.join(', ')}`)
      }
      console.log(`   Usefulness Score: ${word.usefulnessScore?.toFixed(2) || 'N/A'}`)
    })

    console.log(`\n✅ Successfully enriched ${enriched.length} words`)
  } catch (error) {
    console.error('❌ Error enriching vocabulary:', error)
  }

  // Test 2: Detect idioms in Spanish lyrics
  console.log('\n\n🎭 Test 2: Detecting Idioms in Spanish Lyrics')
  console.log('-'.repeat(60))

  const sampleLyrics = [
    'Echar de menos tu amor',
    'Me quedé con las ganas',
    'Llorar a mares toda la noche',
    'Tienes razón, mi vida',
    'Meter la pata una vez más',
  ]

  try {
    const idioms = await detectIdioms(sampleLyrics, 'es', ['en', 'zh'])

    if (idioms.length === 0) {
      console.log('ℹ️  No idioms detected in the sample lyrics')
    } else {
      idioms.forEach((idiom, index) => {
        console.log(`\n🎯 Idiom ${index + 1}: "${idiom.phrase}"`)
        console.log(`   Literal: ${idiom.literalTranslation || 'N/A'}`)
        console.log(`   Meaning: ${idiom.meaning}`)
        console.log(`   Translations:`)
        Object.entries(idiom.translations).forEach(([lang, translation]) => {
          console.log(`     ${lang}: ${translation}`)
        })
        if (idiom.culturalContext) {
          console.log(`   Cultural Context: ${idiom.culturalContext}`)
        }
        if (idiom.examples && idiom.examples.length > 0) {
          console.log(`   Examples:`)
          idiom.examples.forEach((ex) => console.log(`     - ${ex}`))
        }
      })

      console.log(`\n✅ Successfully detected ${idioms.length} idioms`)
    }
  } catch (error) {
    console.error('❌ Error detecting idioms:', error)
  }

  // Test 3: French vocabulary (if supported)
  console.log('\n\n🇫🇷 Test 3: Enriching French Vocabulary Words')
  console.log('-'.repeat(60))

  const frenchWords = ['amour', 'cœur', 'vie']

  try {
    const enrichedFrench = await enrichVocabularyBatch(frenchWords, 'fr', ['en', 'es', 'zh'])

    enrichedFrench.forEach((word) => {
      console.log(`\n✨ ${word.word}`)
      console.log(`   Translations:`)
      Object.entries(word.translations).forEach(([lang, translation]) => {
        console.log(`     ${lang}: ${translation}`)
      })
      console.log(`   Definition: ${word.definition}`)
    })

    console.log(`\n✅ Successfully enriched ${enrichedFrench.length} French words`)
  } catch (error) {
    console.error('❌ Error enriching French vocabulary:', error)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Testing Complete!')
  console.log('='.repeat(60))
}

main()
