#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    release_date: string
    images: { url: string, height: number, width: number }[]
  }
  preview_url: string | null
  popularity: number
  external_urls: { spotify: string }
  audio_features?: {
    danceability: number
    energy: number
    valence: number
    tempo: number
  }
}

async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not found in environment variables')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('Failed to get Spotify access token')
  }
  return data.access_token
}

async function searchSpotifyTrack(artist: string, title: string, token: string): Promise<SpotifyTrack | null> {
  // Clean up search query for better matching
  const cleanArtist = artist.replace(/feat\.|ft\.|featuring/gi, '').trim()
  const cleanTitle = title.replace(/\(.*?\)|feat\.|ft\.|featuring.*$/gi, '').trim()

  const queries = [
    `artist:"${cleanArtist}" track:"${cleanTitle}"`,
    `artist:${cleanArtist} track:${cleanTitle}`,
    `${cleanArtist} ${cleanTitle}`,
    `"${cleanTitle}" ${cleanArtist}`
  ]

  for (const query of queries) {
    try {
      console.log(`    🔍 Searching: ${query}`)

      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (!searchResponse.ok) {
        console.log(`    ⚠️ Search failed: ${searchResponse.status}`)
        continue
      }

      const searchData = await searchResponse.json()
      const tracks = searchData.tracks?.items || []

      // Find best match by artist and title similarity
      for (const track of tracks) {
        const trackArtist = track.artists[0]?.name.toLowerCase()
        const trackTitle = track.name.toLowerCase()
        const searchArtist = cleanArtist.toLowerCase()
        const searchTitle = cleanTitle.toLowerCase()

        // Check if this is a good match
        if ((trackArtist?.includes(searchArtist) || searchArtist.includes(trackArtist)) &&
            (trackTitle?.includes(searchTitle) || searchTitle.includes(trackTitle))) {
          console.log(`    ✅ Found match: ${track.artists[0]?.name} - ${track.name}`)
          return track
        }
      }
    } catch (error) {
      console.log(`    ❌ Search error: ${error}`)
      continue
    }

    // Add delay between different search strategies
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return null
}

async function getAudioFeatures(trackId: string, token: string): Promise<SpotifyTrack['audio_features'] | null> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) return null

    const features = await response.json()
    return {
      danceability: features.danceability,
      energy: features.energy,
      valence: features.valence,
      tempo: features.tempo
    }
  } catch (error) {
    console.log(`    ⚠️ Failed to get audio features: ${error}`)
    return null
  }
}

async function enhancedSpotifyIntegration() {
  console.log('🎵 Enhanced Spotify Integration for Curated 100 Songs')
  console.log('=' + '='.repeat(60))

  try {
    const token = await getSpotifyToken()
    console.log('✅ Got Spotify access token')

    // Get curated songs that need Spotify data
    const songs = await prisma.song.findMany({
      where: {
        level: { in: [1, 2, 3, 4, 5] },
        isActive: true,
        spotifyId: null
      },
      select: {
        id: true,
        title: true,
        artist: true,
        level: true,
        order: true
      },
      orderBy: [
        { level: 'asc' },
        { order: 'asc' }
      ]
    })

    console.log(`📊 Found ${songs.length} curated songs needing Spotify data`)

    if (songs.length === 0) {
      console.log('✅ All curated songs already have Spotify data!')
      return
    }

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i]
      const progress = `[${i + 1}/${songs.length}]`

      try {
        console.log(`${progress} Level ${song.level}: "${song.title}" by ${song.artist}`)

        // Search for track on Spotify
        const track = await searchSpotifyTrack(song.artist, song.title, token)

        if (!track) {
          failCount++
          console.log(`  ❌ No Spotify match found`)
          await new Promise(resolve => setTimeout(resolve, 500))
          continue
        }

        // Get audio features
        const audioFeatures = await getAudioFeatures(track.id, token)

        // Get album art URLs
        const albumArt = track.album.images.find(img => img.height >= 600)?.url ||
                         track.album.images[0]?.url
        const albumArtSmall = track.album.images.find(img => img.height <= 300)?.url ||
                              track.album.images[track.album.images.length - 1]?.url

        // Extract year from release date
        const year = track.album.release_date ?
                     parseInt(track.album.release_date.split('-')[0]) : null

        // Update database with comprehensive Spotify data
        await prisma.song.update({
          where: { id: song.id },
          data: {
            spotifyId: track.id,
            spotifyUrl: track.external_urls.spotify,
            previewUrl: track.preview_url,
            album: track.album.name,
            year: year,
            albumArt: albumArt,
            albumArtSmall: albumArtSmall,
            popularity: track.popularity,
            danceability: audioFeatures?.danceability,
            energy: audioFeatures?.energy,
            valence: audioFeatures?.valence,
            tempo: audioFeatures?.tempo
          }
        })

        successCount++
        console.log(`  ✅ Updated with full metadata`)
        console.log(`    📊 Popularity: ${track.popularity}/100`)
        if (audioFeatures) {
          console.log(`    💃 Danceability: ${Math.round(audioFeatures.danceability * 100)}%, Energy: ${Math.round(audioFeatures.energy * 100)}%`)
        }

        // Respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`  ❌ Error processing song:`, error)
        failCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Enhanced Spotify Integration Complete!')
    console.log(`✅ Successfully processed: ${successCount} songs`)
    console.log(`❌ Failed to find: ${failCount} songs`)
    console.log(`📈 Success rate: ${Math.round(successCount / songs.length * 100)}%`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

if (require.main === module) {
  enhancedSpotifyIntegration()
}

export { enhancedSpotifyIntegration }