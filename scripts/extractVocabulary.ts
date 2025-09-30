#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { getTopVocabulary, scoreVocabularyWord } from '../packages/core/vocabularyScoring'
import { translateText } from '../lib/client'

const prisma = new PrismaClient()

// Simple translation function (fallback when API not available)
async function getTranslation(word: string): Promise<string> {
  // Common Spanish-English translations for testing
  const commonTranslations: Record<string, string> = {
    'bailar': 'to dance',
    'corazón': 'heart',
    'amor': 'love',
    'vida': 'life',
    'canción': 'song',
    'noche': 'night',
    'día': 'day',
    'tiempo': 'time',
    'mundo': 'world',
    'gente': 'people',
    'casa': 'house',
    'mano': 'hand',
    'ojos': 'eyes',
    'agua': 'water',
    'tierra': 'earth',
    'fuego': 'fire',
    'aire': 'air',
    'cielo': 'sky',
    'sol': 'sun',
    'luna': 'moon',
    'estrella': 'star',
    'mar': 'sea',
    'río': 'river',
    'montaña': 'mountain',
    'árbol': 'tree',
    'flor': 'flower',
    'camino': 'path',
    'ciudad': 'city',
    'país': 'country',
    'amigo': 'friend',
    'familia': 'family',
    'hijo': 'son',
    'hija': 'daughter',
    'madre': 'mother',
    'padre': 'father',
    'hermano': 'brother',
    'hermana': 'sister',
    'trabajo': 'work',
    'escuela': 'school',
    'libro': 'book',
    'música': 'music',
    'comida': 'food',
    'bebida': 'drink',
    'cuerpo': 'body',
    'alma': 'soul',
    'mente': 'mind',
    'sueño': 'dream',
    'esperanza': 'hope',
    'miedo': 'fear',
    'alegría': 'joy',
    'tristeza': 'sadness',
    'felicidad': 'happiness',
    'dolor': 'pain',
    'risa': 'laughter',
    'llanto': 'crying',
    'beso': 'kiss',
    'abrazo': 'hug',
    'palabra': 'word',
    'voz': 'voice',
    'silencio': 'silence',
    'ruido': 'noise',
    'color': 'color',
    'luz': 'light',
    'sombra': 'shadow',
    'verdad': 'truth',
    'mentira': 'lie',
    'belleza': 'beauty',
    'fuerza': 'strength',
    'debilidad': 'weakness',
    'guerra': 'war',
    'paz': 'peace',
    'libertad': 'freedom',
    'destino': 'destiny',
    'caminar': 'to walk',
    'correr': 'to run',
    'saltar': 'to jump',
    'volar': 'to fly',
    'nadar': 'to swim',
    'dormir': 'to sleep',
    'despertar': 'to wake up',
    'comer': 'to eat',
    'beber': 'to drink',
    'hablar': 'to speak',
    'escuchar': 'to listen',
    'mirar': 'to look',
    'tocar': 'to touch',
    'sentir': 'to feel',
    'pensar': 'to think',
    'amar': 'to love',
    'odiar': 'to hate',
    'reír': 'to laugh',
    'llorar': 'to cry',
    'cantar': 'to sing',
    'jugar': 'to play',
    'trabajar': 'to work',
    'estudiar': 'to study',
    'aprender': 'to learn',
    'enseñar': 'to teach',
    'leer': 'to read',
    'escribir': 'to write',
    'dibujar': 'to draw',
    'pintar': 'to paint',
    'cocinar': 'to cook',
    'limpiar': 'to clean',
    'comprar': 'to buy',
    'vender': 'to sell',
    'pagar': 'to pay',
    'ganar': 'to win/earn',
    'perder': 'to lose',
    'buscar': 'to search',
    'encontrar': 'to find',
    'olvidar': 'to forget',
    'recordar': 'to remember',
    'empezar': 'to start',
    'terminar': 'to finish',
    'continuar': 'to continue',
    'parar': 'to stop',
    'esperar': 'to wait/hope',
    'ayudar': 'to help',
    'necesitar': 'to need',
    'desear': 'to wish',
    'gustar': 'to like',
    'preferir': 'to prefer'
  }

  // Check if we have a common translation
  const translation = commonTranslations[word.toLowerCase()]
  if (translation) {
    return translation
  }

  // Default: return the word itself for now
  return word
}

async function extractVocabulary() {
  console.log('🔍 Starting vocabulary extraction...\n')

  try {
    // Clear existing vocabulary
    await prisma.vocabulary.deleteMany()
    console.log('Cleared existing vocabulary data')

    // Get all songs with lyrics
    const songs = await prisma.song.findMany({
      where: {
        lyricsRaw: { not: null }
      },
      select: {
        id: true,
        title: true,
        artist: true,
        lyricsRaw: true
      }
    })

    console.log(`Found ${songs.length} songs with lyrics`)

    // Collect all words from all songs
    const allWords: string[] = []
    const wordExamples = new Map<string, string[]>() // word -> example sentences

    for (const song of songs) {
      try {
        const lyricsData = JSON.parse(song.lyricsRaw!)
        const lines = lyricsData.lines || []

        for (const line of lines) {
          if (typeof line === 'string' && line.trim()) {
            // Extract words from the line
            const words = line
              .toLowerCase()
              .replace(/[¿?¡!.,;:'"()[\]{}]/g, ' ')
              .split(/\s+/)
              .filter(w => w.length > 2)

            // Add words to collection
            allWords.push(...words)

            // Store example sentences for each word
            for (const word of words) {
              const normalizedWord = word.toLowerCase().trim()
              if (!wordExamples.has(normalizedWord)) {
                wordExamples.set(normalizedWord, [])
              }
              const examples = wordExamples.get(normalizedWord)!
              if (examples.length < 3 && line.length > 10) {
                examples.push(line.trim())
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing lyrics for ${song.title}:`, error)
      }
    }

    console.log(`Collected ${allWords.length} total words`)

    // Score and filter vocabulary
    const topVocabulary = getTopVocabulary(allWords, 200)
    console.log(`Found ${topVocabulary.length} useful vocabulary words`)

    // Insert vocabulary into database
    let inserted = 0
    for (const vocab of topVocabulary) {
      try {
        // Get translation
        const translation = await getTranslation(vocab.word)

        // Get examples for this word
        const examples = wordExamples.get(vocab.word) || []

        // Create vocabulary entry
        await prisma.vocabulary.create({
          data: {
            word: vocab.word,
            translation: translation,
            partOfSpeech: vocab.partOfSpeech,
            frequency: vocab.frequency,
            usefulnessScore: vocab.score,
            examples: examples.length > 0 ? JSON.stringify(examples.slice(0, 3)) : null
          }
        })
        inserted++

        if (inserted % 10 === 0) {
          console.log(`Inserted ${inserted} vocabulary words...`)
        }
      } catch (error) {
        console.error(`Error inserting vocabulary "${vocab.word}":`, error)
      }
    }

    console.log(`\n✅ Successfully extracted ${inserted} vocabulary words`)

    // Show top 20 vocabulary
    const topWords = await prisma.vocabulary.findMany({
      take: 20,
      orderBy: { usefulnessScore: 'desc' }
    })

    console.log('\n🌟 Top 20 Vocabulary Words:')
    topWords.forEach((word, i) => {
      console.log(`  ${i + 1}. ${word.word} - ${word.translation} (${word.partOfSpeech})`)
      console.log(`     Score: ${word.usefulnessScore.toFixed(3)} | Frequency: ${word.frequency.toFixed(1)}`)
    })

  } catch (error) {
    console.error('Error during vocabulary extraction:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
extractVocabulary().catch(console.error)