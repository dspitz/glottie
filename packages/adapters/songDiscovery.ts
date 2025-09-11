import { SpotifySong, toAppSong } from './spotify'

export interface SongSource {
  name: string
  getTopSongs(limit?: number): Promise<SpotifySong[]>
  isConfigured(): boolean
}

// Last.fm implementation
export class LastFmSource implements SongSource {
  name = 'lastfm'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  async getTopSongs(limit: number = 50): Promise<SpotifySong[]> {
    try {
      const countries = ['spain', 'mexico', 'argentina', 'colombia']
      const allTracks: any[] = []

      for (const country of countries) {
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country=${country}&api_key=${this.apiKey}&format=json&limit=${Math.ceil(limit / countries.length)}`
        )
        
        if (response.ok) {
          const data = await response.json()
          allTracks.push(...(data.tracks?.track || []))
        }
      }

      // Convert to our format
      return allTracks.slice(0, limit).map(track => ({
        id: `lastfm_${track.mbid || track.name.replace(/\s+/g, '_')}`,
        name: track.name,
        artists: [{ name: track.artist.name }],
        album: { name: track.artist.name, release_date: new Date().getFullYear().toString() },
        external_urls: { spotify: `https://open.spotify.com/search/${encodeURIComponent(track.name + ' ' + track.artist.name)}` },
        preview_url: null
      }))
    } catch (error) {
      console.error('Last.fm error:', error)
      return []
    }
  }
}

// Curated lists from various sources
export class CuratedListsSource implements SongSource {
  name = 'curated'

  isConfigured(): boolean {
    return true // Always available
  }

  async getTopSongs(limit: number = 50): Promise<SpotifySong[]> {
    // Curated list of popular Spanish songs across different eras and regions
    const curatedSongs = [
      // Classic Spanish/Latin hits
      { title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', year: 2017 },
      { title: 'Macarena', artist: 'Los Del Rio', year: 1996 },
      { title: 'La Vida Es Una Fiesta', artist: 'Manu Chao', year: 2001 },
      { title: 'Bamboléo', artist: 'Gipsy Kings', year: 1987 },
      { title: 'Oye Como Va', artist: 'Tito Puente', year: 1963 },
      
      // Modern Latin Pop
      { title: 'Un Día (One Day)', artist: 'J Balvin, Dua Lipa', year: 2020 },
      { title: 'Con Altura', artist: 'Rosalía, J Balvin', year: 2019 },
      { title: 'Tusa', artist: 'Karol G, Nicki Minaj', year: 2019 },
      { title: 'La Canción', artist: 'J Balvin, Bad Bunny', year: 2019 },
      { title: 'Calma', artist: 'Pedro Capó, Farruko', year: 2018 },
      
      // Spanish Pop/Rock
      { title: 'Corazón Partío', artist: 'Alejandro Sanz', year: 1997 },
      { title: 'La Camisa Negra', artist: 'Juanes', year: 2004 },
      { title: 'Me Gustas Tu', artist: 'Manu Chao', year: 2001 },
      { title: 'Color Esperanza', artist: 'Diego Torres', year: 2001 },
      { title: 'La Incondicional', artist: 'Luis Miguel', year: 1989 },
      
      // Regional Mexican
      { title: 'Cielito Lindo', artist: 'Mariachi', year: 1919 },
      { title: 'La Llorona', artist: 'Chavela Vargas', year: 1994 },
      { title: 'Cucurrucucú Paloma', artist: 'Lola Beltrán', year: 1961 },
      { title: 'El Rey', artist: 'José Alfredo Jiménez', year: 1971 },
      { title: 'México Lindo y Querido', artist: 'Jorge Negrete', year: 1942 },
      
      // Contemporary Spanish
      { title: 'Malamente', artist: 'Rosalía', year: 2018 },
      { title: 'Pienso en tu Mirá', artist: 'Rosalía', year: 2018 },
      { title: 'Me Rehúso', artist: 'Danny Ocean', year: 2016 },
      { title: 'Robarte un Beso', artist: 'Carlos Vives, Sebastián Yatra', year: 2017 },
      { title: 'Criminal', artist: 'Natti Natasha, Ozuna', year: 2017 },
      
      // Argentine Tango/Rock
      { title: 'La Cumparsita', artist: 'Carlos Gardel', year: 1924 },
      { title: 'Por Una Cabeza', artist: 'Carlos Gardel', year: 1935 },
      { title: 'De Música Ligera', artist: 'Soda Stereo', year: 1990 },
      { title: 'Persiana Americana', artist: 'Soda Stereo', year: 1986 },
      { title: 'Flaca', artist: 'Andrés Calamaro', year: 1997 },
      
      // More modern hits
      { title: 'Hawái', artist: 'Maluma', year: 2020 },
      { title: 'Baila Baila Baila', artist: 'Ozuna', year: 2019 },
      { title: 'China', artist: 'Anuel AA, Daddy Yankee, Karol G', year: 2019 },
      { title: 'Qué Tire Pa Lante', artist: 'Daddy Yankee', year: 2019 },
      { title: 'Adicto', artist: 'Tainy, Anuel AA, Ozuna', year: 2019 },
      
      // Spanish Rock/Indie
      { title: 'Héroes del Silencio', artist: 'Entre Dos Tierras', year: 1990 },
      { title: 'Maldito Duende', artist: 'Héroes del Silencio', year: 1991 },
      { title: 'Devuélveme a Mi Chica', artist: 'Hombres G', year: 1985 },
      { title: 'La Flaca', artist: 'Jarabe de Palo', year: 1996 },
      { title: 'Rayando el Sol', artist: 'Maná', year: 1990 }
    ]

    // Convert to our song format
    return curatedSongs.slice(0, limit).map((song, index) => ({
      id: `curated_${index + 1}`,
      name: song.title,
      artists: [{ name: song.artist }],
      album: { name: `Best of ${song.artist}`, release_date: song.year.toString() },
      external_urls: { 
        spotify: `https://open.spotify.com/search/${encodeURIComponent(song.title + ' ' + song.artist)}`
      },
      preview_url: null
    }))
  }
}

// Billboard charts
export class BillboardSource implements SongSource {
  name = 'billboard'

  isConfigured(): boolean {
    return true // Web scraping, no API key needed
  }

  async getTopSongs(limit: number = 50): Promise<SpotifySong[]> {
    try {
      // Note: This would require web scraping or a Billboard API
      // For now, return a curated list of known Billboard Latin hits
      const billboardLatinHits = [
        { title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee' },
        { title: 'Mi Gente', artist: 'J Balvin, Willy William' },
        { title: 'Échame La Culpa', artist: 'Luis Fonsi, Demi Lovato' },
        { title: 'Mayores', artist: 'Becky G, Bad Bunny' },
        { title: 'Se Acabó el Amor', artist: 'Abraham Mateo, Yandel, Jennifer Lopez' },
        { title: 'Felices los 4', artist: 'Maluma' },
        { title: 'Hola', artist: 'CNCO ft. Meghan Trainor' },
        { title: 'La Modelo', artist: 'Ozuna, Cardi B' },
        { title: 'Imitadora', artist: 'Romeo Santos' },
        { title: 'El Favor', artist: 'Nicky Jam, Sech' }
      ]

      return billboardLatinHits.slice(0, limit).map((song, index) => ({
        id: `billboard_${index + 1}`,
        name: song.title,
        artists: [{ name: song.artist }],
        album: { name: 'Billboard Latin Hits', release_date: new Date().getFullYear().toString() },
        external_urls: { 
          spotify: `https://open.spotify.com/search/${encodeURIComponent(song.title + ' ' + song.artist)}`
        },
        preview_url: null
      }))
    } catch (error) {
      console.error('Billboard error:', error)
      return []
    }
  }
}

// Multi-source aggregator
export class MultiSourceDiscovery {
  private sources: SongSource[] = []

  constructor() {
    // Initialize available sources
    this.sources.push(new CuratedListsSource())
    this.sources.push(new BillboardSource())
    
    // Add Last.fm if API key is available
    if (process.env.LASTFM_API_KEY) {
      this.sources.push(new LastFmSource(process.env.LASTFM_API_KEY))
    }
  }

  async discoverSongs(totalLimit: number = 250): Promise<SpotifySong[]> {
    const allSongs: SpotifySong[] = []
    const songsPerSource = Math.ceil(totalLimit / this.sources.length)

    for (const source of this.sources) {
      if (source.isConfigured()) {
        try {
          console.log(`Fetching ${songsPerSource} songs from ${source.name}...`)
          const songs = await source.getTopSongs(songsPerSource)
          allSongs.push(...songs)
        } catch (error) {
          console.warn(`Source ${source.name} failed:`, error)
        }
      }
    }

    // Remove duplicates based on title + artist
    const uniqueSongs = Array.from(
      new Map(allSongs.map(song => 
        [`${song.name.toLowerCase()}_${song.artists[0].name.toLowerCase()}`, song]
      )).values()
    )

    // Filter for likely Spanish songs
    const spanishSongs = uniqueSongs.filter(song => 
      this.isLikelySpanish(song.name, song.artists[0].name)
    )

    return spanishSongs.slice(0, totalLimit)
  }

  private isLikelySpanish(title: string, artist: string): boolean {
    // Enhanced Spanish detection
    const spanishIndicators = [
      // Common Spanish words
      /\b(amor|corazón|vida|tiempo|sueño|noche|día|sol|luna|mar|fuego|agua|casa|mundo|mujer|hombre|niño)\b/i,
      // Spanish articles and prepositions  
      /\b(el|la|los|las|un|una|de|del|en|con|por|para|sin|sobre|entre|mi|tu|su)\b/i,
      // Spanish verb forms
      /\b(soy|eres|somos|tengo|tienes|tiene|voy|vas|viene|hacer|quiero|puedo|debo|vamos|están|está)\b/i,
      // Common Spanish phrases
      /\b(te amo|mi amor|por favor|muy bien|cómo está|buenas noches|hasta luego|qué tal)\b/i,
      // Spanish-specific characters
      /[ñáéíóúü]/i
    ]

    const knownSpanishArtists = [
      'luis fonsi', 'daddy yankee', 'j balvin', 'maluma', 'ozuna', 'bad bunny',
      'karol g', 'nicky jam', 'anuel aa', 'romeo santos', 'marc anthony',
      'alejandro sanz', 'juanes', 'manu chao', 'rosalía', 'jesse & joy',
      'camila', 'maná', 'enrique iglesias', 'shakira', 'carlos vives',
      'juan luis guerra', 'gipsy kings', 'heroes del silencio', 'jarabe de palo',
      'soda stereo', 'andrés calamaro', 'diego torres', 'luis miguel'
    ]

    const titleHasSpanish = spanishIndicators.some(pattern => pattern.test(title))
    const artistIsSpanish = knownSpanishArtists.some(spanishArtist => 
      artist.toLowerCase().includes(spanishArtist) ||
      spanishArtist.includes(artist.toLowerCase())
    )

    return titleHasSpanish || artistIsSpanish
  }

  getAvailableSources(): string[] {
    return this.sources
      .filter(source => source.isConfigured())
      .map(source => source.name)
  }
}

export default MultiSourceDiscovery