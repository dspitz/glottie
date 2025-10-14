/**
 * Vocabulary Extraction Algorithm
 *
 * Extracts the most useful vocabulary words from song lyrics
 * by analyzing frequency, part-of-speech, and educational value.
 */

import { getWordUsefulness } from './wordFrequency'

interface VocabWord {
  word: string
  translation: string
  count: number
  partOfSpeech?: string
  score: number
}

/**
 * Common Spanish stop words to exclude from vocabulary extraction
 * (articles, pronouns, prepositions, conjunctions, etc.)
 */
const SPANISH_STOP_WORDS = new Set([
  // Articles
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  // Pronouns
  'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes',
  'me', 'te', 'se', 'le', 'lo', 'nos', 'os', 'les',
  'mi', 'tu', 'su', 'mis', 'tus', 'sus',
  'mí', 'ti', 'sí',
  // Prepositions
  'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'sin', 'sobre', 'tras',
  // Conjunctions
  'y', 'e', 'o', 'u', 'pero', 'mas', 'sino', 'que', 'si', 'porque', 'pues', 'aunque', 'ni',
  // Common verbs (ser/estar forms - too basic)
  'es', 'soy', 'eres', 'son', 'somos', 'sois',
  'está', 'estoy', 'estás', 'están', 'estamos', 'estáis',
  'ha', 'he', 'has', 'hay', 'han', 'hemos', 'habéis',
  // Other common words
  'no', 'sí', 'muy', 'más', 'menos', 'ya', 'aún', 'ahora', 'aquí', 'ahí', 'allí',
  'este', 'esta', 'esto', 'estos', 'estas', 'ese', 'esa', 'eso', 'esos', 'esas', 'aquel', 'aquella', 'aquello', 'aquellos', 'aquellas',
  'cual', 'cuales', 'quien', 'quienes', 'donde', 'cuando', 'como', 'cuanto', 'cuanta', 'cuantos', 'cuantas',
  'del', 'al',
])

/**
 * French stop words for French songs
 */
const FRENCH_STOP_WORDS = new Set([
  // Articles
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'au', 'aux',
  // Pronouns
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on',
  'me', 'te', 'se', 'moi', 'toi', 'lui', 'leur', 'y', 'en',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  // Prepositions
  'à', 'de', 'en', 'dans', 'pour', 'par', 'sur', 'avec', 'sans', 'sous', 'vers', 'chez',
  // Conjunctions
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'si', 'comme', 'quand',
  // Common verbs (être/avoir forms - too basic)
  'est', 'suis', 'es', 'sont', 'sommes', 'êtes', 'été', 'être',
  'a', 'ai', 'as', 'ont', 'avons', 'avez', 'avoir',
  // Other common words
  'ne', 'pas', 'non', 'oui', 'très', 'plus', 'moins', 'bien', 'mal', 'tout', 'tous', 'toute', 'toutes',
  'ce', 'cet', 'cette', 'ces', 'ça', 'cela',
])

// Removed POS_SCORES - we're using a simpler frequency-based approach

/**
 * Simple heuristic-based part-of-speech detection for Spanish
 */
function guessPartOfSpeech(word: string, language: string): string {
  const lower = word.toLowerCase()

  if (language === 'es') {
    // Spanish verb endings
    if (lower.endsWith('ar') || lower.endsWith('er') || lower.endsWith('ir')) return 'VERB'
    if (lower.endsWith('ando') || lower.endsWith('iendo')) return 'VERB' // gerunds
    if (lower.endsWith('ado') || lower.endsWith('ido')) return 'VERB' // participles

    // Common Spanish verb conjugation patterns
    if (/^(soy|eres|es|somos|sois|son)$/.test(lower)) return 'VERB'
    if (/^(tengo|tienes|tiene|tenemos|tenéis|tienen)$/.test(lower)) return 'VERB'
    if (/^(hago|haces|hace|hacemos|hacéis|hacen)$/.test(lower)) return 'VERB'
    if (/^(voy|vas|va|vamos|vais|van)$/.test(lower)) return 'VERB'
    if (/^(puedo|puedes|puede|podemos|podéis|pueden)$/.test(lower)) return 'VERB'
    if (/^(quiero|quieres|quiere|queremos|queréis|quieren)$/.test(lower)) return 'VERB'

    // Spanish adjective endings
    if (lower.endsWith('oso') || lower.endsWith('osa')) return 'ADJECTIVE'
    if (lower.endsWith('ivo') || lower.endsWith('iva')) return 'ADJECTIVE'
    if (lower.endsWith('able') || lower.endsWith('ible')) return 'ADJECTIVE'

    // Spanish adverb endings
    if (lower.endsWith('mente')) return 'ADVERB'

    // Spanish noun endings (common patterns)
    if (lower.endsWith('ción') || lower.endsWith('sión')) return 'NOUN'
    if (lower.endsWith('dad') || lower.endsWith('tad')) return 'NOUN'
    if (lower.endsWith('miento') || lower.endsWith('mento')) return 'NOUN'
    if (lower.endsWith('ista')) return 'NOUN'
  } else if (language === 'fr') {
    // French verb endings
    if (lower.endsWith('er') || lower.endsWith('ir') || lower.endsWith('re')) return 'VERB'
    if (lower.endsWith('ant') || lower.endsWith('ent')) return 'VERB' // participles/conjugations

    // French adjective endings
    if (lower.endsWith('eux') || lower.endsWith('euse')) return 'ADJECTIVE'
    if (lower.endsWith('if') || lower.endsWith('ive')) return 'ADJECTIVE'
    if (lower.endsWith('able') || lower.endsWith('ible')) return 'ADJECTIVE'

    // French adverb endings
    if (lower.endsWith('ment')) return 'ADVERB'

    // French noun endings
    if (lower.endsWith('tion') || lower.endsWith('sion')) return 'NOUN'
    if (lower.endsWith('té') || lower.endsWith('ité')) return 'NOUN'
    if (lower.endsWith('isme') || lower.endsWith('iste')) return 'NOUN'
  }

  return 'UNKNOWN'
}

/**
 * Clean and normalize a word for comparison
 */
function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[¿?¡!.,;:"""''«»\(\)\[\]]/g, '') // Remove punctuation
    .trim()
}

/**
 * Extract vocabulary from lyrics
 */
export async function extractVocabulary(
  lyrics: string[],
  translations: string[],
  language: string = 'es',
  limit: number = 15,
  prisma?: any // Optional Prisma client for vocabulary lookup
): Promise<VocabWord[]> {
  const stopWords = language === 'fr' ? FRENCH_STOP_WORDS : SPANISH_STOP_WORDS
  const wordCounts = new Map<string, { count: number; translation: string; samples: string[] }>()

  // Count word frequencies and collect translations
  lyrics.forEach((line, index) => {
    const words = line.split(/\s+/)
    const translationWords = translations[index]?.split(/\s+/) || []

    words.forEach((rawWord, wordIndex) => {
      const word = normalizeWord(rawWord)

      // Skip empty, very short, or stop words
      if (!word || word.length < 2 || stopWords.has(word)) return

      // Get approximate translation (this is a rough heuristic)
      // In production, we'd use word-by-word alignment or dictionary lookup
      const translation = translationWords[wordIndex] || ''

      if (!wordCounts.has(word)) {
        wordCounts.set(word, { count: 0, translation: '', samples: [] })
      }

      const entry = wordCounts.get(word)!
      entry.count++

      // Clean and use the longest translation we find (likely most descriptive)
      if (translation.length > entry.translation.length) {
        const cleanTranslation = translation
          .toLowerCase()
          .replace(/[¿?¡!.,;:"""''«»\(\)\[\]]/g, '')
          .trim()
        if (cleanTranslation) {
          entry.translation = cleanTranslation
        }
      }

      // Keep original case samples (but remove punctuation)
      if (entry.samples.length < 3) {
        // Remove punctuation but preserve the case
        const cleanWord = rawWord.replace(/[¿?¡!.,;:"""''«»\(\)\[\]]/g, '')
        if (cleanWord) {
          entry.samples.push(cleanWord)
        }
      }
    })
  })

  // Skip old Vocabulary table - it has bad translations
  // We now use VocabularyEnriched (GPT-based) for proper translations
  // The basic vocab extraction just uses position-based matching as a fallback

  // Score and rank words
  const vocabWords: VocabWord[] = Array.from(wordCounts.entries()).map(([word, data]) => {
    const pos = guessPartOfSpeech(word, language)
    const frequencyInSong = data.count

    // Pure Zipf-based scoring - consistent for all words
    // Default to 0.5 if word not found in Zipf database
    const usefulnessInLanguage = getWordUsefulness(word, language, 0.5)

    // Simple multiplication: frequency_in_song × usefulness_in_language
    // This naturally surfaces words that are both relevant (in song) and useful (in language)
    const score = frequencyInSong * usefulnessInLanguage

    return {
      word: data.samples[0], // Use original case
      translation: data.translation || word,
      count: data.count,
      partOfSpeech: pos,
      score,
    }
  })

  // Sort by score (descending) and return top N
  return vocabWords
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
