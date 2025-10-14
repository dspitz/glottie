/**
 * Word Frequency Data
 *
 * Approximate Zipf frequencies for common Spanish and French words.
 * Based on subtitle corpus and OpenSubtitles frequency data.
 *
 * Zipf scale: 1-7 (higher = more common)
 * - 7.0: Ultra-frequent (top 10 words)
 * - 6.0: Very frequent (top 100)
 * - 5.0: Frequent (top 1,000)
 * - 4.0: Common (top 10,000)
 * - 3.0: Uncommon (top 50,000)
 * - 2.0: Rare
 * - 1.0: Very rare
 */

// Top ~1000 Spanish words with approximate Zipf frequencies
// This is a curated subset - we'll expand over time
const SPANISH_ZIPF: Record<string, number> = {
  // Ultra-frequent (7.0+)
  'de': 7.3, 'la': 7.2, 'que': 7.1, 'el': 7.1, 'en': 7.0, 'y': 7.0,
  'a': 6.9, 'los': 6.8, 'se': 6.7, 'del': 6.6, 'las': 6.5,

  // Very frequent (6.0-6.9)
  'un': 6.5, 'por': 6.4, 'con': 6.3, 'no': 6.3, 'una': 6.2, 'su': 6.1,
  'para': 6.1, 'es': 6.0, 'al': 6.0, 'lo': 6.0, 'como': 5.9, 'más': 5.9,
  'pero': 5.8, 'sus': 5.8, 'le': 5.7, 'ya': 5.7, 'o': 5.7, 'fue': 5.6,
  'este': 5.6, 'ha': 5.6, 'sí': 5.5, 'porque': 5.5, 'esta': 5.5, 'son': 5.4,
  'entre': 5.4, 'está': 5.4, 'cuando': 5.3, 'muy': 5.3, 'sin': 5.3,
  'sobre': 5.2, 'también': 5.2, 'me': 5.2, 'hasta': 5.2, 'hay': 5.1,
  'donde': 5.1, 'han': 5.1, 'quien': 5.1, 'están': 5.0, 'estado': 5.0,

  // Frequent - Common verbs (5.0-5.9)
  'ser': 6.2, 'estar': 6.0, 'tener': 5.9, 'hacer': 5.8, 'poder': 5.7,
  'decir': 5.6, 'ir': 5.5, 'ver': 5.4, 'dar': 5.3, 'saber': 5.2,
  'querer': 5.2, 'llegar': 5.1, 'pasar': 5.0, 'deber': 5.0, 'poner': 4.9,
  'parecer': 4.9, 'quedar': 4.8, 'creer': 4.8, 'hablar': 4.7, 'llevar': 4.7,
  'dejar': 4.6, 'seguir': 4.6, 'encontrar': 4.5, 'llamar': 4.5, 'venir': 4.5,
  'pensar': 4.4, 'salir': 4.4, 'volver': 4.4, 'tomar': 4.3, 'conocer': 4.3,
  'vivir': 4.3, 'sentir': 4.2, 'tratar': 4.2, 'mirar': 4.2, 'contar': 4.1,
  'empezar': 4.1, 'esperar': 4.1, 'buscar': 4.0, 'existir': 4.0, 'entrar': 4.0,
  'trabajar': 3.9, 'escribir': 3.9, 'perder': 3.9, 'producir': 3.8,

  // Frequent - Common nouns (4.5-5.5)
  'año': 5.5, 'vez': 5.4, 'tiempo': 5.3, 'día': 5.3, 'vida': 5.2,
  'hombre': 5.1, 'mundo': 5.0, 'país': 5.0, 'parte': 4.9, 'casa': 4.9,
  'caso': 4.8, 'mano': 4.8, 'mujer': 4.8, 'cosa': 4.7, 'persona': 4.7,
  'lugar': 4.6, 'momento': 4.6, 'forma': 4.6, 'hijo': 4.5, 'trabajo': 4.5,
  'ciudad': 4.4, 'nombre': 4.4, 'agua': 4.4, 'pueblo': 4.3, 'noche': 4.3,
  'modo': 4.3, 'grupo': 4.2, 'punto': 4.2, 'familia': 4.2, 'orden': 4.1,

  // Common - Emotional/cultural words (3.5-4.5)
  'amor': 4.4, 'corazón': 4.2, 'alma': 4.0, 'sueño': 3.9, 'muerte': 3.9,
  'dolor': 3.8, 'alegría': 3.6, 'tristeza': 3.5, 'esperanza': 3.7,
  'miedo': 3.8, 'felicidad': 3.5, 'soledad': 3.6, 'pasión': 3.6,

  // Common conjugated forms
  'tengo': 5.0, 'tienes': 4.8, 'tiene': 5.2, 'somos': 4.7, 'eres': 4.9,
  'estoy': 5.0, 'estás': 4.8, 'puedo': 5.1, 'puedes': 4.9, 'quiero': 5.0,
  'quieres': 4.8, 'voy': 5.1, 'vas': 4.9, 'soy': 5.3, 'eres': 4.9,
  'hago': 4.7, 'haces': 4.5, 'digo': 4.6, 'dices': 4.4, 'veo': 4.5,

  // Adjectives
  'bueno': 4.9, 'grande': 4.8, 'nuevo': 4.7, 'malo': 4.5, 'pequeño': 4.4,
  'viejo': 4.3, 'joven': 4.2, 'feliz': 4.1, 'triste': 3.9, 'negro': 4.3,
  'blanco': 4.2, 'rojo': 4.0, 'azul': 3.9, 'verde': 3.9, 'alto': 4.1,
  'bajo': 4.1, 'largo': 4.0, 'corto': 3.9, 'difícil': 4.2, 'fácil': 4.1,

  // Body parts
  'mano': 4.8, 'ojo': 4.5, 'cara': 4.4, 'cabeza': 4.3, 'pie': 4.1,
  'brazo': 3.8, 'pierna': 3.7, 'boca': 4.0, 'oreja': 3.5, 'nariz': 3.6,

  // Time/place
  'hoy': 5.2, 'mañana': 4.8, 'ayer': 4.6, 'ahora': 5.4, 'después': 4.9,
  'antes': 5.0, 'siempre': 4.7, 'nunca': 4.8, 'aquí': 5.1, 'allí': 4.7,
  'cerca': 4.3, 'lejos': 4.1,
}

const FRENCH_ZIPF: Record<string, number> = {
  // Ultra-frequent
  'de': 7.3, 'le': 7.2, 'la': 7.2, 'et': 7.1, 'les': 7.0, 'des': 6.9,
  'en': 6.9, 'un': 6.8, 'une': 6.7, 'que': 6.7, 'à': 6.6, 'pour': 6.5,
  'dans': 6.4, 'ce': 6.3, 'il': 6.3, 'qui': 6.2, 'ne': 6.2, 'sur': 6.1,
  'se': 6.1, 'pas': 6.0, 'plus': 6.0, 'peut': 5.9, 'par': 5.9, 'je': 5.9,
  'avec': 5.8, 'tout': 5.8, 'nous': 5.7, 'mais': 5.7, 'vous': 5.6,
  'son': 5.6, 'du': 5.6, 'au': 5.5, 'sont': 5.5, 'on': 5.4, 'ou': 5.4,

  // Common verbs
  'être': 6.5, 'avoir': 6.3, 'faire': 5.9, 'dire': 5.7, 'pouvoir': 5.6,
  'aller': 5.5, 'voir': 5.4, 'savoir': 5.3, 'vouloir': 5.2, 'venir': 5.1,
  'devoir': 5.0, 'prendre': 4.9, 'trouver': 4.8, 'donner': 4.7, 'parler': 4.6,
  'mettre': 4.6, 'passer': 4.5, 'demander': 4.4, 'comprendre': 4.3,

  // Common nouns
  'temps': 5.3, 'vie': 5.2, 'jour': 5.1, 'homme': 5.0, 'chose': 4.9,
  'monde': 4.8, 'pays': 4.7, 'année': 4.7, 'fois': 4.6, 'personne': 4.5,
  'main': 4.4, 'enfant': 4.4, 'moment': 4.3, 'femme': 4.3, 'maison': 4.2,

  // Emotional words
  'amour': 4.3, 'cœur': 4.1, 'âme': 3.9, 'rêve': 3.8, 'mort': 3.9,
  'douleur': 3.7, 'joie': 3.6, 'tristesse': 3.4, 'espoir': 3.6,

  // Common conjugations
  'suis': 5.8, 'es': 5.6, 'est': 6.0, 'sommes': 5.3, 'êtes': 5.2, 'sont': 5.5,
  'ai': 5.7, 'as': 5.5, 'a': 6.2, 'avons': 5.2, 'avez': 5.1, 'ont': 5.4,
  'vais': 5.3, 'vas': 5.1, 'va': 5.5, 'allons': 4.9, 'allez': 4.8, 'vont': 5.0,
}

/**
 * Convert Zipf frequency to usefulness score for vocabulary learning
 *
 * The sweet spot for learning is words with Zipf 4.0-5.0:
 * - Not too common (students already know them)
 * - Not too rare (too specialized/difficult)
 */
export function zipfToUsefulness(zipf: number): number {
  if (zipf >= 6.5) return 0.2  // "el", "de", "la" - too basic
  if (zipf >= 6.0) return 0.4  // "ser", "estar" - basic but sometimes useful
  if (zipf >= 5.5) return 0.6  // "muy", "todo" - useful
  if (zipf >= 4.5) return 0.85 // "amor", "vida" - good learning words
  if (zipf >= 3.5) return 0.95 // "corazón", "alma" - PERFECT for learning!
  if (zipf >= 2.5) return 0.7  // "disimulo" - good but harder
  if (zipf >= 1.5) return 0.4  // rare/literary
  return 0.2                    // too rare/specialized
}

/**
 * Get Zipf frequency for a word in a specific language
 * Returns undefined if not found
 */
export function getZipfFrequency(word: string, language: string): number | undefined {
  const normalized = word.toLowerCase()

  if (language === 'es') {
    return SPANISH_ZIPF[normalized]
  } else if (language === 'fr') {
    return FRENCH_ZIPF[normalized]
  }

  return undefined
}

/**
 * Get usefulness score for a word based on Zipf frequency
 * Returns default value if word not found in frequency data
 */
export function getWordUsefulness(word: string, language: string, defaultValue: number = 0.5): number {
  const zipf = getZipfFrequency(word, language)
  if (zipf === undefined) return defaultValue
  return zipfToUsefulness(zipf)
}
