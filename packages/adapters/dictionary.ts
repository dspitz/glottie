import { translate } from './translate'

export interface Definition {
  word: string
  lemma: string
  pos: string
  definitions: string[]
  examples?: string[]
  provider: string
}

export interface DictionaryProvider {
  name: string
  define(word: string, lang: string): Promise<Definition>
}

class DemoDictionaryProvider implements DictionaryProvider {
  name = 'demo'
  
  private demoDefinitions: { [key: string]: Omit<Definition, 'provider'> } = {
    'amor': {
      word: 'amor',
      lemma: 'amor',
      pos: 'NOUN',
      definitions: ['love, affection', 'romantic feeling'],
      examples: ['Siento mucho amor por ti', 'El amor es ciego']
    },
    'corazón': {
      word: 'corazón',
      lemma: 'corazón',
      pos: 'NOUN',
      definitions: ['heart (organ)', 'heart (emotions)', 'core, center'],
      examples: ['Mi corazón late rápido', 'Habla desde el corazón']
    },
    'casa': {
      word: 'casa',
      lemma: 'casa',
      pos: 'NOUN',
      definitions: ['house, home', 'household'],
      examples: ['Voy a casa', 'Mi casa es tu casa']
    },
    'hablar': {
      word: 'hablar',
      lemma: 'hablar',
      pos: 'VERB',
      definitions: ['to speak, to talk'],
      examples: ['¿Hablas español?', 'Vamos a hablar']
    },
    'bueno': {
      word: 'bueno',
      lemma: 'bueno',
      pos: 'ADJ',
      definitions: ['good, nice', 'well (adverb)'],
      examples: ['Es un hombre bueno', '¡Muy bueno!']
    },
    'tiempo': {
      word: 'tiempo',
      lemma: 'tiempo',
      pos: 'NOUN',
      definitions: ['time', 'weather', 'tense (grammar)'],
      examples: ['No tengo tiempo', 'Hace buen tiempo']
    },
    'agua': {
      word: 'agua',
      lemma: 'agua',
      pos: 'NOUN',
      definitions: ['water'],
      examples: ['Bebo agua', 'El agua está fría']
    },
    'grande': {
      word: 'grande',
      lemma: 'grande',
      pos: 'ADJ',
      definitions: ['big, large', 'great, important'],
      examples: ['Una casa grande', 'Es un gran hombre']
    },
    'vida': {
      word: 'vida',
      lemma: 'vida',
      pos: 'NOUN',
      definitions: ['life', 'living, livelihood'],
      examples: ['La vida es bella', 'Gana la vida trabajando']
    },
    'día': {
      word: 'día',
      lemma: 'día',
      pos: 'NOUN',
      definitions: ['day', 'daytime'],
      examples: ['Buenos días', 'Durante el día']
    },
    // Common adverbs and location words
    'aquí': {
      word: 'aquí',
      lemma: 'aquí',
      pos: 'ADV',
      definitions: ['here', 'over here'],
      examples: ['Estoy aquí', 'Ven aquí']
    },
    'allí': {
      word: 'allí',
      lemma: 'allí',
      pos: 'ADV',
      definitions: ['there', 'over there'],
      examples: ['Está allí', 'Vamos allí']
    },
    'ahí': {
      word: 'ahí',
      lemma: 'ahí',
      pos: 'ADV',
      definitions: ['there', 'right there'],
      examples: ['Ahí está', 'Déjalo ahí']
    },
    'ahora': {
      word: 'ahora',
      lemma: 'ahora',
      pos: 'ADV',
      definitions: ['now', 'right now'],
      examples: ['Vamos ahora', 'Ahora no puedo']
    },
    'siempre': {
      word: 'siempre',
      lemma: 'siempre',
      pos: 'ADV',
      definitions: ['always', 'forever'],
      examples: ['Siempre te amaré', 'Como siempre']
    },
    'nunca': {
      word: 'nunca',
      lemma: 'nunca',
      pos: 'ADV',
      definitions: ['never', 'not ever'],
      examples: ['Nunca te olvido', 'Nunca más']
    },
    'hoy': {
      word: 'hoy',
      lemma: 'hoy',
      pos: 'ADV',
      definitions: ['today'],
      examples: ['Hoy es lunes', 'Hoy no trabajo']
    },
    'mañana': {
      word: 'mañana',
      lemma: 'mañana',
      pos: 'NOUN',
      definitions: ['tomorrow', 'morning'],
      examples: ['Hasta mañana', 'Por la mañana']
    },
    'noche': {
      word: 'noche',
      lemma: 'noche',
      pos: 'NOUN',
      definitions: ['night', 'evening'],
      examples: ['Buenas noches', 'Toda la noche']
    },
    // Common verbs
    'ser': {
      word: 'ser',
      lemma: 'ser',
      pos: 'VERB',
      definitions: ['to be (permanent/essence)'],
      examples: ['Soy médico', 'Eres muy amable']
    },
    'estar': {
      word: 'estar',
      lemma: 'estar',
      pos: 'VERB',
      definitions: ['to be (temporary/location)'],
      examples: ['Estoy cansado', 'Está en casa']
    },
    'tener': {
      word: 'tener',
      lemma: 'tener',
      pos: 'VERB',
      definitions: ['to have', 'to possess'],
      examples: ['Tengo hambre', 'Tienes razón']
    },
    'hacer': {
      word: 'hacer',
      lemma: 'hacer',
      pos: 'VERB',
      definitions: ['to do', 'to make'],
      examples: ['¿Qué haces?', 'Hacer la tarea']
    },
    'ir': {
      word: 'ir',
      lemma: 'ir',
      pos: 'VERB',
      definitions: ['to go'],
      examples: ['Voy a casa', 'Vamos al cine']
    },
    'venir': {
      word: 'venir',
      lemma: 'venir',
      pos: 'VERB',
      definitions: ['to come'],
      examples: ['Ven acá', 'Viene mañana']
    },
    'ver': {
      word: 'ver',
      lemma: 'ver',
      pos: 'VERB',
      definitions: ['to see', 'to watch'],
      examples: ['Te veo mañana', 'Ver televisión']
    },
    'saber': {
      word: 'saber',
      lemma: 'saber',
      pos: 'VERB',
      definitions: ['to know (facts)', 'to know how to'],
      examples: ['Sé la respuesta', 'Saber nadar']
    },
    'querer': {
      word: 'querer',
      lemma: 'querer',
      pos: 'VERB',
      definitions: ['to want', 'to love'],
      examples: ['Quiero agua', 'Te quiero mucho']
    },
    'poder': {
      word: 'poder',
      lemma: 'poder',
      pos: 'VERB',
      definitions: ['to be able to', 'can'],
      examples: ['Puedo ayudarte', 'No puede venir']
    },
    'dar': {
      word: 'dar',
      lemma: 'dar',
      pos: 'VERB',
      definitions: ['to give'],
      examples: ['Dame el libro', 'Dar un regalo']
    },
    'llevar': {
      word: 'llevar',
      lemma: 'llevar',
      pos: 'VERB',
      definitions: ['to carry', 'to take', 'to wear'],
      examples: ['Llevar una maleta', 'Llevar un vestido']
    },
    'sentir': {
      word: 'sentir',
      lemma: 'sentir',
      pos: 'VERB',
      definitions: ['to feel', 'to sense'],
      examples: ['Me siento bien', 'Sentir el viento']
    },
    // Common adjectives
    'bueno': {
      word: 'bueno',
      lemma: 'bueno',
      pos: 'ADJ',
      definitions: ['good', 'well'],
      examples: ['Un buen día', 'Está bueno']
    },
    'malo': {
      word: 'malo',
      lemma: 'malo',
      pos: 'ADJ',
      definitions: ['bad', 'evil'],
      examples: ['Mal tiempo', 'Es malo']
    },
    'nuevo': {
      word: 'nuevo',
      lemma: 'nuevo',
      pos: 'ADJ',
      definitions: ['new'],
      examples: ['Un coche nuevo', 'Año nuevo']
    },
    'viejo': {
      word: 'viejo',
      lemma: 'viejo',
      pos: 'ADJ',
      definitions: ['old', 'elderly'],
      examples: ['Un hombre viejo', 'Casa vieja']
    },
    'pequeño': {
      word: 'pequeño',
      lemma: 'pequeño',
      pos: 'ADJ',
      definitions: ['small', 'little'],
      examples: ['Un perro pequeño', 'Problema pequeño']
    },
    'bonito': {
      word: 'bonito',
      lemma: 'bonito',
      pos: 'ADJ',
      definitions: ['pretty', 'beautiful'],
      examples: ['Una casa bonita', 'Qué bonito']
    },
    'feo': {
      word: 'feo',
      lemma: 'feo',
      pos: 'ADJ',
      definitions: ['ugly', 'unpleasant'],
      examples: ['Un día feo', 'Está feo']
    },
    // Common nouns
    'mujer': {
      word: 'mujer',
      lemma: 'mujer',
      pos: 'NOUN',
      definitions: ['woman', 'wife'],
      examples: ['Una mujer bonita', 'Mi mujer']
    },
    'hombre': {
      word: 'hombre',
      lemma: 'hombre',
      pos: 'NOUN',
      definitions: ['man', 'husband'],
      examples: ['Un hombre alto', 'Mi hombre']
    },
    'niño': {
      word: 'niño',
      lemma: 'niño',
      pos: 'NOUN',
      definitions: ['child', 'boy'],
      examples: ['Un niño pequeño', 'Los niños juegan']
    },
    'niña': {
      word: 'niña',
      lemma: 'niña',
      pos: 'NOUN',
      definitions: ['child', 'girl'],
      examples: ['Una niña bonita', 'La niña canta']
    },
    'gente': {
      word: 'gente',
      lemma: 'gente',
      pos: 'NOUN',
      definitions: ['people'],
      examples: ['Mucha gente', 'La gente dice']
    },
    'mundo': {
      word: 'mundo',
      lemma: 'mundo',
      pos: 'NOUN',
      definitions: ['world'],
      examples: ['Todo el mundo', 'El mundo es grande']
    },
    'lugar': {
      word: 'lugar',
      lemma: 'lugar',
      pos: 'NOUN',
      definitions: ['place', 'location'],
      examples: ['Un buen lugar', 'En primer lugar']
    },
    'momento': {
      word: 'momento',
      lemma: 'momento',
      pos: 'NOUN',
      definitions: ['moment', 'time'],
      examples: ['Un momento', 'En este momento']
    },
    'cosa': {
      word: 'cosa',
      lemma: 'cosa',
      pos: 'NOUN',
      definitions: ['thing'],
      examples: ['Una cosa bonita', 'Otra cosa']
    },
    'trabajo': {
      word: 'trabajo',
      lemma: 'trabajo',
      pos: 'NOUN',
      definitions: ['work', 'job'],
      examples: ['Voy al trabajo', 'Buscar trabajo']
    },
    'dinero': {
      word: 'dinero',
      lemma: 'dinero',
      pos: 'NOUN',
      definitions: ['money'],
      examples: ['Necesito dinero', 'Ganar dinero']
    },
    'palabra': {
      word: 'palabra',
      lemma: 'palabra',
      pos: 'NOUN',
      definitions: ['word'],
      examples: ['Una palabra bonita', 'Decir palabras']
    },
    'música': {
      word: 'música',
      lemma: 'música',
      pos: 'NOUN',
      definitions: ['music'],
      examples: ['Me gusta la música', 'Escuchar música']
    },
    'canción': {
      word: 'canción',
      lemma: 'canción',
      pos: 'NOUN',
      definitions: ['song'],
      examples: ['Una canción bonita', 'Cantar una canción']
    },
    'baile': {
      word: 'baile',
      lemma: 'baile',
      pos: 'NOUN',
      definitions: ['dance', 'dancing'],
      examples: ['Un baile romántico', 'Ir al baile']
    },
    'fiesta': {
      word: 'fiesta',
      lemma: 'fiesta',
      pos: 'NOUN',
      definitions: ['party', 'celebration'],
      examples: ['Una fiesta grande', 'Hacer una fiesta']
    },
    // Pronouns and articles
    'yo': {
      word: 'yo',
      lemma: 'yo',
      pos: 'PRON',
      definitions: ['I', 'me'],
      examples: ['Yo soy estudiante', 'Conmigo']
    },
    'tú': {
      word: 'tú',
      lemma: 'tú',
      pos: 'PRON',
      definitions: ['you (informal)'],
      examples: ['Tú eres bonita', 'Contigo']
    },
    'él': {
      word: 'él',
      lemma: 'él',
      pos: 'PRON',
      definitions: ['he', 'him'],
      examples: ['Él es doctor', 'Con él']
    },
    'ella': {
      word: 'ella',
      lemma: 'ella',
      pos: 'PRON',
      definitions: ['she', 'her'],
      examples: ['Ella es profesora', 'Con ella']
    },
    'nosotros': {
      word: 'nosotros',
      lemma: 'nosotros',
      pos: 'PRON',
      definitions: ['we', 'us'],
      examples: ['Nosotros somos amigos', 'Con nosotros']
    },
    'mi': {
      word: 'mi',
      lemma: 'mi',
      pos: 'DET',
      definitions: ['my'],
      examples: ['Mi casa', 'Mi amor']
    },
    'tu': {
      word: 'tu',
      lemma: 'tu',
      pos: 'DET',
      definitions: ['your'],
      examples: ['Tu casa', 'Tu amor']
    },
    'su': {
      word: 'su',
      lemma: 'su',
      pos: 'DET',
      definitions: ['his', 'her', 'your (formal)'],
      examples: ['Su casa', 'Su amor']
    },
    // Common prepositions
    'en': {
      word: 'en',
      lemma: 'en',
      pos: 'PREP',
      definitions: ['in', 'on', 'at'],
      examples: ['En casa', 'En la mesa']
    },
    'de': {
      word: 'de',
      lemma: 'de',
      pos: 'PREP',
      definitions: ['of', 'from'],
      examples: ['Casa de Pedro', 'Vengo de México']
    },
    'con': {
      word: 'con',
      lemma: 'con',
      pos: 'PREP',
      definitions: ['with'],
      examples: ['Con amor', 'Voy con él']
    },
    'sin': {
      word: 'sin',
      lemma: 'sin',
      pos: 'PREP',
      definitions: ['without'],
      examples: ['Sin ti', 'Sin dinero']
    },
    'para': {
      word: 'para',
      lemma: 'para',
      pos: 'PREP',
      definitions: ['for', 'in order to'],
      examples: ['Para ti', 'Para estudiar']
    },
    'por': {
      word: 'por',
      lemma: 'por',
      pos: 'PREP',
      definitions: ['for', 'by', 'through'],
      examples: ['Por favor', 'Por la noche']
    },
    // Common conjunctions
    'y': {
      word: 'y',
      lemma: 'y',
      pos: 'CONJ',
      definitions: ['and'],
      examples: ['Tú y yo', 'Pan y agua']
    },
    'o': {
      word: 'o',
      lemma: 'o',
      pos: 'CONJ',
      definitions: ['or'],
      examples: ['Sí o no', 'Café o té']
    },
    'pero': {
      word: 'pero',
      lemma: 'pero',
      pos: 'CONJ',
      definitions: ['but'],
      examples: ['Quiero pero no puedo', 'Bonito pero caro']
    },
    'porque': {
      word: 'porque',
      lemma: 'porque',
      pos: 'CONJ',
      definitions: ['because'],
      examples: ['Porque te amo', 'No voy porque llueve']
    },
    // Common question words
    'qué': {
      word: 'qué',
      lemma: 'qué',
      pos: 'PRON',
      definitions: ['what'],
      examples: ['¿Qué haces?', '¿Qué quieres?']
    },
    'quién': {
      word: 'quién',
      lemma: 'quién',
      pos: 'PRON',
      definitions: ['who'],
      examples: ['¿Quién es?', '¿Quién viene?']
    },
    'dónde': {
      word: 'dónde',
      lemma: 'dónde',
      pos: 'ADV',
      definitions: ['where'],
      examples: ['¿Dónde está?', '¿Dónde vives?']
    },
    'cuándo': {
      word: 'cuándo',
      lemma: 'cuándo',
      pos: 'ADV',
      definitions: ['when'],
      examples: ['¿Cuándo vienes?', '¿Cuándo es?']
    },
    'cómo': {
      word: 'cómo',
      lemma: 'cómo',
      pos: 'ADV',
      definitions: ['how'],
      examples: ['¿Cómo estás?', '¿Cómo se hace?']
    },
    'por qué': {
      word: 'por qué',
      lemma: 'por qué',
      pos: 'ADV',
      definitions: ['why'],
      examples: ['¿Por qué lloras?', '¿Por qué no vienes?']
    }
  }

  async define(word: string, lang: string = 'es'): Promise<Definition> {
    const lowerWord = word.toLowerCase().trim()
    const definition = this.demoDefinitions[lowerWord]
    
    if (definition) {
      return {
        ...definition,
        provider: this.name
      }
    }
    
    // Fallback definition
    return {
      word,
      lemma: word,
      pos: 'UNKNOWN',
      definitions: [`[Demo definition for: ${word}]`],
      provider: this.name
    }
  }
}

class SpanishDictProvider implements DictionaryProvider {
  name = 'spanish-dict'
  private baseUrl = 'https://api.spanishdict.com'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  async define(word: string, lang: string = 'es'): Promise<Definition> {
    try {
      // This is a hypothetical API structure
      // In reality, you'd need to check SpanishDict's actual API documentation
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }

      const response = await fetch(
        `${this.baseUrl}/translate/${encodeURIComponent(word)}?from=${lang}&to=en`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`SpanishDict API failed: ${response.status}`)
      }

      const data = await response.json()
      
      // Process the response based on actual API structure
      return {
        word,
        lemma: data.lemma || word,
        pos: data.pos || 'UNKNOWN',
        definitions: data.definitions || [`Translation of ${word}`],
        examples: data.examples,
        provider: this.name
      }
    } catch (error) {
      console.error('SpanishDict error:', error)
      throw error
    }
  }
}

class WordsAPIProvider implements DictionaryProvider {
  name = 'wordsapi'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async define(word: string, lang: string = 'es'): Promise<Definition> {
    try {
      const response = await fetch(
        `https://wordsapiv1.p.rapidapi.com/words/${encodeURIComponent(word)}/definitions`,
        {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`WordsAPI failed: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        word,
        lemma: word,
        pos: data.definitions?.[0]?.partOfSpeech?.toUpperCase() || 'UNKNOWN',
        definitions: data.definitions?.map((def: any) => def.definition) || [`Definition of ${word}`],
        provider: this.name
      }
    } catch (error) {
      console.error('WordsAPI error:', error)
      throw error
    }
  }
}

class TranslationDictionaryProvider implements DictionaryProvider {
  name = 'translation'

  async define(word: string, lang: string = 'es'): Promise<Definition> {
    try {
      // Use the existing translation system to get the word's meaning
      const translation = await translate(word, 'en')

      return {
        word,
        lemma: word,
        pos: 'UNKNOWN', // Translation APIs don't typically provide part of speech
        definitions: [translation.text],
        examples: [], // Translation APIs don't provide usage examples
        provider: `${this.name} (${translation.provider})`
      }
    } catch (error) {
      console.error('Translation dictionary error:', error)

      // Return a basic definition indicating translation failed
      return {
        word,
        lemma: word,
        pos: 'UNKNOWN',
        definitions: [`Translation unavailable for: ${word}`],
        examples: [],
        provider: this.name
      }
    }
  }
}

const providers = new Map<string, DictionaryProvider>()

// Register providers
providers.set('demo', new DemoDictionaryProvider())
providers.set('translation', new TranslationDictionaryProvider())

// Initialize other providers if API keys are available
if (process.env.SPANISH_DICT_API_KEY) {
  providers.set('spanish-dict', new SpanishDictProvider(process.env.SPANISH_DICT_API_KEY))
}

if (process.env.WORDS_API_KEY) {
  providers.set('wordsapi', new WordsAPIProvider(process.env.WORDS_API_KEY))
}

export async function define(word: string, lang: string = 'es'): Promise<Definition> {
  const providerName = process.env.DICTIONARY_PROVIDER || 'translation'
  const provider = providers.get(providerName)

  if (!provider) {
    console.warn(`Dictionary provider '${providerName}' not found, falling back to demo`)
    return providers.get('demo')!.define(word, lang)
  }

  try {
    return await provider.define(word, lang)
  } catch (error) {
    console.error(`Dictionary provider '${providerName}' error:`, error)
    
    // Fall back to demo provider
    if (providerName !== 'demo') {
      console.warn(`Falling back to demo dictionary`)
      return providers.get('demo')!.define(word, lang)
    }
    
    throw error
  }
}

export function getAvailableProviders(): string[] {
  return Array.from(providers.keys())
}

export function isProviderConfigured(providerName: string): boolean {
  return providers.has(providerName)
}