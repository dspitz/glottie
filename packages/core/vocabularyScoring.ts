import freqData from './freq-es.json'

export interface VocabularyScore {
  word: string
  score: number              // Overall usefulness score (0-1)
  frequency: number          // Zipf frequency
  partOfSpeech: string      // noun, verb, adj, etc
}

// Common Spanish stopwords to exclude
const SPANISH_STOPWORDS = new Set([
  'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se',
  'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar',
  'tener', 'le', 'lo', 'todo', 'pero', 'más', 'hacer', 'o',
  'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'la', 'si',
  'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
  'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno',
  'mismo', 'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre',
  'así', 'primero', 'desde', 'grande', 'eso', 'ni', 'nos', 'llegar',
  'pasar', 'tiempo', 'ella', 'sí', 'día', 'uno', 'bien', 'poco',
  'deber', 'entonces', 'poner', 'cosa', 'tanto', 'hombre', 'parecer',
  'nuestro', 'tan', 'donde', 'ahora', 'parte', 'después', 'vida',
  'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar', 'nada',
  'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'te', 'del', 'al',
  'las', 'los', 'una', 'tu', 'nos', 'les', 'sus'
])

// Verb infinitives that are too common/basic
const BASIC_VERBS = new Set([
  'ser', 'estar', 'haber', 'tener', 'hacer', 'poder', 'decir', 'ir',
  'ver', 'dar', 'saber', 'querer', 'llegar', 'pasar', 'deber', 'poner',
  'parecer', 'quedar', 'creer', 'hablar', 'llevar', 'dejar', 'seguir',
  'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar',
  'conocer', 'vivir'
])

// Part of speech weights for learning priority
const POS_WEIGHTS = {
  'noun': 1.0,      // Nouns are most useful for beginners
  'verb': 0.9,      // Action verbs are very important
  'adjective': 0.8, // Descriptive words are helpful
  'adverb': 0.6,    // Less critical but useful
  'preposition': 0.3, // Usually learned through context
  'conjunction': 0.2, // Connectors, less priority
  'pronoun': 0.1,   // Basic pronouns excluded anyway
  'article': 0.0,   // Articles are stopwords
  'other': 0.5      // Default weight
}

// Identify part of speech based on word endings (simplified)
function identifyPartOfSpeech(word: string): string {
  const lowercased = word.toLowerCase()

  // Common verb endings
  if (lowercased.endsWith('ar') || lowercased.endsWith('er') || lowercased.endsWith('ir')) {
    if (lowercased.length > 3) return 'verb'
  }

  // Common adjective endings
  if (lowercased.endsWith('oso') || lowercased.endsWith('osa') ||
      lowercased.endsWith('able') || lowercased.endsWith('ible') ||
      lowercased.endsWith('ante') || lowercased.endsWith('ente') ||
      lowercased.endsWith('iente')) {
    return 'adjective'
  }

  // Common adverb ending
  if (lowercased.endsWith('mente') && lowercased.length > 5) {
    return 'adverb'
  }

  // Common noun endings
  if (lowercased.endsWith('ción') || lowercased.endsWith('sión') ||
      lowercased.endsWith('dad') || lowercased.endsWith('tad') ||
      lowercased.endsWith('tud') || lowercased.endsWith('umbre') ||
      lowercased.endsWith('anza') || lowercased.endsWith('encia') ||
      lowercased.endsWith('miento') || lowercased.endsWith('amiento')) {
    return 'noun'
  }

  // Default to noun for other words (most common content word type)
  return 'noun'
}

export function getWordFrequency(word: string): number {
  const normalizedWord = word.toLowerCase().trim()
  const freq = freqData[normalizedWord as keyof typeof freqData]

  if (freq !== undefined) {
    return freq
  }

  // Return low frequency for unknown words
  return 1.0
}

export function scoreVocabularyWord(word: string): VocabularyScore | null {
  const normalizedWord = word.toLowerCase().trim()

  // Skip if it's a stopword
  if (SPANISH_STOPWORDS.has(normalizedWord)) {
    return null
  }

  // Skip if it's a basic verb
  if (BASIC_VERBS.has(normalizedWord)) {
    return null
  }

  // Skip very short words
  if (normalizedWord.length < 3) {
    return null
  }

  // Skip words with non-letter characters
  if (!/^[a-záéíóúñü]+$/i.test(normalizedWord)) {
    return null
  }

  const frequency = getWordFrequency(normalizedWord)
  const partOfSpeech = identifyPartOfSpeech(normalizedWord)
  const posWeight = POS_WEIGHTS[partOfSpeech as keyof typeof POS_WEIGHTS] || 0.5

  // Calculate score based on:
  // 1. Optimal frequency range (not too common, not too rare)
  // 2. Part of speech importance
  // 3. Word length (longer words often more specific/useful)

  // Optimal frequency is in the 2.5-4.5 Zipf range (moderately common)
  let frequencyScore = 0
  if (frequency >= 2.0 && frequency <= 5.0) {
    // Peak at 3.5 Zipf frequency (moderately common words)
    const distance = Math.abs(frequency - 3.5)
    frequencyScore = Math.max(0, 1 - (distance / 1.5))
  } else if (frequency > 5.0) {
    // Too common, lower score
    frequencyScore = Math.max(0, 0.3 - (frequency - 5.0) * 0.1)
  } else {
    // Too rare, but still somewhat useful
    frequencyScore = Math.max(0, 0.4 - (2.0 - frequency) * 0.2)
  }

  // Length bonus for specific vocabulary
  const lengthBonus = Math.min(0.2, (normalizedWord.length - 3) * 0.02)

  // Calculate final score
  const score = Math.min(1, Math.max(0,
    frequencyScore * 0.6 +    // 60% weight on frequency optimality
    posWeight * 0.3 +          // 30% weight on part of speech
    lengthBonus                // 10% bonus for word specificity
  ))

  return {
    word: normalizedWord,
    score,
    frequency,
    partOfSpeech
  }
}

// Filter and score a list of words, returning top vocabulary
export function getTopVocabulary(words: string[], limit: number = 100): VocabularyScore[] {
  const scoredWords = new Map<string, VocabularyScore>()

  for (const word of words) {
    const normalizedWord = word.toLowerCase().trim()

    // Skip if already processed
    if (scoredWords.has(normalizedWord)) {
      continue
    }

    const score = scoreVocabularyWord(word)
    if (score && score.score > 0.3) { // Minimum threshold
      scoredWords.set(normalizedWord, score)
    }
  }

  // Sort by score and return top words
  return Array.from(scoredWords.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// Threshold for considering vocabulary useful
export const VOCABULARY_THRESHOLD = 0.4

export function isUsefulVocabulary(score: number): boolean {
  return score >= VOCABULARY_THRESHOLD
}