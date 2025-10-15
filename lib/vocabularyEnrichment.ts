/**
 * Vocabulary Enrichment Service
 *
 * Uses OpenAI GPT to enrich vocabulary words with:
 * - Multi-language translations
 * - Root forms (for verbs)
 * - Conjugations
 * - Synonyms & antonyms
 * - Definitions & examples
 *
 * Also detects and explains idioms in song lyrics.
 */

import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { getWordUsefulness } from './wordFrequency'

// Initialize Prisma client
const prisma = new PrismaClient()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Target languages for translations (expandable)
// Includes major world languages + Romance languages for cross-learning
const TARGET_LANGUAGES = ['en', 'es', 'fr', 'it', 'pt', 'de', 'zh', 'ja', 'ko', 'ar', 'ru', 'hi']

interface EnrichedWord {
  word: string
  language: string
  translations: Record<string, string>
  root?: string
  partOfSpeech: string
  conjugations?: {
    present?: string[]
    preterite?: string[]
    imperfect?: string[]
    future?: string[]
    conditional?: string[]
    subjunctive?: string[]
    'present-perfect'?: string[]
    pluperfect?: string[]
  }
  synonyms?: string[]
  antonyms?: string[]
  definition?: string
  exampleSentence?: string
  exampleTranslation?: string
  usefulnessScore?: number
}

interface Idiom {
  phrase: string
  language: string
  translations: Record<string, string>
  literalTranslation?: string
  meaning: string
  examples?: string[]
  culturalContext?: string
}

/**
 * Enrich multiple vocabulary words in a single GPT call
 */
export async function enrichVocabularyBatch(
  words: string[],
  sourceLanguage: string = 'es',
  targetLanguages: string[] = TARGET_LANGUAGES
): Promise<EnrichedWord[]> {
  if (words.length === 0) return []

  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    it: 'Italian',
    pt: 'Portuguese',
    de: 'German',
    zh: 'Chinese (Simplified)',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    ru: 'Russian',
    hi: 'Hindi',
  }

  const sourceLangName = languageNames[sourceLanguage] || sourceLanguage
  const targetLangList = targetLanguages
    .map(code => `"${code}": "${languageNames[code] || code}"`)
    .join(', ')

  const prompt = `You are a language learning expert. Analyze these ${sourceLangName} words from a song and provide comprehensive vocabulary data.

Words: ${words.join(', ')}

For each word, return JSON with:
- word: the original word (preserve case)
- translations: object with keys {${targetLangList}}
  * IMPORTANT: For verbs, translate as infinitive with "to" (e.g., "to say", "to go")
  * For conjugated verbs, still provide the infinitive translation
- root: base/infinitive form (for verbs), null otherwise
- partOfSpeech: "noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", or "interjection"
- conjugations: if verb, MUST include these 6 tenses as arrays of 6 forms [je/yo, tu, il/él, nous/nosotros, vous/vosotros, ils/ellos]:
  * present: present tense (REQUIRED)
  * preterite: past tense - Spanish: pretérito, French: passé composé (REQUIRED)
  * imperfect: imperfect past (REQUIRED)
  * future: simple future (REQUIRED)
  * conditional: conditional mood (REQUIRED)
  * subjunctive: present subjunctive (REQUIRED)
  OPTIONALLY include these if time allows:
  * present-perfect: present perfect (optional)
  * pluperfect: pluperfect/past perfect (optional)
  Otherwise null.
- synonyms: array of 2-3 similar words in ${sourceLangName}
- antonyms: array of 1-2 opposite words in ${sourceLangName} (if applicable)
- definition: brief explanation in English (1-2 sentences)
- exampleSentence: natural usage in ${sourceLangName}
- exampleTranslation: translation of example to English

Return ONLY a JSON array, no markdown formatting or explanation.

Example format:
[
  {
    "word": "amor",
    "translations": {"en": "love", "zh": "爱", ...},
    "root": null,
    "partOfSpeech": "noun",
    "conjugations": null,
    "synonyms": ["cariño", "afecto"],
    "antonyms": ["odio"],
    "definition": "A deep affection or romantic feeling for someone or something.",
    "exampleSentence": "El amor es eterno",
    "exampleTranslation": "Love is eternal"
  },
  {
    "word": "dit",
    "translations": {"en": "to say", "zh": "说", ...},
    "root": "dire",
    "partOfSpeech": "verb",
    "conjugations": {...},
    "synonyms": ["parler", "déclarer"],
    "antonyms": [],
    "definition": "To express something in words.",
    "exampleSentence": "Il a dit la vérité",
    "exampleTranslation": "He told the truth"
  }
]`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a language learning assistant. Always wrap your response in a JSON object with a "words" key containing the array of vocabulary data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 4096, // Max for gpt-4-turbo-preview
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No response from GPT')

    let parsed: any
    try {
      // Parse the response - GPT will wrap in an object due to json_object mode
      parsed = JSON.parse(content)
    } catch (parseError) {
      // If JSON parsing fails, try to clean the content
      console.warn('Initial JSON parse failed, attempting to clean response...')

      // Try to fix common issues
      let cleaned = content
        .replace(/\n/g, ' ')  // Remove newlines
        .replace(/\r/g, '')   // Remove carriage returns
        .trim()

      // Try parsing again
      try {
        parsed = JSON.parse(cleaned)
      } catch (secondError) {
        console.error('Failed to parse GPT response after cleaning:', content.substring(0, 500))
        throw new Error(`JSON parsing failed: ${parseError}`)
      }
    }

    // Handle if GPT wrapped the array in an object
    if (!Array.isArray(parsed)) {
      // Try to find the array in the object
      const possibleKeys = ['words', 'data', 'vocabulary', 'results', 'items']
      for (const key of possibleKeys) {
        if (Array.isArray(parsed[key])) {
          parsed = parsed[key]
          break
        }
      }
      // If still not array, try first value
      if (!Array.isArray(parsed)) {
        const values = Object.values(parsed)
        if (values.length > 0 && Array.isArray(values[0])) {
          parsed = values[0]
        } else {
          // If single word object, wrap in array
          if (parsed.word && parsed.translations) {
            console.warn('GPT returned single word object, wrapping in array')
            parsed = [parsed]
          }
        }
      }
    }

    if (!Array.isArray(parsed)) {
      console.error('GPT response structure:', JSON.stringify(parsed, null, 2).substring(0, 500))
      throw new Error('GPT response is not an array')
    }

    // Add usefulness scores from Zipf data
    const enriched: EnrichedWord[] = parsed.map((item: any) => ({
      ...item,
      language: sourceLanguage,
      usefulnessScore: getWordUsefulness(item.word, sourceLanguage, 0.5),
    }))

    return enriched
  } catch (error) {
    console.error('Error enriching vocabulary with GPT:', error)
    throw error
  }
}

/**
 * Detect and explain idioms in lyrics
 */
export async function detectIdioms(
  lyrics: string[],
  language: string = 'es',
  targetLanguages: string[] = TARGET_LANGUAGES
): Promise<Idiom[]> {
  const fullText = lyrics.join('\n')

  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    zh: 'Chinese',
    ar: 'Arabic',
    de: 'German',
    ja: 'Japanese',
    ko: 'Korean',
    pt: 'Portuguese',
    ru: 'Russian',
    hi: 'Hindi',
  }

  const sourceLangName = languageNames[language] || language
  const targetLangList = targetLanguages
    .map(code => `"${code}": "${languageNames[code] || code}"`)
    .join(', ')

  const prompt = `You are a language expert. Analyze these ${sourceLangName} song lyrics and identify any idiomatic expressions or phrases.

Lyrics:
${fullText}

For each idiom found, return JSON with:
- phrase: the exact idiomatic phrase from the lyrics
- translations: object with keys {${targetLangList}} showing how the idiom would be expressed naturally
- literalTranslation: word-for-word translation to English
- meaning: what the idiom actually means in plain English
- examples: array of 1-2 other example sentences using this idiom
- culturalContext: brief explanation of cultural significance (optional)

Return ONLY a JSON array. If no idioms are found, return an empty array [].

Example format:
[
  {
    "phrase": "echar de menos",
    "translations": {"en": "to miss", "zh": "想念", ...},
    "literalTranslation": "to throw of less",
    "meaning": "to miss someone or something",
    "examples": ["Te echo de menos", "Echamos de menos nuestra casa"],
    "culturalContext": "Common expression in Spanish-speaking countries"
  }
]`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a language expert. Always wrap your response in a JSON object with an "idioms" key containing the array of idiom data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) return []

    // Parse the response
    let parsed = JSON.parse(content)

    // Handle if GPT wrapped the array in an object
    if (!Array.isArray(parsed)) {
      const possibleKeys = ['idioms', 'phrases', 'expressions', 'data', 'results', 'items']
      for (const key of possibleKeys) {
        if (Array.isArray(parsed[key])) {
          parsed = parsed[key]
          break
        }
      }
      if (!Array.isArray(parsed)) {
        const values = Object.values(parsed)
        if (values.length > 0 && Array.isArray(values[0])) {
          parsed = values[0]
        }
      }
    }

    if (!Array.isArray(parsed)) {
      console.warn('GPT idiom response is not an array, returning empty')
      console.error('GPT idiom response structure:', JSON.stringify(parsed, null, 2))
      return []
    }

    return parsed.map((item: any) => ({
      ...item,
      language,
    }))
  } catch (error) {
    console.error('Error detecting idioms with GPT:', error)
    return []
  }
}

/**
 * Get enriched vocabulary for words, using cache when available
 */
export async function getEnrichedVocabulary(
  words: string[],
  language: string = 'es'
): Promise<EnrichedWord[]> {
  if (words.length === 0) return []

  // Normalize words for lookup
  const normalized = words.map(w => w.toLowerCase())

  // Check cache
  const cached = await prisma.vocabularyEnriched.findMany({
    where: {
      word: { in: normalized },
      language,
    },
  })

  // Find words not in cache
  const cachedWords = new Set(cached.map(c => c.word.toLowerCase()))
  const newWords = words.filter(w => !cachedWords.has(w.toLowerCase()))

  // Enrich new words if any
  let enriched: EnrichedWord[] = []
  if (newWords.length > 0) {
    enriched = await enrichVocabularyBatch(newWords, language)

    // Cache the results (use upsert for SQLite compatibility)
    for (const e of enriched) {
      await prisma.vocabularyEnriched.upsert({
        where: {
          word_language: {
            word: e.word.toLowerCase(),
            language: e.language,
          },
        },
        update: {},
        create: {
          word: e.word.toLowerCase(),
          language: e.language,
          translations: JSON.stringify(e.translations),
          root: e.root || null,
          partOfSpeech: e.partOfSpeech,
          conjugations: e.conjugations ? JSON.stringify(e.conjugations) : null,
          synonyms: e.synonyms ? JSON.stringify(e.synonyms) : null,
          antonyms: e.antonyms ? JSON.stringify(e.antonyms) : null,
          definition: e.definition || null,
          exampleSentence: e.exampleSentence || null,
          exampleTranslation: e.exampleTranslation || null,
          usefulnessScore: e.usefulnessScore || null,
        },
      })
    }
  }

  // Combine cached and new results
  const cachedEnriched: EnrichedWord[] = cached.map(c => ({
    word: c.word,
    language: c.language,
    translations: JSON.parse(c.translations),
    root: c.root || undefined,
    partOfSpeech: c.partOfSpeech,
    conjugations: c.conjugations ? JSON.parse(c.conjugations) : undefined,
    synonyms: c.synonyms ? JSON.parse(c.synonyms) : undefined,
    antonyms: c.antonyms ? JSON.parse(c.antonyms) : undefined,
    definition: c.definition || undefined,
    exampleSentence: c.exampleSentence || undefined,
    exampleTranslation: c.exampleTranslation || undefined,
    usefulnessScore: c.usefulnessScore || undefined,
  }))

  return [...cachedEnriched, ...enriched]
}

/**
 * Get idioms for lyrics, using cache when available
 */
export async function getIdiomsForLyrics(
  lyrics: string[],
  language: string = 'es',
  songId?: string
): Promise<Idiom[]> {
  // If songId provided, check cache first
  if (songId) {
    const cached = await prisma.idiom.findMany({
      where: {
        songId,
        language,
      },
    })

    if (cached.length > 0) {
      console.log(`✅ Found ${cached.length} cached idioms for song ${songId}`)
      return cached.map(c => ({
        phrase: c.phrase,
        language: c.language,
        translations: JSON.parse(c.translations),
        literalTranslation: c.literalTranslation || undefined,
        meaning: c.meaning,
        examples: c.examples ? JSON.parse(c.examples) : undefined,
        culturalContext: c.culturalContext || undefined,
      }))
    }
  }

  // Not in cache, detect fresh with GPT-4
  console.log(`🔍 Detecting idioms for song ${songId || 'unknown'} with GPT-4...`)
  const idioms = await detectIdioms(lyrics, language)

  // Cache the idioms (use upsert for SQLite compatibility)
  if (idioms.length > 0 && songId) {
    for (const i of idioms) {
      await prisma.idiom.upsert({
        where: {
          phrase_language: {
            phrase: i.phrase,
            language: i.language,
          },
        },
        update: {
          songId, // Update songId if phrase already exists
        },
        create: {
          songId,
          phrase: i.phrase,
          language: i.language,
          translations: JSON.stringify(i.translations),
          literalTranslation: i.literalTranslation || null,
          meaning: i.meaning,
          examples: i.examples ? JSON.stringify(i.examples) : null,
          culturalContext: i.culturalContext || null,
        },
      })
    }
    console.log(`✅ Cached ${idioms.length} idioms for song ${songId}`)
  }

  return idioms
}
