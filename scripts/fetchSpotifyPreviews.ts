#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

// Get Spotify access token
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
  return data.access_token
}

// Fetch track details from Spotify
async function getSpotifyTrack(trackId: string, token: string) {
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    return null
  }

  return await response.json()
}

async function updatePreviewUrls() {
  console.log('🎵 Fetching Spotify preview URLs for all songs...')

  try {
    // Get Spotify access token
    const token = await getSpotifyToken()
    console.log('✅ Got Spotify access token')

    // Get all songs with Spotify IDs but no preview URLs
    const songs = await prisma.song.findMany({
      where: {
        isActive: true,
        spotifyId: { not: null },
        previewUrl: null
      },
      select: {
        id: true,
        title: true,
        artist: true,
        spotifyId: true
      }
    })

    console.log(`📊 Found ${songs.length} songs needing preview URLs`)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i]
      const progress = `[${i + 1}/${songs.length}]`

      try {
        console.log(`${progress} Fetching preview for "${song.title}" by ${song.artist}`)

        const trackData = await getSpotifyTrack(song.spotifyId!, token)

        if (trackData && trackData.preview_url) {
          // Update the song with preview URL
          await prisma.song.update({
            where: { id: song.id },
            data: {
              previewUrl: trackData.preview_url
            }
          })

          successCount++
          console.log(`  ✅ Preview URL found and saved`)
        } else {
          failCount++
          console.log(`  ⚠️ No preview available for this track`)
        }

        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`  ❌ Error fetching preview:`, error)
        failCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Update Complete!')
    console.log(`✅ Preview URLs added: ${successCount}`)
    console.log(`⚠️ No preview available: ${failCount}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updatePreviewUrls().catch(console.error)