export interface LyricsWord {
  text: string
  startTime: number
  endTime: number
  isWhitespace?: boolean
}

export interface LyricsLine {
  text: string
  words?: LyricsWord[]
  startTime: number
  endTime: number
}

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
  // New synchronized lyrics data
  synchronized?: {
    lines: LyricsLine[]
    hasWordTiming: boolean
    format: 'lrc' | 'estimated' | 'dfxp'
    duration?: number
  }
}

export interface LyricsProvider {
  name: string
  getLyrics(artist: string, title: string): Promise<LyricsResult>
}

// LRC parser for synchronized lyrics
function parseLRC(lrcContent: string): { lines: LyricsLine[], duration: number, hasRealWordTiming: boolean } {
  const lines: LyricsLine[] = []
  let maxTime = 0
  let hasRealWordTiming = false

  // Split content into lines and process each line
  const lrcLines = lrcContent.split('\n')

  for (const line of lrcLines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Match LRC time format [mm:ss.xx] or [mm:ss:xx]
    const timeRegex = /\[(\d+):(\d+)\.?(\d+)?\]/g
    let match
    const timeTags: number[] = []
    let textContent = trimmedLine

    // Extract all time tags from the line
    while ((match = timeRegex.exec(trimmedLine)) !== null) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const centiseconds = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2), 10) : 0
      const timeMs = (minutes * 60 + seconds) * 1000 + centiseconds * 10
      timeTags.push(timeMs)
    }

    // Remove time tags to get just the text
    textContent = textContent.replace(/\[\d+:\d+\.?\d*\]/g, '').trim()

    // Skip lines without text content or time tags
    if (timeTags.length === 0 || !textContent) continue

    // For each time tag, create a line entry
    for (let i = 0; i < timeTags.length; i++) {
      const startTime = timeTags[i]
      const endTime = i < timeTags.length - 1 ? timeTags[i + 1] : startTime + 3000 // Default 3 second duration

      maxTime = Math.max(maxTime, endTime)

      // Create words array for compatibility with SynchronizedLyrics component
      // Since LRC only provides line-level timing, all words share the line timing
      const lineWords = textContent.split(/(\s+)/).filter(part => part.length > 0)
      const words: Word[] = lineWords.map((wordText): Word => ({
        text: wordText,
        startTime,  // All words share the line's exact start time
        endTime,    // All words share the line's exact end time
        isWhitespace: !wordText.trim()
      }))

      lines.push({
        text: textContent,
        words,  // Include words array for component compatibility
        startTime,
        endTime
      })
    }
  }

  // Sort lines by start time
  lines.sort((a, b) => a.startTime - b.startTime)

  // Calculate end times based on next line start time
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].endTime > lines[i + 1].startTime) {
      lines[i].endTime = lines[i + 1].startTime - 50 // Small gap between lines
    }
  }

  return { lines, duration: maxTime, hasRealWordTiming }
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
    // Log API key info for debugging (masked for security)
    console.log(`🔑 Musixmatch initialized with API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`)
  }

  async getLyrics(artist: string, title: string): Promise<LyricsResult> {
    try {
      console.log(`🎵 Musixmatch: Searching for "${title}" by ${artist}`)

      // First search for the track
      const searchUrl = `https://api.musixmatch.com/ws/1.1/track.search?` +
        `format=json&q_track=${encodeURIComponent(title)}&` +
        `q_artist=${encodeURIComponent(artist)}&apikey=${this.apiKey}`

      const searchResponse = await fetch(searchUrl)

      if (!searchResponse.ok) {
        console.error(`❌ Musixmatch search failed with status: ${searchResponse.status}`)
        throw new Error(`Musixmatch search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const track = searchData.message?.body?.track_list?.[0]?.track

      if (!track) {
        console.log(`❌ Musixmatch: Track not found for "${title}" by ${artist}`)
        return {
          lines: [],
          licensed: false,
          provider: this.name,
          isExcerpt: true,
          error: 'Track not found'
        }
      }

      console.log(`✅ Musixmatch: Found track ID ${track.track_id} - "${track.track_name}" by ${track.artist_name}`)
      console.log(`   Has lyrics: ${track.has_lyrics === 1 ? 'Yes' : 'No'}, Has subtitles: ${track.has_subtitles === 1 ? 'Yes' : 'No'}`)

      // Try to get synchronized lyrics - try multiple formats
      let synchronizedData: { lines: LyricsLine[], hasWordTiming: boolean, format: 'lrc' | 'estimated' | 'dfxp', duration?: number } | undefined

      // Try different subtitle formats in order of preference
      const subtitleFormats = ['lrc', 'dfxp', 'mxm']

      for (const format of subtitleFormats) {
        try {
          const subtitleResponse = await fetch(
            `https://api.musixmatch.com/ws/1.1/track.subtitle.get?` +
            `format=json&track_id=${track.track_id}&` +
            `subtitle_format=${format}&apikey=${this.apiKey}`
          )

          if (subtitleResponse.ok) {
            const subtitleData = await subtitleResponse.json()
            const subtitleBody = subtitleData.message?.body?.subtitle?.subtitle_body

            if (subtitleBody) {
              console.log(`✅ Found synchronized lyrics from Musixmatch in ${format} format`)

              if (format === 'lrc') {
                const { lines: syncLines, duration, hasRealWordTiming } = parseLRC(subtitleBody)
                synchronizedData = {
                  lines: syncLines,
                  hasWordTiming: hasRealWordTiming,
                  format: 'lrc',
                  duration
                }
                break // LRC is good enough, stop here
              } else if (format === 'dfxp' || format === 'mxm') {
                // These formats might have word-level timing
                // For now, we'll parse them as text and note that enhanced timing may be available
                console.log(`⚠️ Found ${format} format but parser not yet implemented`)
                // TODO: Implement DFXP/MXM parser for potential word-level timing
              }
            }
          }
        } catch (error) {
          console.log(`Failed to fetch ${format} format:`, error)
        }
      }

      // Fallback to regular lyrics if no synchronized lyrics available
      const lyricsResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/track.lyrics.get?` +
        `format=json&track_id=${track.track_id}&apikey=${this.apiKey}`
      )

      if (!lyricsResponse.ok) {
        throw new Error(`Musixmatch lyrics failed: ${lyricsResponse.status}`)
      }

      const lyricsData = await lyricsResponse.json()
      const lyrics = lyricsData.message?.body?.lyrics?.lyrics_body

      // Debug: Check what we're getting from Musixmatch
      if (lyrics) {
        const lineCount = lyrics.split('\n').filter(l => l.trim()).length
        console.log(`📝 Musixmatch returned ${lineCount} lines for "${title}" by ${artist}`)
        if (lyrics.includes('******* This Lyrics is NOT for Commercial use')) {
          console.log('⚠️ API returned restricted lyrics (30% excerpt)')
        }
      }

      if (!lyrics && !synchronizedData) {
        return {
          lines: [],
          licensed: false,
          provider: this.name,
          isExcerpt: true,
          error: 'Lyrics not available'
        }
      }

      // Process regular lyrics
      let processedLines: string[] = []
      if (lyrics) {
        // Split lyrics into lines and clean up
        const allLines = lyrics
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.includes('******* This Lyrics'))

        // Check if we should use full lyrics (paid account) or excerpt
        const useFull = process.env.MUSIXMATCH_FULL_LYRICS === 'true'

        if (useFull) {
          console.log(`📚 Using FULL lyrics (${allLines.length} lines)`)
          processedLines = allLines
        } else {
          // For educational use, extract excerpt only (first 5 meaningful lines)
          const maxExcerptLines = parseInt(process.env.MAX_EXCERPT_LINES || '5')
          console.log(`📄 Using excerpt only (${maxExcerptLines} lines from ${allLines.length} total)`)
          processedLines = selectEducationalExcerpt(allLines, maxExcerptLines)
        }
      } else if (synchronizedData) {
        // Use synchronized lyrics as fallback text
        processedLines = synchronizedData.lines.map(line => line.text)
      }

      return {
        raw: process.env.FAIR_USE_MODE === 'true' ? undefined : lyrics,
        lines: processedLines,
        licensed: true,
        provider: this.name,
        isExcerpt: process.env.FAIR_USE_MODE === 'true',
        attribution: `Lyrics © ${track.artist_name}. Provided by Musixmatch for educational purposes.${synchronizedData ? ' Includes synchronized timing data.' : ''}`,
        culturalContext: track.album_name ? `From album: ${track.album_name}` : undefined,
        synchronized: synchronizedData
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
let providersInitialized = false

// Lazy initialization of providers
function initializeProviders() {
  if (providersInitialized) return
  
  console.log('🔧 Initializing lyrics providers...')
  
  // Register basic providers
  providers.set('demo', new DemoLyricsProvider())
  providers.set('public-domain', new PublicDomainProvider())

  // Initialize Musixmatch if API key is available
  if (process.env.MUSIXMATCH_API_KEY && process.env.MUSIXMATCH_API_KEY !== 'your_musixmatch_key_here') {
    console.log('✅ Registering Musixmatch provider')
    providers.set('musixmatch', new MusixmatchProvider(process.env.MUSIXMATCH_API_KEY))
  } else {
    console.log('❌ Musixmatch API key not found - provider not registered')
    console.log('   MUSIXMATCH_API_KEY:', process.env.MUSIXMATCH_API_KEY ? 'Present' : 'Missing')
  }

  // Initialize Genius if credentials are available
  if (process.env.GENIUS_CLIENT_ID && process.env.GENIUS_CLIENT_SECRET) {
    console.log('✅ Registering Genius provider')
    providers.set('genius', new GeniusProvider())
  } else {
    console.log('❌ Genius credentials not found - provider not registered')
  }
  
  console.log(`🎵 Total providers registered: ${providers.size}`)
  providersInitialized = true
}

export async function getLyricsByTrack(artist: string, title: string): Promise<LyricsResult> {
  // Ensure providers are initialized
  initializeProviders()
  
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
  initializeProviders()
  return Array.from(providers.keys())
}

export function isProviderConfigured(providerName: string): boolean {
  initializeProviders()
  return providers.has(providerName)
}