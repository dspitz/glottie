import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

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

async function updatePreviewUrls() {
  console.log('🎵 Updating preview URLs for existing songs...')
  
  try {
    const token = await getSpotifyAccessToken()
    
    // Get all songs that have a Spotify ID but no preview URL
    const songs = await prisma.song.findMany({
      where: {
        spotifyId: { not: null },
        previewUrl: null
      },
      take: 20 // Limit to 20 songs to avoid rate limiting
    })
    
    console.log(`🔍 Found ${songs.length} songs without preview URLs`)
    
    let updatedCount = 0
    
    for (const song of songs) {
      try {
        if (!song.spotifyId) continue
        
        // Fetch song details from Spotify
        const response = await fetch(`https://api.spotify.com/v1/tracks/${song.spotifyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          console.warn(`❌ Failed to fetch "${song.title}" from Spotify: ${response.status}`)
          continue
        }
        
        const spotifyData = await response.json()
        
        // Update song with preview URL
        await prisma.song.update({
          where: { id: song.id },
          data: {
            previewUrl: spotifyData.preview_url
          }
        })
        
        if (spotifyData.preview_url) {
          updatedCount++
          console.log(`✅ Updated "${song.title}" with preview URL`)
        } else {
          console.log(`⚠️  No preview available for "${song.title}"`)
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Failed to update "${song.title}":`, error)
      }
    }
    
    console.log(`\n📊 Updated ${updatedCount} songs with preview URLs`)
    
  } catch (error) {
    console.error('❌ Failed to update preview URLs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  updatePreviewUrls()
    .catch(console.error)
    .finally(() => process.exit())
}

export default updatePreviewUrls