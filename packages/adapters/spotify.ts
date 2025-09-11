export interface SpotifySong {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; release_date: string }
  external_urls: { spotify: string }
  preview_url: string | null
}

export interface AppSong {
  title: string
  artist: string
  album?: string
  year?: number
  spotifyId: string
  spotifyUrl: string
  language: string
}

interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifySong[]
  }
}

interface SpotifyPlaylistResponse {
  tracks: {
    items: { track: SpotifySong }[]
  }
}

let accessToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured. Running in demo mode.')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status}`)
  }

  const data: SpotifyTokenResponse = await response.json()
  accessToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // 1 minute buffer

  return accessToken
}

async function spotifyRequest(endpoint: string): Promise<any> {
  const token = await getAccessToken()
  
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`Spotify API request failed: ${response.status}`)
  }

  return response.json()
}

export async function searchTopSpanishSongs(limit: number = 50): Promise<SpotifySong[]> {
  try {
    // Expanded search queries for better coverage
    const queries = [
      // Genre-based searches across different Spanish-speaking markets
      'genre:latin market:ES',
      'genre:reggaeton market:MX', 
      'genre:latin-pop market:AR',
      'genre:latin-rock market:ES',
      'genre:salsa market:CO',
      'genre:bachata market:DO',
      'genre:merengue market:DO',
      'genre:cumbia market:CO',
      'genre:flamenco market:ES',
      'genre:ranchera market:MX',
      
      // Popular Spanish songs by year
      'año:2024 market:ES',
      'año:2023 market:ES',
      'año:2022 market:MX',
      'año:2021 market:AR',
      
      // Language and popularity searches
      'español popular',
      'spanish hits',
      'latin music',
      'musica latina',
      
      // Artist-based searches for major Spanish/Latin artists
      'artist:Bad Bunny',
      'artist:Rosalía',
      'artist:J Balvin',
      'artist:Karol G',
      'artist:Maluma',
      'artist:Ozuna',
      'artist:Daddy Yankee',
      'artist:Luis Fonsi',
      'artist:Shakira',
      'artist:Manu Chao',
      'artist:Jesse & Joy',
      'artist:Mana',
      'artist:Juanes',
      'artist:Alejandro Sanz'
    ]

    const allSongs: SpotifySong[] = []
    const songsPerQuery = Math.max(1, Math.ceil(limit * 1.5 / queries.length)) // Get 50% more to account for filtering
    
    console.log(`🎵 Searching ${queries.length} different sources for Spanish songs...`)
    
    for (const [index, query] of queries.entries()) {
      try {
        console.log(`📡 Query ${index + 1}/${queries.length}: ${query}`)
        const data: SpotifySearchResponse = await spotifyRequest(
          `/search?q=${encodeURIComponent(query)}&type=track&limit=${songsPerQuery}&market=ES`
        )
        
        const validTracks = data.tracks.items.filter(song => 
          song && song.id && song.name && song.artists && song.artists.length > 0
        )
        
        allSongs.push(...validTracks)
        console.log(`   ✅ Found ${validTracks.length} valid tracks`)
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.warn(`   ❌ Failed query "${query}":`, error instanceof Error ? error.message : error)
      }
    }

    console.log(`\n🔍 Processing ${allSongs.length} total tracks...`)

    // Remove duplicates and filter Spanish songs
    const uniqueSongs = Array.from(new Map(allSongs.map(song => [song.id, song])).values())
    console.log(`📊 Unique tracks after deduplication: ${uniqueSongs.length}`)
    
    const spanishSongs = uniqueSongs.filter(song => 
      isLikelySpanish(song.name, song.artists[0].name)
    )
    console.log(`🇪🇸 Spanish songs after filtering: ${spanishSongs.length}`)

    // Sort by popularity (if available) and return requested amount
    const sortedSongs = spanishSongs.sort((a, b) => {
      // Prefer songs with preview URLs (more likely to be popular/available)
      const aHasPreview = a.preview_url ? 1 : 0
      const bHasPreview = b.preview_url ? 1 : 0
      return bHasPreview - aHasPreview
    })

    const result = sortedSongs.slice(0, limit)
    console.log(`✅ Returning ${result.length} top Spanish songs`)
    
    return result
  } catch (error) {
    console.error('Failed to fetch Spanish songs from Spotify:', error)
    return []
  }
}

export async function getSpanishPlaylistSongs(playlistId: string, limit: number = 50): Promise<SpotifySong[]> {
  try {
    const data: SpotifyPlaylistResponse = await spotifyRequest(`/playlists/${playlistId}/tracks?limit=${limit}&market=ES`)
    return data.tracks.items.map(item => item.track).filter(Boolean)
  } catch (error) {
    console.error(`Failed to fetch playlist ${playlistId}:`, error)
    return []
  }
}

export function toAppSong(spotifySong: SpotifySong): AppSong {
  return {
    title: spotifySong.name,
    artist: spotifySong.artists[0].name,
    album: spotifySong.album.name,
    year: spotifySong.album.release_date ? parseInt(spotifySong.album.release_date.split('-')[0]) : undefined,
    spotifyId: spotifySong.id,
    spotifyUrl: spotifySong.external_urls.spotify,
    language: 'es'
  }
}

function isLikelySpanish(title: string, artist: string): boolean {
  // Enhanced heuristics to identify Spanish songs
  const spanishIndicators = [
    // Common Spanish words - expanded set
    /\b(amor|corazón|vida|tiempo|sueño|noche|día|sol|luna|mar|fuego|agua|casa|mundo|mujer|hombre|niño|grande|pequeño)\b/i,
    /\b(baila|bailar|canta|cantar|música|fiesta|alegría|tristeza|dolor|feliz|triste|loco|loca)\b/i,
    /\b(hermano|hermana|madre|padre|hijo|hija|familia|amigo|amiga|novio|novia)\b/i,
    /\b(beso|besos|abrazo|mano|ojos|cara|pelo|piel|sangre|alma|espíritu)\b/i,
    /\b(ciudad|pueblo|país|tierra|cielo|aire|viento|lluvia|río|montaña)\b/i,
    /\b(trabajo|escuela|iglesia|hospital|hotel|restaurante|parque|playa|mar)\b/i,
    
    // Spanish articles and prepositions - expanded
    /\b(el|la|los|las|un|una|unos|unas|de|del|al|en|con|por|para|sin|sobre|entre|desde|hasta)\b/i,
    
    // Spanish verb forms - much expanded
    /\b(soy|eres|es|somos|son|estoy|estás|está|estamos|están|tengo|tienes|tiene|tenemos|tienen)\b/i,
    /\b(voy|vas|va|vamos|van|hago|haces|hace|hacemos|hacen|quiero|quieres|quiere|queremos|quieren)\b/i,
    /\b(puedo|puedes|puede|podemos|pueden|debo|debes|debe|debemos|deben|sé|sabes|sabe|sabemos|saben)\b/i,
    /\b(digo|dices|dice|decimos|dicen|veo|ves|ve|vemos|ven|doy|das|da|damos|dan)\b/i,
    
    // Common Spanish phrases and expressions
    /\b(te amo|mi amor|por favor|muy bien|cómo está|buenas noches|hasta luego|de nada|por qué)\b/i,
    /\b(qué tal|cómo estás|mucho gusto|hasta mañana|buena suerte|feliz cumpleaños|gracias|perdón)\b/i,
    /\b(no sé|no entiendo|lo siento|está bien|muy bueno|qué pasa|vamos a|me gusta)\b/i,
    
    // Spanish specific characters and patterns
    /[ñáéíóúü]/i,
    /¿|¡/,
    
    // Spanish music/dance terms
    /\b(reggaeton|salsa|bachata|merengue|cumbia|flamenco|tango|ranchera|mariachi|corrido)\b/i,
    /\b(ritmo|melodía|guitarra|piano|tambor|trompeta|violín|acordeón)\b/i
  ]

  // Expanded list of Spanish/Latin artists
  const spanishArtists = [
    // Reggaeton/Urban Latino
    'bad bunny', 'j balvin', 'maluma', 'karol g', 'ozuna', 'daddy yankee', 'nicky jam',
    'anuel aa', 'farruko', 'arcángel', 'de la ghetto', 'wisin', 'yandel', 'don omar',
    'plan b', 'zion', 'lennox', 'tito el bambino', 'jowell', 'randy', 'alexis', 'fido',
    
    // Latin Pop/Rock
    'shakira', 'luis fonsi', 'enrique iglesias', 'ricky martin', 'marc anthony',
    'alejandro sanz', 'juanes', 'manu chao', 'jesse & joy', 'maná', 'jarabe de palo',
    'heroes del silencio', 'soda stereo', 'gustavo cerati', 'charly garcía', 'andrés calamaro',
    
    // Spanish Pop/Rock
    'rosalía', 'álvaro soler', 'pablo alborán', 'david bisbal', 'marta sánchez', 'la quinta estación',
    'david summers', 'hombres g', 'mecano', 'la oreja de van gogh', 'amaral', 'presuntos implicados',
    
    // Regional Mexican
    'vicente fernández', 'pedro fernández', 'alejandro fernández', 'pepe aguilar',
    'ana gabriel', 'juan gabriel', 'josé josé', 'luis miguel', 'rocío dúrcal',
    'mariachi vargas', 'mariachi sol de méxico', 'banda el recodo', 'banda ms',
    
    // Salsa/Tropical
    'salsa giants', 'marc anthony', 'victor manuelle', 'gilberto santa rosa', 'la india',
    'celia cruz', 'héctor lavoe', 'willie colón', 'rubén blades', 'oscar de león',
    'el gran combo', 'sonora ponceña', 'grupo niche', 'joe arroyo',
    
    // Bachata/Merengue
    'romeo santos', 'aventura', 'prince royce', 'toby love', 'frank reyes',
    'zacarias ferreira', 'elvis martinez', 'juan luis guerra', 'johnny ventura',
    'milly quezada', 'sergio vargas', 'fernando villalona',
    
    // Flamenco/Spanish Traditional
    'paco de lucía', 'camarón de la isla', 'josé mercé', 'estrella morente',
    'diego el cigala', 'niña pastori', 'alejandro sanz', 'ketama', 'jesse & joy',
    
    // Argentine Rock/Pop
    'soda stereo', 'gustavo cerati', 'charly garcía', 'fito páez', 'andrés calamaro',
    'bersuit vergarabat', 'los fabulosos cadillacs', 'vicentico', 'babasónicos',
    
    // Other Spanish/Latin Artists
    'manu chao', 'devendra banhart', 'natalia lafourcade', 'bomba estéreo',
    'cultura profética', 'café tacvba', 'los tigres del norte', 'intocable'
  ]

  const titleLower = title.toLowerCase()
  const artistLower = artist.toLowerCase()

  // Check title for Spanish indicators - weighted scoring
  let spanishScore = 0
  
  // Title analysis
  const titleHasSpanish = spanishIndicators.some(pattern => pattern.test(titleLower))
  if (titleHasSpanish) spanishScore += 2
  
  // Special characters bonus
  if (/[ñáéíóúü¿¡]/.test(title)) spanishScore += 3
  
  // Check if artist is known Spanish/Latin artist
  const artistIsSpanish = spanishArtists.some(spanishArtist => {
    const artistWords = spanishArtist.split(' ')
    return artistWords.every(word => artistLower.includes(word.toLowerCase())) ||
           artistLower.includes(spanishArtist.toLowerCase()) ||
           spanishArtist.toLowerCase().includes(artistLower)
  })
  
  if (artistIsSpanish) spanishScore += 4

  // Additional checks for featuring artists
  if (/(ft\.|feat\.|featuring)/i.test(artistLower)) {
    const allArtists = artistLower.split(/ft\.|feat\.|featuring|,|&|\+/i)
    const hasSpanishFeature = allArtists.some(art => 
      spanishArtists.some(sa => art.trim().includes(sa) || sa.includes(art.trim()))
    )
    if (hasSpanishFeature) spanishScore += 2
  }

  // Country/market indicators in metadata would be ideal but not available in this context
  
  return spanishScore >= 2 // Require at least moderate confidence
}

export async function searchSpotifyTracks(query: string, limit: number = 50): Promise<SpotifySong[]> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const data: SpotifySearchResponse = await spotifyRequest(`/search?q=${encodedQuery}&type=track&limit=${limit}&market=ES`)
    return data.tracks.items.filter(Boolean)
  } catch (error) {
    console.error(`Failed to search Spotify for "${query}":`, error)
    return []
  }
}

// Popular Spanish playlist IDs for discovery
export const SPANISH_PLAYLIST_IDS = {
  'top-50-spain': '37i9dQZEVXbNFJfN1Vw8d9',
  'viva-latino': '37i9dQZF1DX10zKzsJ2jva',
  'latin-hits': '37i9dQZF1DX0XUsuxWHRQd',
  'spanish-indie': '37i9dQZF1DWVzXfNUU0HLa',
  'latin-pop': '37i9dQZF1DX13ZzXoot6Jc'
}