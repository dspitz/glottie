import type { NextApiRequest, NextApiResponse } from 'next'
import { searchTopSpanishSongs, toAppSong } from '@/packages/adapters/spotify'
import MultiSourceDiscovery from '@/packages/adapters/songDiscovery'
import seedSongs from '@/seed_songs.json'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { demo, limit = 50 } = req.query
    const songLimit = parseInt(limit as string, 10)

    // Demo mode - return seed songs
    if (demo === 'true') {
      const demoSongs = seedSongs.map(song => ({
        id: song.spotifyId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        year: song.year,
        spotifyId: song.spotifyId,
        spotifyUrl: song.spotifyUrl,
        language: song.language,
        excerptLines: song.excerptLines,
        translations: song.translations
      }))

      return res.status(200).json({
        songs: demoSongs.slice(0, songLimit),
        mode: 'demo',
        total: demoSongs.length
      })
    }

    // Live mode - use multi-source discovery
    try {
      // Try Spotify first
      let songs = []
      try {
        const spotifySongs = await searchTopSpanishSongs(songLimit)
        songs = spotifySongs.map(toAppSong)
      } catch (spotifyError) {
        console.warn('Spotify API failed, trying other sources:', spotifyError)
        
        // Fall back to multi-source discovery
        const discovery = new MultiSourceDiscovery()
        const discoveredSongs = await discovery.discoverSongs(songLimit)
        songs = discoveredSongs.map(toAppSong)
      }

      return res.status(200).json({
        songs,
        mode: 'live',
        total: songs.length,
        sources: new MultiSourceDiscovery().getAvailableSources()
      })
    } catch (discoveryError) {
      console.warn('All discovery methods failed, falling back to demo mode:', discoveryError)
      
      // Fall back to demo songs if Spotify fails
      const demoSongs = seedSongs.map(song => ({
        id: song.spotifyId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        year: song.year,
        spotifyId: song.spotifyId,
        spotifyUrl: song.spotifyUrl,
        language: song.language
      }))

      return res.status(200).json({
        songs: demoSongs.slice(0, songLimit),
        mode: 'demo_fallback',
        total: demoSongs.length,
        warning: 'Spotify API unavailable, using demo songs'
      })
    }
  } catch (error) {
    console.error('Discover API error:', error)
    return res.status(500).json({
      error: 'Failed to discover songs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}