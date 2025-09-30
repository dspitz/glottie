import freqData from './freq-es.json'

export interface PhraseUsefulnessFactors {
  wordFrequency: number     // Average Zipf frequency of words (0-1)
  phraseLength: number       // Ideal: 3-6 words (0-1)
  verbComplexity: number     // Simple tenses score higher (0-1)
  questionPattern: number    // Questions are highly useful (0-1)
  greetingPattern: number    // Greetings score maximum (0-1)
  commonExpression: number   // Match against common phrases (0-1)
  repetitiveness: number     // Penalize repetitive phrases (0-1)
}

export interface PhraseScore {
  score: number              // Overall usefulness score (0-1)
  factors: PhraseUsefulnessFactors
  category: string          // Suggested category
}

// Common greeting patterns in Spanish
const GREETING_PATTERNS = [
  /^hola\b/i,
  /buenos?\s+(d[íi]as?|tardes?|noches?)/i,
  /buenas?\s+(tardes?|noches?)/i,
  /hasta\s+(luego|pronto|ma[ñn]ana|la vista)/i,
  /adi[óo]s/i,
  /nos vemos/i,
  /c[óo]mo est[áa]s?/i,
  /qu[ée] tal/i,
  /c[óo]mo te va/i,
  /encantado/i,
  /mucho gusto/i
]

// Question word patterns
const QUESTION_PATTERNS = [
  /^[¿¡]/,
  /\b(qu[ée]|qui[ée]n|c[óo]mo|cu[áa]ndo|d[óo]nde|cu[áa]nto|por qu[ée]|para qu[ée])\b/i,
  /\?$/
]

// Common useful expressions - expanded for better coverage
const COMMON_EXPRESSIONS = [
  // Preferences and desires
  /me gusta/i,
  /me encanta/i,
  /prefiero/i,
  /quiero/i,
  /necesito/i,
  /deseo/i,

  // Common phrases
  /no s[ée]/i,
  /no entiendo/i,
  /no importa/i,
  /no hay problema/i,
  /puedo/i,
  /puedes/i,
  /tengo que/i,
  /tienes que/i,
  /hay que/i,
  /vamos a/i,
  /voy a/i,
  /vas a/i,

  // Personal information
  /me llamo/i,
  /mi nombre es/i,
  /soy de/i,
  /vengo de/i,
  /vivo en/i,
  /trabajo en/i,

  // Politeness
  /gracias/i,
  /muchas gracias/i,
  /por favor/i,
  /de nada/i,
  /lo siento/i,
  /perd[óo]n/i,
  /disculpa/i,
  /con permiso/i,

  // Agreement/Understanding
  /est[áa] bien/i,
  /vale/i,
  /claro/i,
  /por supuesto/i,
  /de acuerdo/i,
  /entiendo/i,

  // Uncertainty
  /tal vez/i,
  /quiz[áa]s/i,
  /a lo mejor/i,
  /no estoy seguro/i,

  // Time expressions
  /ahora mismo/i,
  /en este momento/i,
  /todos los d[íi]as/i,
  /cada d[íi]a/i,
  /siempre/i,
  /nunca/i,
  /a veces/i,

  // Basic questions/responses
  /cu[áa]nto cuesta/i,
  /d[óo]nde est[áa]/i,
  /qu[ée] es/i,
  /c[óo]mo se dice/i,
  /puedes repetir/i,
  /hablas ingl[ée]s/i,

  // Common actions
  /tengo/i,
  /tienes/i,
  /tiene/i,
  /estoy/i,
  /est[áa]s/i,
  /est[áa]/i,
  /voy/i,
  /vas/i,
  /va/i
]

// Verb tense complexity weights (lower is simpler)
const TENSE_COMPLEXITY = {
  'presente': 0.2,
  'preterito': 0.5,
  'imperfecto': 0.5,
  'futuro': 0.4,
  'condicional': 0.6,
  'imperativo': 0.3,
  'subjuntivo': 0.8,
  'subjuntivo_presente': 0.8,
  'subjuntivo_imperfecto': 0.9
}

// Patterns that indicate non-useful/artistic phrases
const EXCLUDE_PATTERNS = [
  /^(la|el|na|oh|ah|hey|ay|ey)\s+(la|el|na|oh|ah|hey|ay|ey)/i,  // Repetitive sounds
  /^(oh|ah|uh|mm|hmm|eh|ay)/i,                                    // Interjections
  /\b(sha|na|dum|bum|pum|tra)\b/i,                               // Musical sounds
  /(baby|honey|darling|love)/i,                                   // English terms
]

function getWordFrequency(word: string): number {
  const normalizedWord = word.toLowerCase().trim()
  const freq = freqData[normalizedWord as keyof typeof freqData]

  if (freq !== undefined) {
    return freq
  }

  // Fallback: estimate based on word characteristics
  if (normalizedWord.length <= 3) return 3.0
  if (normalizedWord.length <= 5) return 2.0
  if (normalizedWord.length <= 8) return 1.0
  return 0.5
}

function calculateWordFrequencyScore(phrase: string): number {
  const words = phrase.toLowerCase().split(/\s+/)
    .filter(w => w.length > 1 && !/^[^\w]/.test(w))

  if (words.length === 0) return 0

  const frequencies = words.map(word => getWordFrequency(word))
  const avgFreq = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length

  // Convert Zipf frequency to 0-1 score (higher freq = higher score)
  // Zipf 5+ = very common, Zipf 2- = rare
  return Math.min(1, Math.max(0, (avgFreq - 1) / 4))
}

function calculatePhraseLengthScore(phrase: string): number {
  const wordCount = phrase.split(/\s+/).filter(w => w.length > 0).length

  // Ideal range: 3-6 words
  if (wordCount >= 3 && wordCount <= 6) return 1.0
  if (wordCount === 2 || wordCount === 7) return 0.8
  if (wordCount === 1 || wordCount === 8) return 0.6
  if (wordCount === 9 || wordCount === 10) return 0.4
  return 0.2
}

function calculateVerbComplexityScore(phrase: string, verbTenses?: string[]): number {
  if (!verbTenses || verbTenses.length === 0) {
    // No verb info available, neutral score
    return 0.5
  }

  const complexities = verbTenses.map(tense =>
    TENSE_COMPLEXITY[tense as keyof typeof TENSE_COMPLEXITY] || 0.5
  )

  const avgComplexity = complexities.reduce((sum, c) => sum + c, 0) / complexities.length

  // Invert: lower complexity = higher score
  return 1 - avgComplexity
}

function calculateQuestionScore(phrase: string): number {
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(phrase)) {
      return 1.0
    }
  }
  return 0.0
}

function calculateGreetingScore(phrase: string): number {
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(phrase)) {
      return 1.0
    }
  }
  return 0.0
}

function calculateCommonExpressionScore(phrase: string): number {
  for (const pattern of COMMON_EXPRESSIONS) {
    if (pattern.test(phrase)) {
      return 1.0
    }
  }
  return 0.0
}

function calculateRepetitivenessScore(phrase: string): number {
  const words = phrase.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)

  // Check for excluded patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(phrase)) {
      return 0.0  // Highly repetitive/non-useful
    }
  }

  // Check word uniqueness
  const uniquenessRatio = uniqueWords.size / words.length
  return uniquenessRatio  // Higher is better
}

function determineCategory(
  phrase: string,
  factors: PhraseUsefulnessFactors
): string {
  // Priority order for category assignment
  if (factors.greetingPattern > 0.5) return 'greetings'
  if (factors.questionPattern > 0.5) return 'questions'

  // Check for time expressions
  if (/\b(siempre|nunca|a veces|todos los d[íi]as|cada|cuando|mientras|despu[ée]s|antes|ahora|hoy|ayer|ma[ñn]ana)\b/i.test(phrase)) {
    return 'time'
  }

  // Check for emotion expressions
  if (/\b(siento|feliz|triste|enojado|miedo|amor|odio|gusto|extra[ñn]o|alegr[íi]a|dolor)\b/i.test(phrase)) {
    return 'emotions'
  }

  // Check for connectors
  if (/^(pero|porque|aunque|sin embargo|entonces|as[íi] que|por eso|mientras|cuando)\b/i.test(phrase)) {
    return 'connectors'
  }

  // Check for common actions
  if (/\b(voy|vengo|hago|digo|veo|s[ée]|puedo|quiero|necesito|tengo)\b/i.test(phrase)) {
    return 'actions'
  }

  // Check if it's a common expression
  if (factors.commonExpression > 0.5) return 'expressions'

  // Default to general vocabulary
  return 'vocabulary'
}

export function scorePhraseUsefulness(
  phrase: string,
  verbTenses?: string[]
): PhraseScore {
  // Clean the phrase
  const cleanPhrase = phrase.trim()

  // Calculate only the three key factors
  const wordFrequencyScore = calculateWordFrequencyScore(cleanPhrase)
  const commonExpressionScore = calculateCommonExpressionScore(cleanPhrase)
  const repetitivenessScore = calculateRepetitivenessScore(cleanPhrase)

  // Set other factors to neutral/zero for compatibility
  const factors: PhraseUsefulnessFactors = {
    wordFrequency: wordFrequencyScore,
    phraseLength: 0,  // Not used
    verbComplexity: 0,  // Not used
    questionPattern: 0,  // Not used
    greetingPattern: 0,  // Not used
    commonExpression: commonExpressionScore,
    repetitiveness: repetitivenessScore
  }

  // SIMPLIFIED SCORING: Only 3 factors
  // - 50% word frequency (how common the words are)
  // - 30% common expressions (is it a useful expression)
  // - 20% repetitiveness filter (penalize repetitive/non-useful content)
  const score = Math.min(1, Math.max(0,
    0.50 * factors.wordFrequency +
    0.30 * factors.commonExpression +
    0.20 * factors.repetitiveness
  ))

  // Determine category based on content
  const category = determineCategory(cleanPhrase, factors)

  return {
    score,
    factors,
    category
  }
}

// Threshold for considering a phrase useful
export const USEFULNESS_THRESHOLD = 0.4

export function isUsefulPhrase(score: number): boolean {
  return score >= USEFULNESS_THRESHOLD
}

// Category display information
export const PHRASE_CATEGORIES = {
  greetings: {
    displayName: 'Greetings & Farewells',
    icon: 'hand',
    order: 1
  },
  questions: {
    displayName: 'Questions',
    icon: 'help-circle',
    order: 2
  },
  expressions: {
    displayName: 'Common Expressions',
    icon: 'message-square',
    order: 3
  },
  actions: {
    displayName: 'Actions & Verbs',
    icon: 'activity',
    order: 4
  },
  time: {
    displayName: 'Time & Frequency',
    icon: 'clock',
    order: 5
  },
  emotions: {
    displayName: 'Emotions & Feelings',
    icon: 'heart',
    order: 6
  },
  connectors: {
    displayName: 'Connectors',
    icon: 'link',
    order: 7
  },
  vocabulary: {
    displayName: 'General Vocabulary',
    icon: 'book-open',
    order: 8
  }
}