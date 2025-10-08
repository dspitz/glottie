import { PrismaClient } from '@prisma/client'
import SpotifyWebApi from 'spotify-web-api-node'

const prisma = new PrismaClient()

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || '074c9198ca534a588df3b95c7eaf2e98',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'b6911b7446704d61acdb47af4d2c2489'
})

interface SongCorrection {
  title: string
  correctSpotifyId: string
  album?: string
  year?: number
}

// Correct Spotify IDs for Buena Vista Social Club songs
// These are the actual IDs from the official album releases
const corrections: SongCorrection[] = [
  {
    title: "Chan Chan",
    correctSpotifyId: "3bxZhauuIU4ubctdRZwPYW", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "Dos Gardenias",
    correctSpotifyId: "3okCsBWWv7okRgaTnMQ2Fp", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "El Cuarto de Tula",
    correctSpotifyId: "5UjaOsrdoI4shw9gM2eNPC", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "Veinte Años",
    correctSpotifyId: "2ZoquGwFXmn9fQY2poni7X", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "Candela",
    correctSpotifyId: "1caT2YklnqZq35IcQ0oRLj", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "De Camino a La Vereda",
    correctSpotifyId: "11TMcTS3iao1dvMogUSQVk", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "Pueblo Nuevo",
    correctSpotifyId: "6yo7CsVh0PsDHwiAKkYZDd", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "El Carretero",
    correctSpotifyId: "1PFNcjEKBz1BwrgCYuFJR3", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "Orgullecida",
    correctSpotifyId: "0esTuuMln8aSK0x24T9fnF", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  },
  {
    title: "La Bayamesa",
    correctSpotifyId: "0dnW7K54ioUwXsCre9q1Nq", // From Buena Vista Social Club album
    album: "Buena Vista Social Club",
    year: 1997
  }
]

async function getSpotifyAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant()
    return data.body['access_token']
  } catch (error) {
    console.error('Error getting Spotify access token:', error)
    throw error
  }
}

async function fetchSpotifyTrackData(spotifyId: string, accessToken: string) {
  spotifyApi.setAccessToken(accessToken)

  try {
    const track = await spotifyApi.getTrack(spotifyId)
    return {
      spotifyUrl: track.body.external_urls.spotify,
      previewUrl: track.body.preview_url,
      album: track.body.album.name,
      albumArt: track.body.album.images[0]?.url, // Largest image
      albumArtSmall: track.body.album.images[2]?.url || track.body.album.images[1]?.url, // Smallest or medium
      popularity: track.body.popularity,
      duration: track.body.duration_ms
    }
  } catch (error) {
    console.error(`Error fetching track ${spotifyId}:`, error)
    return null
  }
}

async function fixSpotifyIds() {
  console.log('🎵 Fixing Spotify IDs for Buena Vista Social Club songs...\n')

  try {
    // Get Spotify access token
    console.log('🔑 Getting Spotify access token...')
    const accessToken = await getSpotifyAccessToken()
    console.log('✅ Access token obtained\n')

    let successCount = 0
    let errorCount = 0

    for (const correction of corrections) {
      console.log(`🎵 Processing: ${correction.title}`)

      // Find the song in database
      const song = await prisma.song.findFirst({
        where: {
          title: correction.title,
          artist: "Buena Vista Social Club"
        }
      })

      if (!song) {
        console.log(`  ❌ Song not found in database`)
        errorCount++
        continue
      }

      console.log(`  📝 Current Spotify ID: ${song.spotifyId || 'none'}`)
      console.log(`  ✅ Correct Spotify ID: ${correction.correctSpotifyId}`)

      // Fetch metadata from Spotify
      const spotifyData = await fetchSpotifyTrackData(correction.correctSpotifyId, accessToken)

      if (!spotifyData) {
        console.log(`  ⚠️  Could not fetch Spotify metadata`)
        // Still update the ID even if we can't fetch metadata
        await prisma.song.update({
          where: { id: song.id },
          data: {
            spotifyId: correction.correctSpotifyId,
            album: correction.album,
            year: correction.year
          }
        })
        console.log(`  ✅ Updated Spotify ID only\n`)
        successCount++
        continue
      }

      // Update the song with correct Spotify data
      await prisma.song.update({
        where: { id: song.id },
        data: {
          spotifyId: correction.correctSpotifyId,
          spotifyUrl: spotifyData.spotifyUrl,
          previewUrl: spotifyData.previewUrl,
          album: spotifyData.album,
          albumArt: spotifyData.albumArt,
          albumArtSmall: spotifyData.albumArtSmall,
          popularity: spotifyData.popularity,
          year: correction.year
        }
      })

      console.log(`  ✅ Updated with full Spotify metadata`)
      console.log(`  🔗 Spotify URL: ${spotifyData.spotifyUrl}`)
      console.log(`  🎵 Preview: ${spotifyData.previewUrl ? 'Available' : 'Not available'}`)
      console.log(`  📀 Album: ${spotifyData.album}`)
      console.log(`  🎨 Album art: ${spotifyData.albumArt ? 'Available' : 'Not available'}\n`)

      successCount++

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Summary:')
    console.log(`  ✅ Successfully updated: ${successCount} songs`)
    console.log(`  ❌ Errors: ${errorCount} songs`)
    console.log(`  📝 Total processed: ${corrections.length} songs`)

    if (successCount === corrections.length) {
      console.log('\n🎉 All Spotify IDs fixed successfully!')
    }

    // Now fetch audio features for all updated songs
    console.log('\n🎵 Fetching audio features for updated songs...')

    const updatedSongs = await prisma.song.findMany({
      where: {
        artist: "Buena Vista Social Club",
        spotifyId: { not: null }
      }
    })

    for (const song of updatedSongs) {
      if (!song.spotifyId) continue

      try {
        const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(song.spotifyId)

        await prisma.song.update({
          where: { id: song.id },
          data: {
            danceability: audioFeatures.body.danceability,
            energy: audioFeatures.body.energy,
            valence: audioFeatures.body.valence,
            tempo: audioFeatures.body.tempo
          }
        })

        console.log(`  ✅ Audio features updated for: ${song.title}`)
      } catch (error) {
        console.log(`  ⚠️  Could not fetch audio features for: ${song.title}`)
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log('\n✨ Spotify data fix complete!')

  } catch (error) {
    console.error('❌ Error fixing Spotify IDs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixSpotifyIds()