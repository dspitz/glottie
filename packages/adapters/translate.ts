export interface Translation {
  text: string
  source: string
  target: string
  provider: string
}

export interface Translator {
  name: string
  translate(text: string, targetLang: string): Promise<Translation>
}

class DemoTranslator implements Translator {
  name = 'demo'
  
  private demoTranslations: { [key: string]: string } = {
    'solo un fragmento para demostración': 'just a fragment for demonstration',
    'esta es una línea de prueba': 'this is a test line',
    'los derechos completos requieren licencia': 'full rights require licensing',
    'te amo': 'I love you',
    'mi corazón': 'my heart',
    'buenos días': 'good morning',
    'buenas noches': 'good night',
    'por favor': 'please',
    'muchas gracias': 'thank you very much',
    'de nada': "you're welcome",
    'lo siento': 'I\'m sorry',
    'hasta luego': 'see you later',
    'cómo estás': 'how are you',
    'muy bien': 'very good',
    'qué tal': 'how\'s it going',
    'me llamo': 'my name is',
    'mucho gusto': 'nice to meet you',
    'habla despacio': 'speak slowly',
    'no entiendo': 'I don\'t understand',
    'repite por favor': 'repeat please',
    'esta canción no está disponible': 'this song is not available',
    'esta es una canción de prueba': 'this is a test song',
    'para demostrar la funcionalidad': 'to demonstrate the functionality',
    'de reproducción de vista previa': 'of preview playback',
    'en nuestra aplicación musical': 'in our music application'
  }

  async translate(text: string, targetLang: string = 'en'): Promise<Translation> {
    const lowerText = text.toLowerCase().trim()
    const translation = this.demoTranslations[lowerText] || `[Demo translation of: ${text}]`
    
    return {
      text: translation,
      source: 'es',
      target: targetLang,
      provider: this.name
    }
  }
}

class LibreTranslateAdapter implements Translator {
  name = 'libretranslate'
  private baseUrl: string

  constructor(baseUrl: string = 'https://libretranslate.com') {
    this.baseUrl = baseUrl
  }

  async translate(text: string, targetLang: string = 'en'): Promise<Translation> {
    try {
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'es',
          target: targetLang,
          format: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`LibreTranslate failed: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        text: data.translatedText,
        source: 'es',
        target: targetLang,
        provider: this.name
      }
    } catch (error) {
      console.error('LibreTranslate error:', error)
      throw error
    }
  }
}

class DeepLTranslator implements Translator {
  name = 'deepl'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async translate(text: string, targetLang: string = 'EN'): Promise<Translation> {
    try {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          source_lang: 'ES',
          target_lang: targetLang.toUpperCase()
        })
      })

      if (!response.ok) {
        throw new Error(`DeepL failed: ${response.status}`)
      }

      const data = await response.json()
      const translation = data.translations?.[0]
      
      if (!translation) {
        throw new Error('No translation returned from DeepL')
      }

      return {
        text: translation.text,
        source: 'es',
        target: targetLang.toLowerCase(),
        provider: this.name
      }
    } catch (error) {
      console.error('DeepL error:', error)
      throw error
    }
  }
}

class GoogleTranslateAdapter implements Translator {
  name = 'google'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async translate(text: string, targetLang: string = 'en'): Promise<Translation> {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: 'es',
            target: targetLang,
            format: 'text'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Translate failed: ${response.status}`)
      }

      const data = await response.json()
      const translation = data.data?.translations?.[0]
      
      if (!translation) {
        throw new Error('No translation returned from Google')
      }

      return {
        text: translation.translatedText,
        source: 'es',
        target: targetLang,
        provider: this.name
      }
    } catch (error) {
      console.error('Google Translate error:', error)
      throw error
    }
  }
}

const translators = new Map<string, Translator>()

// Register translators
translators.set('demo', new DemoTranslator())

// Initialize LibreTranslate
const libreUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com'
translators.set('libretranslate', new LibreTranslateAdapter(libreUrl))

// Initialize DeepL if API key is available
if (process.env.DEEPL_API_KEY) {
  translators.set('deepl', new DeepLTranslator(process.env.DEEPL_API_KEY))
}

// Initialize Google Translate if API key is available
if (process.env.GOOGLE_TRANSLATE_API_KEY) {
  translators.set('google', new GoogleTranslateAdapter(process.env.GOOGLE_TRANSLATE_API_KEY))
}

export async function translate(text: string, targetLang: string = 'en'): Promise<Translation> {
  const translatorName = process.env.TRANSLATOR || 'demo'
  const translator = translators.get(translatorName)

  if (!translator) {
    console.warn(`Translator '${translatorName}' not found, falling back to demo`)
    return translators.get('demo')!.translate(text, targetLang)
  }

  try {
    return await translator.translate(text, targetLang)
  } catch (error) {
    console.error(`Translator '${translatorName}' error:`, error)
    
    // Fall back to demo translator
    if (translatorName !== 'demo') {
      console.warn(`Falling back to demo translator`)
      return translators.get('demo')!.translate(text, targetLang)
    }
    
    throw error
  }
}

export function getAvailableTranslators(): string[] {
  return Array.from(translators.keys())
}

export function isTranslatorConfigured(translatorName: string): boolean {
  return translators.has(translatorName)
}