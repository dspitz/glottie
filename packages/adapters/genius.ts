interface GeniusSearchResult {
  id: number
  title: string
  title_with_featured: string
  full_title: string
  url: string
  path: string
  song_art_image_url: string
  primary_artist: {
    id: number
    name: string
    url: string
    image_url: string
  }
  featured_artists: {
    id: number
    name: string
    url: string
  }[]
}

interface GeniusSong {
  id: number
  title: string
  url: string
  path: string
  song_art_image_url: string
  lyrics_state: 'complete' | 'incomplete' | 'unreleased'
  release_date_for_display: string
  album?: {
    id: number
    name: string
    url: string
    cover_art_url: string
  }
  primary_artist: {
    id: number
    name: string
    url: string
    image_url: string
  }
  media: {
    provider: string
    type: string
    url: string
  }[]
}

interface GeniusLyricsResult {
  lyrics?: string
  html?: string
  error?: string
}

interface GeniusApiResponse<T> {
  meta: {
    status: number
    message?: string
  }
  response: T
}

export class GeniusClient {
  private clientId: string
  private clientSecret: string
  private accessToken: string | null = null
  private baseUrl = 'https://api.genius.com'
  
  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId || process.env.GENIUS_CLIENT_ID || ''
    this.clientSecret = clientSecret || process.env.GENIUS_CLIENT_SECRET || ''
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Genius API credentials not configured. Some features will be limited.')
    }
  }

  /**
   * Get access token using Client Credentials flow
   * This gives us basic API access for public data
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Genius API credentials not configured')
    }

    try {
      const response = await fetch('https://api.genius.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials'
        })
      })

      if (!response.ok) {
        throw new Error(`Genius OAuth failed: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      
      return this.accessToken
    } catch (error) {
      console.error('Failed to get Genius access token:', error)
      throw error
    }
  }

  /**
   * Make authenticated request to Genius API
   */
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Genius API error ${response.status}: ${errorText}`)
    }

    return response.json()
  }

  /**
   * Search for songs on Genius
   */
  async searchSongs(query: string): Promise<GeniusSearchResult[]> {
    try {
      const data: GeniusApiResponse<{ hits: { result: GeniusSearchResult }[] }> = 
        await this.apiRequest(`/search?q=${encodeURIComponent(query)}`)
      
      return data.response.hits.map(hit => hit.result)
    } catch (error) {
      console.error('Genius search failed:', error)
      return []
    }
  }

  /**
   * Get detailed song information by ID
   */
  async getSong(songId: number): Promise<GeniusSong | null> {
    try {
      const data: GeniusApiResponse<{ song: GeniusSong }> = 
        await this.apiRequest(`/songs/${songId}`)
      
      return data.response.song
    } catch (error) {
      console.error(`Failed to get Genius song ${songId}:`, error)
      return null
    }
  }

  /**
   * Find best matching song for artist/title combination
   */
  async findBestMatch(artist: string, title: string): Promise<GeniusSearchResult | null> {
    const queries = [
      `${artist} ${title}`,
      title,
      `${title} ${artist}`,
      `${artist.split(' ')[0]} ${title}` // Try with just first word of artist name
    ]

    for (const query of queries) {
      const results = await this.searchSongs(query)
      
      if (results.length === 0) continue

      // Score results based on similarity to our target
      const scoredResults = results.map(result => {
        const resultArtist = result.primary_artist.name.toLowerCase()
        const resultTitle = result.title.toLowerCase()
        const targetArtist = artist.toLowerCase()
        const targetTitle = title.toLowerCase()

        let score = 0

        // Exact matches get highest score
        if (resultArtist === targetArtist) score += 10
        if (resultTitle === targetTitle) score += 10

        // Partial matches
        if (resultArtist.includes(targetArtist) || targetArtist.includes(resultArtist)) score += 5
        if (resultTitle.includes(targetTitle) || targetTitle.includes(resultTitle)) score += 5

        // Word-by-word matching
        const artistWords = targetArtist.split(' ')
        const titleWords = targetTitle.split(' ')

        artistWords.forEach(word => {
          if (word.length > 2 && resultArtist.includes(word)) score += 1
        })

        titleWords.forEach(word => {
          if (word.length > 2 && resultTitle.includes(word)) score += 1
        })

        return { result, score }
      })

      // Return the best match if it has a reasonable score
      const bestMatch = scoredResults.sort((a, b) => b.score - a.score)[0]
      if (bestMatch && bestMatch.score >= 5) {
        return bestMatch.result
      }
    }

    return null
  }

  /**
   * Attempt to get lyrics for a song
   * Note: Genius doesn't provide lyrics directly via API
   * This method provides song metadata that can be used for other purposes
   */
  async getLyricsInfo(artist: string, title: string): Promise<{
    found: boolean
    geniusId?: number
    geniusUrl?: string
    songArt?: string
    releaseDate?: string
    album?: string
    error?: string
  }> {
    try {
      const match = await this.findBestMatch(artist, title)
      
      if (!match) {
        return {
          found: false,
          error: 'No matching song found on Genius'
        }
      }

      const songDetails = await this.getSong(match.id)
      
      return {
        found: true,
        geniusId: match.id,
        geniusUrl: match.url,
        songArt: match.song_art_image_url,
        releaseDate: songDetails?.release_date_for_display,
        album: songDetails?.album?.name,
      }
    } catch (error) {
      return {
        found: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get artist information
   */
  async getArtist(artistId: number): Promise<any> {
    try {
      const data: GeniusApiResponse<{ artist: any }> = 
        await this.apiRequest(`/artists/${artistId}`)
      
      return data.response.artist
    } catch (error) {
      console.error(`Failed to get Genius artist ${artistId}:`, error)
      return null
    }
  }

  /**
   * Get songs by artist
   */
  async getArtistSongs(artistId: number, page: number = 1, perPage: number = 20): Promise<GeniusSearchResult[]> {
    try {
      const data: GeniusApiResponse<{ songs: GeniusSearchResult[] }> = 
        await this.apiRequest(`/artists/${artistId}/songs?page=${page}&per_page=${perPage}`)
      
      return data.response.songs
    } catch (error) {
      console.error(`Failed to get songs for artist ${artistId}:`, error)
      return []
    }
  }
}

// Export a default instance
export const genius = new GeniusClient()