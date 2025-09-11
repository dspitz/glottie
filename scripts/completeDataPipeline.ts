import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { searchTopSpanishSongs, toAppSong } from '@/packages/adapters/spotify'
import { getLyricsByTrack } from '@/packages/adapters/lyricsProvider'
import { GeniusClient } from '@/packages/adapters/genius'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()
const genius = new GeniusClient()

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    release_date: string
    images: { url: string; width: number; height: number }[]
  }
  external_urls: { spotify: string }
  preview_url: string | null
  popularity?: number
  audio_features?: {
    danceability?: number
    energy?: number
    valence?: number
    tempo?: number
  }
}

interface ProcessingStats {
  discovered: number
  added: number
  updated: number
  withLyrics: number
  withGenius: number
  errors: number
}

async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured')
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

  const data = await response.json()
  return data.access_token
}

async function getSpotifyTrackDetails(trackId: string, token: string): Promise<SpotifyTrack | null> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) return null

    const track = await response.json()

    // Also get audio features
    const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    let audioFeatures = null
    if (featuresResponse.ok) {
      audioFeatures = await featuresResponse.json()
    }

    return {
      ...track,
      audio_features: audioFeatures
    }
  } catch (error) {
    console.error(`Failed to get track details for ${trackId}:`, error)
    return null
  }
}

function getAlbumArtUrls(images: { url: string; width: number; height: number }[]) {
  const sortedImages = images.sort((a, b) => (b.width * b.height) - (a.width * a.height))
  const albumArt = sortedImages[0]?.url || null
  const albumArtSmall = sortedImages.find(img => img.width <= 300)?.url || sortedImages[1]?.url || albumArt
  return { albumArt, albumArtSmall }
}

async function processSpotifyTrack(track: SpotifyTrack, stats: ProcessingStats): Promise<void> {
  const artist = track.artists[0].name
  const title = track.name
  
  console.log(`\\n🎵 Processing \"${title}\" by ${artist}`)

  try {
    // Check if song already exists
    let existingSong = await prisma.song.findUnique({
      where: { spotifyId: track.id },
      include: { translations: true }
    })

    const { albumArt, albumArtSmall } = getAlbumArtUrls(track.album.images)

    const songData = {
      title: track.name,
      artist: artist,
      album: track.album.name,
      year: track.album.release_date ? parseInt(track.album.release_date.split('-')[0]) : null,
      spotifyId: track.id,
      spotifyUrl: track.external_urls.spotify,
      previewUrl: track.preview_url,
      albumArt,
      albumArtSmall,
      popularity: track.popularity,
      danceability: track.audio_features?.danceability,
      energy: track.audio_features?.energy,
      valence: track.audio_features?.valence,
      tempo: track.audio_features?.tempo,
      language: 'es',
      isActive: true
    }

    if (existingSong) {
      // Update existing song with enhanced data
      await prisma.song.update({
        where: { id: existingSong.id },
        data: songData
      })
      console.log(`   ✅ Updated existing song`)
      stats.updated++
    } else {
      // Create new song
      existingSong = await prisma.song.create({
        data: songData,
        include: { translations: true }
      })
      console.log(`   ➕ Added new song`)
      stats.added++
    }

    // Try to get lyrics if we don't have them
    if (!existingSong.lyricsRaw) {
      try {
        console.log(`   📝 Fetching lyrics...`)
        const lyricsResult = await getLyricsByTrack(artist, title)
        
        if (lyricsResult.licensed && lyricsResult.raw) {
          await prisma.song.update({
            where: { id: existingSong.id },
            data: {
              lyricsRaw: lyricsResult.raw,
              lyricsProvider: lyricsResult.provider,
              lyricsLicensed: lyricsResult.licensed,
              culturalContext: lyricsResult.culturalContext
            }
          })
          console.log(`   ✅ Added lyrics from ${lyricsResult.provider}`)
          stats.withLyrics++
        } else {
          console.log(`   ⚠️ No licensed lyrics available`)
        }
      } catch (error) {
        console.log(`   ❌ Failed to get lyrics: ${error}`)
      }
    }

    // Try to enrich with Genius metadata
    try {
      console.log(`   🧠 Checking Genius for additional metadata...`)
      const geniusInfo = await genius.getLyricsInfo(artist, title)
      
      if (geniusInfo.found) {
        const updates: any = {}
        
        if (geniusInfo.releaseDate && !existingSong.year) {
          const year = parseInt(geniusInfo.releaseDate.split(/[-/\\s]/)[0])
          if (!isNaN(year)) {
            updates.year = year
          }
        }
        
        if (geniusInfo.album && !existingSong.album) {
          updates.album = geniusInfo.album
        }

        if (Object.keys(updates).length > 0) {
          await prisma.song.update({
            where: { id: existingSong.id },
            data: updates
          })
          console.log(`   ✅ Enhanced with Genius metadata`)
        }
        stats.withGenius++
      } else {
        console.log(`   ℹ️ Not found on Genius`)
      }
    } catch (error) {
      console.log(`   ⚠️ Genius lookup failed: ${error}`)
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 200))

  } catch (error) {
    console.error(`   ❌ Failed to process track: ${error}`)
    stats.errors++
  }
}

async function completeDataPipeline(limit: number = 50): Promise<ProcessingStats> {
  console.log('🚀 Starting complete data pipeline...')
  
  const stats: ProcessingStats = {
    discovered: 0,
    added: 0,
    updated: 0,
    withLyrics: 0,
    withGenius: 0,
    errors: 0
  }

  try {
    // Get Spotify access token
    const token = await getSpotifyAccessToken()
    console.log('🔑 Spotify access token obtained')

    // Discover new Spanish songs
    console.log(`🔍 Discovering ${limit} Spanish songs from Spotify...`)
    const spotifySongs = await searchTopSpanishSongs(limit)
    stats.discovered = spotifySongs.length
    console.log(`📡 Found ${stats.discovered} songs to process`)

    if (stats.discovered === 0) {
      console.log('⚠️ No songs found. Check Spotify API connectivity.')
      return stats
    }

    // Process each song with detailed metadata
    console.log('\\n🔄 Processing songs with complete metadata...')
    for (const [index, spotifySong] of spotifySongs.entries()) {
      console.log(`\\n📊 Progress: ${index + 1}/${stats.discovered}`)
      
      // Get detailed track info including audio features
      const detailedTrack = await getSpotifyTrackDetails(spotifySong.id, token)
      if (detailedTrack) {
        await processSpotifyTrack(detailedTrack, stats)
      } else {
        console.log(`   ❌ Failed to get detailed track info`)
        stats.errors++
      }
    }

    // Final statistics
    console.log('\\n📊 Pipeline Complete - Summary:')
    console.log(`   🔍 Songs discovered: ${stats.discovered}`)
    console.log(`   ➕ Songs added: ${stats.added}`)
    console.log(`   ✏️ Songs updated: ${stats.updated}`)
    console.log(`   📝 Songs with lyrics: ${stats.withLyrics}`)
    console.log(`   🧠 Songs enhanced with Genius: ${stats.withGenius}`)
    console.log(`   ❌ Errors: ${stats.errors}`)

    // Show current database state
    const [totalActive, withLyrics, withArtwork, withGenius] = await Promise.all([
      prisma.song.count({ where: { isActive: true } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { lyricsRaw: { not: null } }] } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { albumArt: { not: null } }] } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { culturalContext: { not: null } }] } })
    ])

    console.log('\\n📈 Current Database State:')
    console.log(`   🎵 Total active songs: ${totalActive}`)
    console.log(`   📝 Songs with lyrics: ${withLyrics} (${((withLyrics/totalActive)*100).toFixed(1)}%)`)
    console.log(`   🖼️ Songs with artwork: ${withArtwork} (${((withArtwork/totalActive)*100).toFixed(1)}%)`)
    console.log(`   🧠 Songs with context: ${withGenius} (${((withGenius/totalActive)*100).toFixed(1)}%)`)

    return stats

  } catch (error) {
    console.error('❌ Pipeline failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export for use in other scripts
export { completeDataPipeline }

// Run if called directly
if (require.main === module) {
  const limit = parseInt(process.argv[2]) || 100
  
  completeDataPipeline(limit)
    .then((stats) => {
      console.log('\\n✅ Complete data pipeline finished successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Pipeline failed:', error)
      process.exit(1)
    })
}