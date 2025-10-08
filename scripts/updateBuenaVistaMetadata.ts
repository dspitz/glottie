import { PrismaClient } from '@prisma/client'
import SpotifyWebApi from 'spotify-web-api-node'

const prisma = new PrismaClient()

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || '074c9198ca534a588df3b95c7eaf2e98',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'b6911b7446704d61acdb47af4d2c2489'
})

async function getSpotifyAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant()
    return data.body['access_token']
  } catch (error) {
    console.error('Error getting Spotify access token:', error)
    throw error
  }
}

function calculateWordCount(lyricsRaw: string | null): number {
  if (!lyricsRaw) return 0

  try {
    const lyrics = JSON.parse(lyricsRaw)

    // Get all unique lines (avoiding repetition)
    const uniqueLines = new Set<string>()

    if (lyrics.lines && Array.isArray(lyrics.lines)) {
      lyrics.lines.forEach((line: string) => {
        if (line && line.trim()) {
          uniqueLines.add(line.trim().toLowerCase())
        }
      })
    }

    // Count words in unique lines
    let totalWords = 0
    uniqueLines.forEach(line => {
      // Split by spaces and filter out empty strings
      const words = line.split(/\s+/).filter(word => word.length > 0)
      totalWords += words.length
    })

    return totalWords
  } catch (error) {
    console.error('Error calculating word count:', error)
    return 0
  }
}

async function updateMetadata() {
  console.log('🎵 Updating metadata for Buena Vista Social Club songs...\n')

  try {
    // Get Spotify access token
    console.log('🔑 Getting Spotify access token...')
    const accessToken = await getSpotifyAccessToken()
    spotifyApi.setAccessToken(accessToken)
    console.log('✅ Access token obtained\n')

    // Fetch all Buena Vista Social Club songs
    const songs = await prisma.song.findMany({
      where: {
        artist: "Buena Vista Social Club"
      }
    })

    console.log(`📝 Found ${songs.length} songs to update\n`)

    let successCount = 0
    let genresFetched = 0
    let wordCountsCalculated = 0

    for (const song of songs) {
      console.log(`🎵 Processing: ${song.title}`)

      const updates: any = {}

      // Calculate word count from lyrics
      if (song.lyricsRaw) {
        const wordCount = calculateWordCount(song.lyricsRaw)
        if (wordCount > 0) {
          // Store in the metrics table
          const existingMetrics = await prisma.metrics.findUnique({
            where: { songId: song.id }
          })

          if (existingMetrics) {
            await prisma.metrics.update({
              where: { songId: song.id },
              data: {
                wordCount: wordCount,
                uniqueWordCount: wordCount // We'll use the same for now
              }
            })
          } else {
            await prisma.metrics.create({
              data: {
                songId: song.id,
                wordCount: wordCount,
                uniqueWordCount: wordCount,
                typeTokenRatio: 0.7, // Default estimate
                avgWordFreqZipf: 4.5, // Default
                verbDensity: 0.15, // Default
                tenseWeights: 1.0, // Default
                idiomCount: 0, // Default
                punctComplexity: 0.5, // Default
                difficultyScore: song.level || 3 // Use the song's level as difficulty
              }
            })
          }

          console.log(`  📊 Word count: ${wordCount} unique words`)
          wordCountsCalculated++
        }
      }

      // Fetch genre and audio features from Spotify
      if (song.spotifyId) {
        try {
          // Get track details for genre (from album)
          const track = await spotifyApi.getTrack(song.spotifyId)

          // Get the album to check for genres
          if (track.body.album?.id) {
            const album = await spotifyApi.getAlbum(track.body.album.id)
            if (album.body.genres && album.body.genres.length > 0) {
              updates.genres = album.body.genres.join(', ')
              console.log(`  🎭 Genres: ${updates.genres}`)
              genresFetched++
            } else {
              // If album has no genres, try the artist
              if (track.body.artists && track.body.artists.length > 0) {
                const artist = await spotifyApi.getArtist(track.body.artists[0].id)
                if (artist.body.genres && artist.body.genres.length > 0) {
                  updates.genres = artist.body.genres.join(', ')
                  console.log(`  🎭 Genres (from artist): ${updates.genres}`)
                  genresFetched++
                }
              }
            }
          }

          // Get audio features
          try {
            const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(song.spotifyId)
            if (audioFeatures.body) {
              updates.danceability = audioFeatures.body.danceability
              updates.energy = audioFeatures.body.energy
              updates.valence = audioFeatures.body.valence
              updates.tempo = audioFeatures.body.tempo
              console.log(`  🎼 Audio features: Danceability=${audioFeatures.body.danceability?.toFixed(2)}, Energy=${audioFeatures.body.energy?.toFixed(2)}, Tempo=${audioFeatures.body.tempo?.toFixed(0)}`)
            }
          } catch (audioError) {
            console.log(`  ⚠️  Could not fetch audio features`)
          }

          // Update popularity
          updates.popularity = track.body.popularity
          console.log(`  📈 Popularity: ${updates.popularity}`)

        } catch (spotifyError) {
          console.log(`  ⚠️  Could not fetch Spotify data`)
        }
      }

      // Update the song if we have any updates
      if (Object.keys(updates).length > 0) {
        await prisma.song.update({
          where: { id: song.id },
          data: updates
        })
        console.log(`  ✅ Updated metadata\n`)
        successCount++
      } else {
        console.log(`  ℹ️  No updates needed\n`)
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Summary:')
    console.log(`  ✅ Songs updated: ${successCount}`)
    console.log(`  🎭 Genres fetched: ${genresFetched}`)
    console.log(`  📊 Word counts calculated: ${wordCountsCalculated}`)
    console.log(`  📝 Total processed: ${songs.length}`)

    // Show a summary of genres found
    const updatedSongs = await prisma.song.findMany({
      where: {
        artist: "Buena Vista Social Club",
        genres: { not: null }
      },
      select: { genres: true }
    })

    const allGenres = new Set<string>()
    updatedSongs.forEach(song => {
      if (song.genres) {
        song.genres.split(', ').forEach(genre => allGenres.add(genre))
      }
    })

    if (allGenres.size > 0) {
      console.log('\n🎭 Genres found:')
      allGenres.forEach(genre => console.log(`   - ${genre}`))
    }

    console.log('\n✨ Metadata update complete!')

  } catch (error) {
    console.error('❌ Error updating metadata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updateMetadata()