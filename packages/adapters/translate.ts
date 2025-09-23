import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export interface Translation {
  text: string
  source: string
  target: string
  provider: string
}

export interface Translator {
  name: string
  translate(text: string, targetLang: string): Promise<Translation>
  batchTranslate?(texts: string[], targetLang: string): Promise<Translation[]>
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
    // If we don't have a demo translation, just return the original text
    // This avoids showing "[Demo translation of: ...]" when real translation fails
    const translation = this.demoTranslations[lowerText] || text

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
      // Always use free endpoint for now - the :fx suffix detection is unreliable
      const apiUrl = 'https://api-free.deepl.com/v2/translate'

      const response = await fetch(apiUrl, {
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

  async batchTranslate(texts: string[], targetLang: string = 'EN'): Promise<Translation[]> {
    try {
      // Deduplicate texts while preserving order
      const uniqueTexts = Array.from(new Set(texts))
      const textToTranslation = new Map<string, Translation>()

      // Always use free endpoint for now - the :fx suffix detection is unreliable
      const apiUrl = 'https://api-free.deepl.com/v2/translate'

      // DeepL supports up to 50 texts per request
      const chunks: string[][] = []
      for (let i = 0; i < uniqueTexts.length; i += 50) {
        chunks.push(uniqueTexts.slice(i, i + 50))
      }

      for (const chunk of chunks) {
        const params = new URLSearchParams()
        chunk.forEach(text => params.append('text', text))
        params.append('source_lang', 'ES')
        params.append('target_lang', targetLang.toUpperCase())

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params
        })

        if (!response.ok) {
          throw new Error(`DeepL batch failed: ${response.status}`)
        }

        const data = await response.json()
        const translations = data.translations || []

        // Map translations back to original texts
        for (let i = 0; i < chunk.length && i < translations.length; i++) {
          textToTranslation.set(chunk[i], {
            text: translations[i].text,
            source: 'es',
            target: targetLang.toLowerCase(),
            provider: this.name
          })
        }
      }

      // Return translations in the original order (including duplicates)
      return texts.map(text => textToTranslation.get(text) || {
        text: text,
        source: 'es',
        target: targetLang.toLowerCase(),
        provider: this.name
      })
    } catch (error) {
      console.error('DeepL batch error:', error)
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

class OpenAITranslator implements Translator {
  name = 'openai'
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async translate(text: string, targetLang: string = 'en'): Promise<Translation> {
    try {
      // Don't translate proper names or already English text
      if (this.isProperName(text) || this.isAlreadyEnglish(text)) {
        return {
          text: text,
          source: 'es',
          target: targetLang,
          provider: this.name
        }
      }

      const prompt = `Translate the following Spanish song lyric to English. Preserve the meaning and emotion while making it natural in English. If it's a proper name (artist name, place, etc.) or already in English, keep it unchanged.

Spanish: "${text}"

Provide ONLY the English translation, nothing else:`

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a professional translator specializing in song lyrics. Translate accurately while preserving emotion and artistic intent.'
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 150
      })

      const translatedText = response.choices[0]?.message?.content?.trim() || text

      return {
        text: translatedText,
        source: 'es',
        target: targetLang,
        provider: this.name
      }
    } catch (error) {
      console.error('OpenAI translation error:', error)
      throw error
    }
  }

  async batchTranslate(texts: string[], targetLang: string = 'en'): Promise<Translation[]> {
    try {
      // For very small batches, translate individually
      if (texts.length <= 3) {
        return Promise.all(texts.map(text => this.translate(text, targetLang)))
      }

      // Create a numbered list for batch translation
      const numberedTexts = texts
        .map((text, i) => `${i + 1}. ${text}`)
        .join('\n')

      const prompt = `Translate these Spanish song lyrics to English. For each line:
- Preserve the meaning and emotion while making it natural in English
- Keep proper names (artists, places) unchanged
- Keep text that's already in English unchanged
- Maintain the exact same number of lines

Spanish lyrics:
${numberedTexts}

Provide ONLY the translations in the same numbered format, nothing else:`

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a professional translator specializing in song lyrics. Translate accurately while preserving emotion and artistic intent.'
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 2000
      })

      const responseText = response.choices[0]?.message?.content?.trim() || ''

      // Parse the numbered response
      const translations = responseText
        .split('\n')
        .map(line => {
          // Remove the number prefix (e.g., "1. " or "1) ")
          const match = line.match(/^\d+[\.\)]\s*(.*)/)
          return match ? match[1] : line
        })
        .filter(line => line.length > 0)

      // Ensure we have the right number of translations
      if (translations.length !== texts.length) {
        console.warn(`Translation count mismatch: expected ${texts.length}, got ${translations.length}`)
        // Fall back to individual translation
        return Promise.all(texts.map(text => this.translate(text, targetLang)))
      }

      return translations.map((text, i) => ({
        text,
        source: 'es',
        target: targetLang,
        provider: this.name
      }))
    } catch (error) {
      console.error('OpenAI batch translation error:', error)
      // Fall back to individual translations
      return Promise.all(texts.map(text => this.translate(text, targetLang)))
    }
  }

  private isProperName(text: string): boolean {
    // List of known artist names and proper nouns in the songs
    const properNames = [
      'Enrique Iglesias', 'Gente de Zona', 'Descemer', 'Shakira',
      'Maluma', 'Bad Bunny', 'J Balvin', 'Daddy Yankee'
    ]
    return properNames.some(name => text.includes(name))
  }

  private isAlreadyEnglish(text: string): boolean {
    // Check if the text is already in English
    const englishPhrases = [
      'One love', 'one love', 'Oh', 'oh', 'Ha', 'ha',
      'Yeah', 'yeah', 'Baby', 'baby'
    ]
    return englishPhrases.some(phrase => text.toLowerCase() === phrase.toLowerCase())
  }
}

class ClaudeTranslator implements Translator {
  name = 'claude'
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async translate(text: string, targetLang: string = 'en'): Promise<Translation> {
    try {
      // Don't translate proper names or already English text
      if (this.isProperName(text) || this.isAlreadyEnglish(text)) {
        return {
          text: text,
          source: 'es',
          target: targetLang,
          provider: this.name
        }
      }

      const prompt = `Translate the following Spanish song lyric to English. Preserve the meaning and emotion while making it natural in English. If it's a proper name (artist name, place, etc.) or already in English, keep it unchanged.

Spanish: "${text}"

Provide ONLY the English translation, nothing else:`

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const translatedText = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : text

      return {
        text: translatedText,
        source: 'es',
        target: targetLang,
        provider: this.name
      }
    } catch (error) {
      console.error('Claude translation error:', error)
      throw error
    }
  }

  async batchTranslate(texts: string[], targetLang: string = 'en'): Promise<Translation[]> {
    try {
      // For very small batches, translate individually
      if (texts.length <= 3) {
        return Promise.all(texts.map(text => this.translate(text, targetLang)))
      }

      // Create a numbered list for batch translation
      const numberedTexts = texts
        .map((text, i) => `${i + 1}. ${text}`)
        .join('\n')

      const prompt = `Translate these Spanish song lyrics to English. For each line:
- Preserve the meaning and emotion while making it natural in English
- Keep proper names (artists, places) unchanged
- Keep text that's already in English unchanged
- Maintain the exact same number of lines

Spanish lyrics:
${numberedTexts}

Provide ONLY the translations in the same numbered format, nothing else:`

      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : ''

      // Parse the numbered response
      const translations = responseText
        .split('\n')
        .map(line => {
          // Remove the number prefix (e.g., "1. " or "1) ")
          const match = line.match(/^\d+[\.\)]\s*(.*)/)
          return match ? match[1] : line
        })
        .filter(line => line.length > 0)

      // Ensure we have the right number of translations
      if (translations.length !== texts.length) {
        console.warn(`Translation count mismatch: expected ${texts.length}, got ${translations.length}`)
        // Fall back to individual translation
        return Promise.all(texts.map(text => this.translate(text, targetLang)))
      }

      return translations.map((text, i) => ({
        text,
        source: 'es',
        target: targetLang,
        provider: this.name
      }))
    } catch (error) {
      console.error('Claude batch translation error:', error)
      // Fall back to individual translations
      return Promise.all(texts.map(text => this.translate(text, targetLang)))
    }
  }

  private isProperName(text: string): boolean {
    // List of known artist names and proper nouns in the songs
    const properNames = [
      'Enrique Iglesias', 'Gente de Zona', 'Descemer', 'Shakira',
      'Maluma', 'Bad Bunny', 'J Balvin', 'Daddy Yankee'
    ]
    return properNames.some(name => text.includes(name))
  }

  private isAlreadyEnglish(text: string): boolean {
    // Check if the text is already in English
    const englishPhrases = [
      'One love', 'one love', 'Oh', 'oh', 'Ha', 'ha',
      'Yeah', 'yeah', 'Baby', 'baby'
    ]
    return englishPhrases.some(phrase => text.toLowerCase() === phrase.toLowerCase())
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

// Initialize OpenAI if API key is available
if (process.env.OPENAI_API_KEY) {
  translators.set('openai', new OpenAITranslator(process.env.OPENAI_API_KEY))
}

// Initialize Claude if API key is available
if (process.env.ANTHROPIC_API_KEY) {
  translators.set('claude', new ClaudeTranslator(process.env.ANTHROPIC_API_KEY))
}

export async function generateSongSummary(translatedLyrics: string[], songTitle: string, artist: string): Promise<string> {
  try {
    // Check if we have translations
    if (!translatedLyrics || translatedLyrics.length === 0) {
      return "Problem fetching translations"
    }

    // Check if OpenAI is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not available for song summary generation')
      return "Problem fetching translations"
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Join lyrics into a single text
    const lyricsText = translatedLyrics
      .filter(line => line && line.trim())
      .join('\n')

    const prompt = `Analyze these song lyrics and provide an extremely concise summary (MAXIMUM 36 words) of the song's theme and cultural significance for Spanish language learners.

Song: "${songTitle}" by ${artist}

Lyrics:
${lyricsText}

Provide a summary in EXACTLY 36 words or less - be concise and focus on the essential meaning:`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: 'You are a music educator helping Spanish language learners. Provide extremely concise summaries (36 words MAX) focusing on theme, meaning, and cultural context. Be brief and direct.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.5,
      max_tokens: 80
    })

    const summary = response.choices[0]?.message?.content?.trim()

    if (!summary) {
      return "Problem fetching translations"
    }

    return summary
  } catch (error) {
    console.error('Error generating song summary:', error)
    return "Problem fetching translations"
  }
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

    // Only fall back to demo if we're not already using demo
    // and the text is English (likely already translated or doesn't need translation)
    if (translatorName !== 'demo') {
      // Check if text appears to be English already (simple heuristic)
      const isLikelyEnglish = /^[a-zA-Z0-9\s.,!?'"()-]+$/.test(text)

      if (isLikelyEnglish) {
        // Return as-is if it's already English
        return {
          text: text,
          source: 'en',
          target: targetLang,
          provider: 'passthrough'
        }
      }

      // For actual Spanish text, we should throw the error instead of falling back
      // This way the UI can handle it appropriately
      throw error
    }

    throw error
  }
}

export async function batchTranslate(texts: string[], targetLang: string = 'en'): Promise<Translation[]> {
  const translatorName = process.env.TRANSLATOR || 'demo'
  const translator = translators.get(translatorName)

  if (!translator) {
    console.warn(`Translator '${translatorName}' not found, falling back to demo`)
    const demoTranslator = translators.get('demo')!
    // Demo translator doesn't have batch, fall back to sequential
    return Promise.all(texts.map(text => demoTranslator.translate(text, targetLang)))
  }

  try {
    // Use batch if available, otherwise fall back to sequential
    if (translator.batchTranslate) {
      return await translator.batchTranslate(texts, targetLang)
    } else {
      // Sequential fallback
      return Promise.all(texts.map(text => translator.translate(text, targetLang)))
    }
  } catch (error) {
    console.error(`Batch translator '${translatorName}' error:`, error)
    throw error
  }
}

export function getAvailableTranslators(): string[] {
  return Array.from(translators.keys())
}

export function isTranslatorConfigured(translatorName: string): boolean {
  return translators.has(translatorName)
}