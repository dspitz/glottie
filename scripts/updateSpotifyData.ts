import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

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

function getAlbumArtUrls(images: { url: string; width: number; height: number }[]) {
  // Sort by size (largest first)
  const sortedImages = images.sort((a, b) => (b.width * b.height) - (a.width * a.height))
  
  // Get the largest image (typically 640x640) and a smaller one (typically 300x300)
  const albumArt = sortedImages[0]?.url || null
  const albumArtSmall = sortedImages.find(img => img.width <= 300)?.url || sortedImages[1]?.url || albumArt
  
  return { albumArt, albumArtSmall }
}

async function updateSpotifyData() {
  console.log('🎵 Updating Spotify preview URLs and album artwork...')
  
  try {
    const token = await getSpotifyAccessToken()
    
    // Get all songs that have a real Spotify ID (not curated_* or billboard_*) 
    // but missing preview URL or album art
    const songs = await prisma.song.findMany({
      where: {
        AND: [
          { spotifyId: { not: null } },
          { spotifyId: { not: { startsWith: 'curated_' } } },
          { spotifyId: { not: { startsWith: 'billboard_' } } },
          {
            OR: [
              { previewUrl: null },
              { albumArt: null }
            ]
          }
        ]
      },
      take: 50 // Process 50 songs at a time to respect rate limits
    })
    
    console.log(`🔍 Found ${songs.length} songs to update`)
    
    if (songs.length === 0) {
      console.log('✅ All songs are up to date!')
      return
    }
    
    let updatedCount = 0
    let previewCount = 0
    let artworkCount = 0
    
    for (const song of songs) {
      try {
        if (!song.spotifyId) continue
        
        console.log(`\\n📡 Updating "${song.title}" by ${song.artist}...`)
        
        // Fetch song details from Spotify
        const response = await fetch(`https://api.spotify.com/v1/tracks/${song.spotifyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`   ❌ Track not found on Spotify (404)`)
          } else {
            console.warn(`   ❌ Failed to fetch from Spotify: ${response.status}`)
          }
          continue
        }
        
        const spotifyTrack: SpotifyTrack = await response.json()
        
        // Extract album artwork URLs
        const { albumArt, albumArtSmall } = getAlbumArtUrls(spotifyTrack.album.images)
        
        // Prepare update data
        const updateData: any = {}
        let updates: string[] = []
        
        if (!song.previewUrl && spotifyTrack.preview_url) {
          updateData.previewUrl = spotifyTrack.preview_url
          updates.push('preview URL')
          previewCount++
        }
        
        if (!song.albumArt && albumArt) {
          updateData.albumArt = albumArt
          updateData.albumArtSmall = albumArtSmall
          updates.push('album artwork')
          artworkCount++
        }
        
        // Update the song if we have new data
        if (Object.keys(updateData).length > 0) {
          await prisma.song.update({
            where: { id: song.id },
            data: updateData
          })
          
          updatedCount++
          console.log(`   ✅ Updated: ${updates.join(', ')}`)
          
          if (spotifyTrack.preview_url) {
            console.log(`   🎵 Preview available: 30-second sample`)
          } else {
            console.log(`   ⚠️  No preview available from Spotify`)
          }
          
          if (albumArt) {
            console.log(`   🖼️  Album art: ${albumArt.includes('640') ? '640x640' : 'various sizes'}`)
          }
        } else {
          console.log(`   ℹ️  No updates needed`)
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        console.error(`   ❌ Failed to update "${song.title}":`, error)
      }
    }
    
    console.log(`\\n📊 Summary:`)
    console.log(`✅ Updated songs: ${updatedCount}/${songs.length}`)
    console.log(`🎵 Songs with preview URLs added: ${previewCount}`)
    console.log(`🖼️  Songs with album artwork added: ${artworkCount}`)
    
    if (updatedCount > 0) {
      console.log(`\\n💡 Run this script again to update more songs if needed.`)
    }
    
    // Show overall progress
    const [totalSongs, songsWithPreview, songsWithArt] = await Promise.all([
      prisma.song.count(),
      prisma.song.count({ where: { previewUrl: { not: null } } }),
      prisma.song.count({ where: { albumArt: { not: null } } })
    ])
    
    console.log(`\\n📈 Overall Progress:`)
    console.log(`🎵 Songs with previews: ${songsWithPreview}/${totalSongs} (${((songsWithPreview/totalSongs)*100).toFixed(1)}%)`)
    console.log(`🖼️  Songs with artwork: ${songsWithArt}/${totalSongs} (${((songsWithArt/totalSongs)*100).toFixed(1)}%)`)
    
  } catch (error) {
    console.error('❌ Failed to update Spotify data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  updateSpotifyData()
    .catch(console.error)
    .finally(() => process.exit())
}

export default updateSpotifyData