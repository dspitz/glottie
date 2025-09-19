import { PrismaClient } from '@prisma/client'
import SpotifyWebApi from 'spotify-web-api-node'

const prisma = new PrismaClient()

// Initialize Spotify client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

async function getSpotifyToken() {
  const result = await spotifyApi.clientCredentialsGrant()
  spotifyApi.setAccessToken(result.body['access_token'])
  return result.body['access_token']
}

async function fetchGenresForSong(spotifyId: string) {
  try {
    const track = await spotifyApi.getTrack(spotifyId)
    const artistIds = track.body.artists.map(a => a.id)

    // Get genres from artists (tracks don't have genres directly)
    const artists = await spotifyApi.getArtists(artistIds)
    const allGenres = new Set<string>()

    artists.body.artists.forEach(artist => {
      artist.genres.forEach(genre => allGenres.add(genre))
    })

    return Array.from(allGenres).slice(0, 3).join(', ') // Return top 3 genres
  } catch (error) {
    console.error('Error fetching genres:', error)
    return null
  }
}

function calculateWordCount(lyricsRaw: string | null): number {
  if (!lyricsRaw) return 0

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(lyricsRaw)
    const lines = parsed.lines || []
    const allText = lines.join(' ')

    // Split by whitespace and count non-empty words
    const words = allText.split(/\s+/).filter(word => word.length > 0)
    return words.length
  } catch {
    // If not JSON, treat as plain text
    const words = lyricsRaw.split(/\s+/).filter(word => word.length > 0)
    return words.length
  }
}

async function populateGenresAndMetrics() {
  console.log('🎵 Populating Genres and Word Counts')
  console.log('=====================================\n')

  // Get Spotify token
  await getSpotifyToken()
  console.log('✅ Got Spotify access token\n')

  // Get all songs with levels
  const songs = await prisma.song.findMany({
    where: {
      isActive: true,
      level: { not: null }
    },
    include: {
      metrics: true
    }
  })

  console.log(`Found ${songs.length} songs to process\n`)

  let genresUpdated = 0
  let metricsCreated = 0
  let metricsUpdated = 0

  for (const song of songs) {
    console.log(`Processing: ${song.title} by ${song.artist}`)

    // Update genres if we have a Spotify ID and no genres yet
    if (song.spotifyId && !song.genres) {
      const genres = await fetchGenresForSong(song.spotifyId)
      if (genres) {
        await prisma.song.update({
          where: { id: song.id },
          data: { genres }
        })
        console.log(`  ✅ Updated genres: ${genres}`)
        genresUpdated++
      }

      // Rate limit for Spotify API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Calculate and store word count if we have lyrics
    if (song.lyricsRaw) {
      const wordCount = calculateWordCount(song.lyricsRaw)

      if (wordCount > 0) {
        if (song.metrics) {
          // Update existing metrics
          await prisma.metrics.update({
            where: { id: song.metrics.id },
            data: {
              wordCount,
              uniqueWordCount: wordCount, // Simplified for now
              typeTokenRatio: 0.5, // Placeholder
              avgWordFreqZipf: 3.5, // Placeholder
              verbDensity: 0.2, // Placeholder
              tenseWeights: 1.0, // Placeholder
              idiomCount: 0, // Placeholder
              punctComplexity: 1.0, // Placeholder
              difficultyScore: song.level || 1 // Use level as difficulty
            }
          })
          console.log(`  ✅ Updated metrics: ${wordCount} words`)
          metricsUpdated++
        } else {
          // Create new metrics
          await prisma.metrics.create({
            data: {
              songId: song.id,
              wordCount,
              uniqueWordCount: wordCount, // Simplified for now
              typeTokenRatio: 0.5, // Placeholder
              avgWordFreqZipf: 3.5, // Placeholder
              verbDensity: 0.2, // Placeholder
              tenseWeights: 1.0, // Placeholder
              idiomCount: 0, // Placeholder
              punctComplexity: 1.0, // Placeholder
              difficultyScore: song.level || 1 // Use level as difficulty
            }
          })
          console.log(`  ✅ Created metrics: ${wordCount} words`)
          metricsCreated++
        }
      }
    }
  }

  console.log('\n=====================================')
  console.log('✅ Population Complete!')
  console.log(`   Genres updated: ${genresUpdated}`)
  console.log(`   Metrics created: ${metricsCreated}`)
  console.log(`   Metrics updated: ${metricsUpdated}`)
}

populateGenresAndMetrics()
  .catch(console.error)
  .finally(() => prisma.$disconnect())