import compromise from 'compromise'

export interface ParsedToken {
  text: string
  lemma: string
  pos: string
  isVerb: boolean
  tense?: string
  confidence: number
}

export interface ParsedLine {
  line: string
  sentenceIndex: number
  tokens: ParsedToken[]
}

export interface ConjugationTable {
  lemma: string
  presente: { [key: string]: string }
  preterito: { [key: string]: string }
  imperfecto: { [key: string]: string }
  futuro: { [key: string]: string }
  condicional: { [key: string]: string }
  subjuntivo_presente: { [key: string]: string }
  subjuntivo_imperfecto: { [key: string]: string }
}

// Simple Spanish tense detection patterns
const TENSE_PATTERNS = {
  presente: [
    /o$/, /as$/, /a$/, /amos$/, /áis$/, /an$/,
    /es$/, /e$/, /emos$/, /éis$/, /en$/,
  ],
  preterito: [
    /é$/, /aste$/, /ó$/, /amos$/, /asteis$/, /aron$/,
    /í$/, /iste$/, /ió$/, /imos$/, /isteis$/, /ieron$/,
  ],
  imperfecto: [
    /aba$/, /abas$/, /aba$/, /ábamos$/, /abais$/, /aban$/,
    /ía$/, /ías$/, /ía$/, /íamos$/, /íais$/, /ían$/,
  ],
  futuro: [
    /é$/, /ás$/, /á$/, /emos$/, /éis$/, /án$/,
  ],
  condicional: [
    /ía$/, /ías$/, /ía$/, /íamos$/, /íais$/, /ían$/,
  ],
  subjuntivo: [
    /que.*[ae]$/, /si.*[ae]ra$/, /si.*[ae]se$/,
  ],
}

// Common Spanish verb endings
const VERB_ENDINGS = [
  'ar', 'er', 'ir', 'ár', 'ér', 'ír'
]

// Spanish POS mappings
const POS_MAPPINGS: { [key: string]: string } = {
  'Noun': 'NOUN',
  'Verb': 'VERB',
  'Adjective': 'ADJ',
  'Adverb': 'ADV',
  'Determiner': 'DET',
  'Pronoun': 'PRON',
  'Preposition': 'ADP',
  'Conjunction': 'CONJ',
  'Interjection': 'INTJ',
}

function detectTense(word: string, lemma: string): string | undefined {
  const lowerWord = word.toLowerCase()
  
  // Check each tense pattern
  for (const [tense, patterns] of Object.entries(TENSE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerWord)) {
        return tense
      }
    }
  }
  
  return undefined
}

function isVerb(word: string, pos: string): boolean {
  if (pos === 'VERB') return true
  
  const lowerWord = word.toLowerCase()
  
  // Check if it ends like a verb
  return VERB_ENDINGS.some(ending => 
    lowerWord.endsWith(ending) || lowerWord.endsWith(ending + 's')
  )
}

function getLemma(word: string): string {
  // Simple lemmatization for Spanish
  const lowerWord = word.toLowerCase()
  
  // Remove common verb endings to get root
  if (lowerWord.endsWith('ando') || lowerWord.endsWith('iendo')) {
    return lowerWord.slice(0, -5) + 'ar'
  }
  
  if (lowerWord.endsWith('ado') || lowerWord.endsWith('ido')) {
    return lowerWord.slice(0, -3) + 'ar'
  }
  
  // Remove simple plural endings
  if (lowerWord.endsWith('s') && lowerWord.length > 3) {
    return lowerWord.slice(0, -1)
  }
  
  return lowerWord
}

export function analyzeLine(line: string, sentenceIndex: number = 0): ParsedLine {
  // Use compromise for basic tokenization and POS tagging
  const doc = compromise(line)
  const tokens: ParsedToken[] = []
  
  const terms = doc.terms().out('array')
  
  terms.forEach((term: any) => {
    const text = typeof term === 'string' ? term : (term.text || term)
    
    // Simple POS detection for Spanish
    let pos = 'OTHER'
    const lowerText = text.toLowerCase()
    
    // Basic Spanish POS patterns
    if (/^(el|la|los|las|un|una|unos|unas)$/i.test(lowerText)) pos = 'DET'
    else if (/^(yo|tú|él|ella|nosotros|vosotros|ellos|ellas|me|te|se|nos|os|lo|la|le|les)$/i.test(lowerText)) pos = 'PRON'
    else if (/^(de|en|con|por|para|sin|sobre|bajo|entre|desde|hacia|hasta)$/i.test(lowerText)) pos = 'ADP'
    else if (/^(y|o|pero|aunque|porque|que|si|cuando|donde|como)$/i.test(lowerText)) pos = 'CONJ'
    else if (/(ar|er|ir|ando|iendo|ado|ido)$/i.test(lowerText)) pos = 'VERB'
    else if (/(mente)$/i.test(lowerText)) pos = 'ADV'
    else if (/(o|a|os|as)$/i.test(lowerText) && lowerText.length > 3) pos = 'ADJ'
    else pos = 'NOUN' // Default for most Spanish words
    
    const lemma = getLemma(text)
    const verbCheck = isVerb(text, pos)
    const tense = verbCheck ? detectTense(text, lemma) : undefined
    
    tokens.push({
      text,
      lemma,
      pos,
      isVerb: verbCheck,
      tense,
      confidence: 0.8, // Static confidence for now
    })
  })
  
  return {
    line,
    sentenceIndex,
    tokens,
  }
}

// Common Spanish verb conjugations (simplified)
const COMMON_CONJUGATIONS: { [key: string]: ConjugationTable } = {
  'hablar': {
    lemma: 'hablar',
    presente: { yo: 'hablo', tú: 'hablas', él: 'habla', nosotros: 'hablamos', vosotros: 'habláis', ellos: 'hablan' },
    preterito: { yo: 'hablé', tú: 'hablaste', él: 'habló', nosotros: 'hablamos', vosotros: 'hablasteis', ellos: 'hablaron' },
    imperfecto: { yo: 'hablaba', tú: 'hablabas', él: 'hablaba', nosotros: 'hablábamos', vosotros: 'hablabais', ellos: 'hablaban' },
    futuro: { yo: 'hablaré', tú: 'hablarás', él: 'hablará', nosotros: 'hablaremos', vosotros: 'hablaréis', ellos: 'hablarán' },
    condicional: { yo: 'hablaría', tú: 'hablarías', él: 'hablaría', nosotros: 'hablaríamos', vosotros: 'hablaríais', ellos: 'hablarían' },
    subjuntivo_presente: { yo: 'hable', tú: 'hables', él: 'hable', nosotros: 'hablemos', vosotros: 'habléis', ellos: 'hablen' },
    subjuntivo_imperfecto: { yo: 'hablara', tú: 'hablaras', él: 'hablara', nosotros: 'habláramos', vosotros: 'hablarais', ellos: 'hablaran' },
  },
  'comer': {
    lemma: 'comer',
    presente: { yo: 'como', tú: 'comes', él: 'come', nosotros: 'comemos', vosotros: 'coméis', ellos: 'comen' },
    preterito: { yo: 'comí', tú: 'comiste', él: 'comió', nosotros: 'comimos', vosotros: 'comisteis', ellos: 'comieron' },
    imperfecto: { yo: 'comía', tú: 'comías', él: 'comía', nosotros: 'comíamos', vosotros: 'comíais', ellos: 'comían' },
    futuro: { yo: 'comeré', tú: 'comerás', él: 'comerá', nosotros: 'comeremos', vosotros: 'comeréis', ellos: 'comerán' },
    condicional: { yo: 'comería', tú: 'comerías', él: 'comería', nosotros: 'comeríamos', vosotros: 'comeríais', ellos: 'comerían' },
    subjuntivo_presente: { yo: 'coma', tú: 'comas', él: 'coma', nosotros: 'comamos', vosotros: 'comáis', ellos: 'coman' },
    subjuntivo_imperfecto: { yo: 'comiera', tú: 'comieras', él: 'comiera', nosotros: 'comiéramos', vosotros: 'comierais', ellos: 'comieran' },
  },
  'vivir': {
    lemma: 'vivir',
    presente: { yo: 'vivo', tú: 'vives', él: 'vive', nosotros: 'vivimos', vosotros: 'vivís', ellos: 'viven' },
    preterito: { yo: 'viví', tú: 'viviste', él: 'vivió', nosotros: 'vivimos', vosotros: 'vivisteis', ellos: 'vivieron' },
    imperfecto: { yo: 'vivía', tú: 'vivías', él: 'vivía', nosotros: 'vivíamos', vosotros: 'vivíais', ellos: 'vivían' },
    futuro: { yo: 'viviré', tú: 'vivirás', él: 'vivirá', nosotros: 'viviremos', vosotros: 'viviréis', ellos: 'vivirán' },
    condicional: { yo: 'viviría', tú: 'vivirías', él: 'viviría', nosotros: 'viviríamos', vosotros: 'viviríais', ellos: 'vivirían' },
    subjuntivo_presente: { yo: 'viva', tú: 'vivas', él: 'viva', nosotros: 'vivamos', vosotros: 'viváis', ellos: 'vivan' },
    subjuntivo_imperfecto: { yo: 'viviera', tú: 'vivieras', él: 'viviera', nosotros: 'viviéramos', vosotros: 'vivierais', ellos: 'vivieran' },
  },
}

export function conjugations(lemma: string): ConjugationTable | null {
  // First check our common conjugations
  if (COMMON_CONJUGATIONS[lemma]) {
    return COMMON_CONJUGATIONS[lemma]
  }
  
  // For unknown verbs, try to generate based on ending
  if (lemma.endsWith('ar')) {
    return generateArConjugation(lemma)
  } else if (lemma.endsWith('er')) {
    return generateErConjugation(lemma)
  } else if (lemma.endsWith('ir')) {
    return generateIrConjugation(lemma)
  }
  
  return null
}

function generateArConjugation(lemma: string): ConjugationTable {
  const stem = lemma.slice(0, -2)
  return {
    lemma,
    presente: {
      yo: stem + 'o',
      tú: stem + 'as',
      él: stem + 'a',
      nosotros: stem + 'amos',
      vosotros: stem + 'áis',
      ellos: stem + 'an'
    },
    preterito: {
      yo: stem + 'é',
      tú: stem + 'aste',
      él: stem + 'ó',
      nosotros: stem + 'amos',
      vosotros: stem + 'asteis',
      ellos: stem + 'aron'
    },
    imperfecto: {
      yo: stem + 'aba',
      tú: stem + 'abas',
      él: stem + 'aba',
      nosotros: stem + 'ábamos',
      vosotros: stem + 'abais',
      ellos: stem + 'aban'
    },
    futuro: {
      yo: lemma + 'é',
      tú: lemma + 'ás',
      él: lemma + 'á',
      nosotros: lemma + 'emos',
      vosotros: lemma + 'éis',
      ellos: lemma + 'án'
    },
    condicional: {
      yo: lemma + 'ía',
      tú: lemma + 'ías',
      él: lemma + 'ía',
      nosotros: lemma + 'íamos',
      vosotros: lemma + 'íais',
      ellos: lemma + 'ían'
    },
    subjuntivo_presente: {
      yo: stem + 'e',
      tú: stem + 'es',
      él: stem + 'e',
      nosotros: stem + 'emos',
      vosotros: stem + 'éis',
      ellos: stem + 'en'
    },
    subjuntivo_imperfecto: {
      yo: stem + 'ara',
      tú: stem + 'aras',
      él: stem + 'ara',
      nosotros: stem + 'áramos',
      vosotros: stem + 'arais',
      ellos: stem + 'aran'
    }
  }
}

function generateErConjugation(lemma: string): ConjugationTable {
  const stem = lemma.slice(0, -2)
  return {
    lemma,
    presente: {
      yo: stem + 'o',
      tú: stem + 'es',
      él: stem + 'e',
      nosotros: stem + 'emos',
      vosotros: stem + 'éis',
      ellos: stem + 'en'
    },
    preterito: {
      yo: stem + 'í',
      tú: stem + 'iste',
      él: stem + 'ió',
      nosotros: stem + 'imos',
      vosotros: stem + 'isteis',
      ellos: stem + 'ieron'
    },
    imperfecto: {
      yo: stem + 'ía',
      tú: stem + 'ías',
      él: stem + 'ía',
      nosotros: stem + 'íamos',
      vosotros: stem + 'íais',
      ellos: stem + 'ían'
    },
    futuro: {
      yo: lemma + 'é',
      tú: lemma + 'ás',
      él: lemma + 'á',
      nosotros: lemma + 'emos',
      vosotros: lemma + 'éis',
      ellos: lemma + 'án'
    },
    condicional: {
      yo: lemma + 'ía',
      tú: lemma + 'ías',
      él: lemma + 'ía',
      nosotros: lemma + 'íamos',
      vosotros: lemma + 'íais',
      ellos: lemma + 'ían'
    },
    subjuntivo_presente: {
      yo: stem + 'a',
      tú: stem + 'as',
      él: stem + 'a',
      nosotros: stem + 'amos',
      vosotros: stem + 'áis',
      ellos: stem + 'an'
    },
    subjuntivo_imperfecto: {
      yo: stem + 'iera',
      tú: stem + 'ieras',
      él: stem + 'iera',
      nosotros: stem + 'iéramos',
      vosotros: stem + 'ierais',
      ellos: stem + 'ieran'
    }
  }
}

function generateIrConjugation(lemma: string): ConjugationTable {
  const stem = lemma.slice(0, -2)
  return {
    lemma,
    presente: {
      yo: stem + 'o',
      tú: stem + 'es',
      él: stem + 'e',
      nosotros: stem + 'imos',
      vosotros: stem + 'ís',
      ellos: stem + 'en'
    },
    preterito: {
      yo: stem + 'í',
      tú: stem + 'iste',
      él: stem + 'ió',
      nosotros: stem + 'imos',
      vosotros: stem + 'isteis',
      ellos: stem + 'ieron'
    },
    imperfecto: {
      yo: stem + 'ía',
      tú: stem + 'ías',
      él: stem + 'ía',
      nosotros: stem + 'íamos',
      vosotros: stem + 'íais',
      ellos: stem + 'ían'
    },
    futuro: {
      yo: lemma + 'é',
      tú: lemma + 'ás',
      él: lemma + 'á',
      nosotros: lemma + 'emos',
      vosotros: lemma + 'éis',
      ellos: lemma + 'án'
    },
    condicional: {
      yo: lemma + 'ía',
      tú: lemma + 'ías',
      él: lemma + 'ía',
      nosotros: lemma + 'íamos',
      vosotros: lemma + 'íais',
      ellos: lemma + 'ían'
    },
    subjuntivo_presente: {
      yo: stem + 'a',
      tú: stem + 'as',
      él: stem + 'a',
      nosotros: stem + 'amos',
      vosotros: stem + 'áis',
      ellos: stem + 'an'
    },
    subjuntivo_imperfecto: {
      yo: stem + 'iera',
      tú: stem + 'ieras',
      él: stem + 'iera',
      nosotros: stem + 'iéramos',
      vosotros: stem + 'ierais',
      ellos: stem + 'ieran'
    }
  }
}