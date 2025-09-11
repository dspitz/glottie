export interface LyricsResult {
  raw?: string
  lines: string[]
  licensed: boolean
  provider: string
  isExcerpt: boolean
  attribution?: string
  culturalContext?: string
  translations?: { [targetLang: string]: string[] }
  error?: string
}

export interface LyricsProvider {
  name: string
  getLyrics(artist: string, title: string): Promise<LyricsResult>
}

// Translation helper function
async function translateLines(lines: string[], targetLang: string = 'en'): Promise<string[]> {
  try {
    // Import the translation function dynamically to avoid circular dependencies
    const { translate } = await import('./translate')
    
    const translatedLines: string[] = []
    
    for (const line of lines) {
      if (line.trim().length === 0) {
        translatedLines.push('')
        continue
      }
      
      try {
        const translation = await translate(line, targetLang)
        translatedLines.push(translation.text)
        
        // Small delay to be respectful to free translation services
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Failed to translate line: ${line}`, error)
        translatedLines.push(`[Translation unavailable: ${line}]`)
      }
    }
    
    return translatedLines
  } catch (error) {
    console.error('Translation service unavailable:', error)
    return lines.map(line => `[Translation unavailable: ${line}]`)
  }
}

class DemoLyricsProvider implements LyricsProvider {
  name = 'demo'

  private educationalLyrics: { [key: string]: { es: string[], en: string[], pt?: string[] } } = {
    // Beginner level - Basic vocabulary and present tense
    'beginner': {
      es: [
        'Hola, ¿cómo estás hoy?',
        'Me llamo María, ¿y tú?',
        'Vivo en una casa grande',
        'Mi familia es muy linda',
        'Cada día voy al trabajo',
        'Por la noche veo la luna',
        'El sol brilla en el cielo',
        'Aprendo español con música'
      ],
      en: [
        'Hello, how are you today?',
        'My name is María, and you?',
        'I live in a big house',
        'My family is very beautiful',
        'Every day I go to work',
        'At night I see the moon',
        'The sun shines in the sky',
        'I learn Spanish with music'
      ],
      pt: [
        'Olá, como você está hoje?',
        'Meu nome é María, e você?',
        'Eu moro em uma casa grande',
        'Minha família é muito linda',
        'Todo dia eu vou trabalhar',
        'À noite eu vejo a lua',
        'O sol brilha no céu',
        'Eu aprendo espanhol com música'
      ]
    },
    
    // Intermediate level - Past tense, emotions, relationships
    'intermediate': {
      es: [
        'Ayer caminé por la plaza',
        'Conocí a una persona especial',
        'Hablamos de nuestros sueños',
        'Me sentí muy feliz ese día',
        'Recordé mi infancia querida',
        'Las flores olían a primavera',
        'Cantamos juntos bajo las estrellas',
        'Fue un momento que no olvidaré'
      ],
      en: [
        'Yesterday I walked through the plaza',
        'I met a special person',
        'We talked about our dreams',
        'I felt very happy that day',
        'I remembered my dear childhood',
        'The flowers smelled like spring',
        'We sang together under the stars',
        'It was a moment I will not forget'
      ]
    },
    
    // Advanced level - Subjunctive, complex grammar, poetry
    'advanced': {
      es: [
        'Ojalá que encuentres tu camino',
        'Aunque llueva, seguiré adelante',
        'Si fuera posible volver atrás',
        'Habría hecho las cosas diferentes',
        'Es importante que sepas la verdad',
        'Antes de que se acabe el tiempo',
        'Para que entiendas mi corazón',
        'Como si fuera la última vez'
      ],
      en: [
        'I hope you find your way',
        'Even if it rains, I will continue forward',
        'If it were possible to go back',
        'I would have done things differently',
        'It is important that you know the truth',
        'Before time runs out',
        'So that you understand my heart',
        'As if it were the last time'
      ]
    },
    
    // Cultural content - Traditional phrases and cultural concepts
    'cultural': {
      es: [
        'Mi pueblo tiene tradiciones antiguas',
        'En las fiestas bailamos folclore',
        'La abuela cuenta historias de antes',
        'Preparamos comida típica en familia',
        'Los niños juegan en la calle',
        'La música une a toda la gente',
        'Respetamos a nuestros mayores',
        'El arte vive en cada rincón'
      ],
      en: [
        'My town has ancient traditions',
        'At festivals we dance folklore',
        'Grandmother tells stories from before',
        'We prepare traditional food as a family',
        'Children play in the street',
        'Music unites all people',
        'We respect our elders',
        'Art lives in every corner'
      ]
    }
  }

  async getLyrics(artist: string, title: string): Promise<LyricsResult> {
    // Determine educational level based on song context
    const level = this.determineLevelFromContext(artist, title)
    
    // Get appropriate educational lyrics
    const lyricsData = this.educationalLyrics[level] || this.educationalLyrics['beginner']
    const lines = lyricsData.es
    
    // Prepare translations
    const translations: { [targetLang: string]: string[] } = {}
    
    // Include pre-translated content
    if (lyricsData.en) {
      translations['en'] = lyricsData.en
    }
    if (lyricsData.pt) {
      translations['pt'] = lyricsData.pt
    }
    
    // Add contextual information
    const culturalContext = this.getCulturalContext(level)
    const attribution = this.getAttribution(level)

    return {
      lines,
      licensed: false,
      provider: this.name,
      isExcerpt: true,
      attribution,
      culturalContext,
      translations
    }
  }

  private determineLevelFromContext(artist: string, title: string): string {
    const text = `${artist} ${title}`.toLowerCase()
    
    // Check for complexity indicators
    if (text.includes('advanced') || text.includes('complex') || text.includes('level 5')) {
      return 'advanced'
    }
    
    if (text.includes('cultural') || text.includes('traditional') || text.includes('folk')) {
      return 'cultural'
    }
    
    if (text.includes('intermediate') || text.includes('medium') || text.includes('level 3')) {
      return 'intermediate'
    }
    
    // Default to beginner for educational safety
    return 'beginner'
  }

  private getCulturalContext(level: string): string {
    const contexts = {
      'beginner': 'Educational content focusing on basic Spanish vocabulary, present tense verbs, and everyday situations. Perfect for building foundation skills.',
      'intermediate': 'Intermediate Spanish content exploring past tense, emotions, and personal relationships. Includes more complex sentence structures.',
      'advanced': 'Advanced Spanish featuring subjunctive mood, conditional tenses, and sophisticated grammar patterns common in literature.',
      'cultural': 'Cultural content highlighting traditional Spanish-speaking customs, family values, and community celebrations.'
    }
    
    return contexts[level] || contexts['beginner']
  }

  private getAttribution(level: string): string {
    return `Original educational content created for Spanish language learning - ${level} level. Safe for educational use under fair use guidelines.`
  }
}

class PublicDomainProvider implements LyricsProvider {
  name = 'public-domain'

  private publicDomainSongs: { [key: string]: { lines: string[], context: string, year?: string } } = {
    // Traditional Spanish folk songs and public domain content
    'la_cucaracha': {
      lines: [
        'La cucaracha, la cucaracha',
        'Ya no puede caminar',
        'Porque no tiene, porque le falta',
        'Una patita de atrás'
      ],
      context: 'Traditional Mexican folk song, public domain. A humorous children\'s song that teaches body parts and movement verbs.',
      year: 'Traditional (pre-1900)'
    },
    
    'mañanitas': {
      lines: [
        'Estas son las mañanitas',
        'Que cantaba el Rey David',
        'Hoy por ser día de tu santo',
        'Te las cantamos a ti'
      ],
      context: 'Traditional Mexican birthday song, public domain. Cultural significance for celebrations and family gatherings.',
      year: 'Traditional (pre-1900)'
    },
    
    'educational_counting': {
      lines: [
        'Uno, dos, tres, cuatro, cinco',
        'Seis, siete, ocho, nueve, diez',
        'Los números son importantes',
        'Para aprender en español'
      ],
      context: 'Educational counting song - original content created for language learning.',
      year: '2024 (Educational Content)'
    },
    
    'days_of_week': {
      lines: [
        'Lunes, martes, miércoles',
        'Jueves, viernes y sábado',
        'El domingo es para descansar',
        'Y la semana terminar'
      ],
      context: 'Educational song teaching days of the week - original content for Spanish learning.',
      year: '2024 (Educational Content)'
    }
  }

  async getLyrics(artist: string, title: string): Promise<LyricsResult> {
    // Try to match known public domain songs
    const songKey = this.findSongKey(artist, title)
    const songData = this.publicDomainSongs[songKey]
    
    if (songData) {
      return {
        lines: songData.lines,
        licensed: true, // Public domain = no restrictions
        provider: this.name,
        isExcerpt: false, // Full song available
        attribution: `Public domain content. ${songData.year ? `Original: ${songData.year}` : 'Traditional folk song'}`,
        culturalContext: songData.context
      }
    }

    // Fallback to educational content
    return {
      lines: [
        'Esta canción no está disponible',
        'Pero puedes usar contenido educativo',
        'Para aprender español de forma segura',
        'Sin problemas de derechos de autor'
      ],
      licensed: false,
      provider: this.name,
      isExcerpt: true,
      attribution: 'Educational placeholder content - safe for learning purposes',
      culturalContext: 'Reminder about copyright-safe educational content for Spanish learning.'
    }
  }

  private findSongKey(artist: string, title: string): string {
    const searchText = `${artist} ${title}`.toLowerCase()
    
    // Look for key phrases that match our public domain content
    if (searchText.includes('cucaracha')) return 'la_cucaracha'
    if (searchText.includes('mañanitas') || searchText.includes('birthday')) return 'mañanitas'
    if (searchText.includes('counting') || searchText.includes('números')) return 'educational_counting'
    if (searchText.includes('days') || searchText.includes('días') || searchText.includes('week')) return 'days_of_week'
    
    return 'not_found'
  }
}

class MusixmatchProvider implements LyricsProvider {
  name = 'musixmatch'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getLyrics(artist: string, title: string): Promise<LyricsResult> {
    try {
      // First search for the track
      const searchResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/track.search?` +
        `format=json&callback=callback&q_track=${encodeURIComponent(title)}&` +
        `q_artist=${encodeURIComponent(artist)}&apikey=${this.apiKey}`
      )

      if (!searchResponse.ok) {
        throw new Error(`Musixmatch search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const track = searchData.message?.body?.track_list?.[0]?.track

      if (!track) {
        return {
          lines: [],
          licensed: false,
          provider: this.name,
          error: 'Track not found'
        }
      }

      // Get lyrics for the track
      const lyricsResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/track.lyrics.get?` +
        `format=json&callback=callback&track_id=${track.track_id}&apikey=${this.apiKey}`
      )

      if (!lyricsResponse.ok) {
        throw new Error(`Musixmatch lyrics failed: ${lyricsResponse.status}`)
      }

      const lyricsData = await lyricsResponse.json()
      const lyrics = lyricsData.message?.body?.lyrics?.lyrics_body

      if (!lyrics) {
        return {
          lines: [],
          licensed: false,
          provider: this.name,
          error: 'Lyrics not available'
        }
      }

      // Split lyrics into lines and clean up
      const allLines = lyrics
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.includes('******* This Lyrics'))

      // For educational use, extract excerpt only (first 5 meaningful lines)
      const maxExcerptLines = parseInt(process.env.MAX_EXCERPT_LINES || '5')
      const excerptLines = selectEducationalExcerpt(allLines, maxExcerptLines)

      return {
        raw: process.env.FAIR_USE_MODE === 'true' ? undefined : lyrics,
        lines: excerptLines,
        licensed: true,
        provider: this.name,
        isExcerpt: process.env.FAIR_USE_MODE === 'true',
        attribution: `Lyrics © ${track.artist_name}. Provided by Musixmatch for educational purposes.`,
        culturalContext: track.album_name ? `From album: ${track.album_name}` : undefined
      }
    } catch (error) {
      console.error('Musixmatch error:', error)
      return {
        lines: [],
        licensed: false,
        provider: this.name,
        isExcerpt: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

class GeniusProvider implements LyricsProvider {
  name = 'genius'
  private geniusClient: any

  constructor() {
    // Import the Genius client dynamically to avoid circular dependencies
    const { GeniusClient } = require('./genius')
    this.geniusClient = new GeniusClient()
  }

  async getLyrics(artist: string, title: string): Promise<LyricsResult> {
    try {
      // Use the new Genius client to find song info
      const lyricsInfo = await this.geniusClient.getLyricsInfo(artist, title)

      if (!lyricsInfo.found) {
        return {
          lines: [],
          licensed: false,
          provider: this.name,
          isExcerpt: true,
          error: lyricsInfo.error || 'Song not found on Genius'
        }
      }

      // Since Genius doesn't provide lyrics directly via API, we return metadata
      // and a message about the availability
      const contextInfo = [
        `🎵 Found on Genius: ${lyricsInfo.geniusUrl}`,
        `📅 Release: ${lyricsInfo.releaseDate || 'Unknown'}`,
        lyricsInfo.album ? `💿 Album: ${lyricsInfo.album}` : null,
        `⚠️ Full lyrics available on Genius website`
      ].filter(Boolean)

      return {
        lines: contextInfo,
        licensed: false,
        provider: this.name,
        isExcerpt: true,
        attribution: `Song information from Genius. Full lyrics at: ${lyricsInfo.geniusUrl}`,
        culturalContext: `This song was found in the Genius database with detailed metadata.`,
        error: 'Genius provides song metadata but not direct lyrics access via API'
      }
    } catch (error) {
      console.error('Genius error:', error)
      return {
        lines: [],
        licensed: false,
        provider: this.name,
        isExcerpt: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Educational excerpt selection algorithm
function selectEducationalExcerpt(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) {
    return lines
  }

  // Score lines based on educational value
  const scoredLines = lines.map((line, index) => {
    let score = 0
    
    // Prefer lines with moderate length (not too short, not too long)
    const wordCount = line.split(/\s+/).length
    if (wordCount >= 3 && wordCount <= 12) score += 2
    
    // Prefer lines with Spanish characteristics
    if (/[ñáéíóúü¿¡]/.test(line)) score += 3
    
    // Prefer lines with common Spanish words
    const commonSpanishWords = /\b(es|no|en|de|la|el|y|a|que|un|por|con|se|su|para|como|estar|tener|ser|todo|desde)\b/gi
    const matches = line.match(commonSpanishWords) || []
    score += matches.length
    
    // Avoid repetitive chorus-like lines (favor verses)
    const repetitionPenalty = lines.filter(l => l === line).length - 1
    score -= repetitionPenalty * 2
    
    // Prefer lines that aren't pure nonsense/vocalizations
    if (/^(la\s*){3,}|^(na\s*){3,}|^(oh\s*){3,}|^(ah\s*){3,}/i.test(line)) score -= 5
    
    return { line, score, index }
  })
  
  // Sort by score (descending) and return top lines maintaining original order
  const selectedScored = scoredLines
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLines)
    .sort((a, b) => a.index - b.index)
  
  return selectedScored.map(item => item.line)
}

const providers = new Map<string, LyricsProvider>()

// Register providers
providers.set('demo', new DemoLyricsProvider())
providers.set('public-domain', new PublicDomainProvider())

// Initialize Musixmatch if API key is available
if (process.env.MUSIXMATCH_API_KEY && process.env.MUSIXMATCH_API_KEY !== 'your_musixmatch_key_here') {
  providers.set('musixmatch', new MusixmatchProvider(process.env.MUSIXMATCH_API_KEY))
}

// Initialize Genius if credentials are available
if (process.env.GENIUS_CLIENT_ID && process.env.GENIUS_CLIENT_SECRET) {
  providers.set('genius', new GeniusProvider())
}

export async function getLyricsByTrack(artist: string, title: string): Promise<LyricsResult> {
  const providerName = process.env.LYRICS_PROVIDER || 'smart'
  
  // Smart provider tries multiple sources in order
  if (providerName === 'smart') {
    return await smartLyricsProvider(artist, title)
  }
  
  const provider = providers.get(providerName)

  if (!provider) {
    console.warn(`Lyrics provider '${providerName}' not found, falling back to smart provider`)
    return await smartLyricsProvider(artist, title)
  }

  try {
    const result = await provider.getLyrics(artist, title)
    
    // If the primary provider fails, fall back to smart provider
    if (result.error && providerName !== 'demo') {
      console.warn(`Provider '${providerName}' failed: ${result.error}, falling back to smart provider`)
      return await smartLyricsProvider(artist, title)
    }
    
    return result
  } catch (error) {
    console.error(`Provider '${providerName}' error:`, error)
    
    // Fall back to smart provider
    if (providerName !== 'demo') {
      return await smartLyricsProvider(artist, title)
    }
    
    return {
      lines: [],
      licensed: false,
      provider: providerName,
      isExcerpt: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function smartLyricsProvider(artist: string, title: string): Promise<LyricsResult> {
  // Order of preference for finding lyrics
  const providerOrder = [
    'musixmatch',     // Commercial licensed lyrics (when available)
    'public-domain',  // Public domain and traditional songs
    'genius',         // Metadata and cultural context
    'demo'           // Educational content fallback
  ]
  
  for (const providerName of providerOrder) {
    const provider = providers.get(providerName)
    if (!provider) continue
    
    try {
      const result = await provider.getLyrics(artist, title)
      
      // If we get a good result (licensed or public domain), use it
      if (result.licensed || (result.lines.length > 0 && !result.error)) {
        console.log(`✅ Found lyrics using ${providerName} provider`)
        return result
      }
      
      // If this provider found metadata but no lyrics, continue to next
      if (result.error) {
        console.log(`⚠️ ${providerName} provider: ${result.error}`)
        continue
      }
      
    } catch (error) {
      console.warn(`❌ ${providerName} provider failed:`, error)
      continue
    }
  }
  
  // Final fallback to demo educational content
  console.log(`📚 Using educational demo content for learning`)
  return providers.get('demo')!.getLyrics(artist, title)
}

export function getAvailableProviders(): string[] {
  return Array.from(providers.keys())
}

export function isProviderConfigured(providerName: string): boolean {
  return providers.has(providerName)
}