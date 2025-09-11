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

const providers = new Map<string, DictionaryProvider>()

// Register providers
providers.set('demo', new DemoDictionaryProvider())

// Initialize other providers if API keys are available
if (process.env.SPANISH_DICT_API_KEY) {
  providers.set('spanish-dict', new SpanishDictProvider(process.env.SPANISH_DICT_API_KEY))
}

if (process.env.WORDS_API_KEY) {
  providers.set('wordsapi', new WordsAPIProvider(process.env.WORDS_API_KEY))
}

export async function define(word: string, lang: string = 'es'): Promise<Definition> {
  const providerName = process.env.DICTIONARY_PROVIDER || 'demo'
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