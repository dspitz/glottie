import { prisma } from '../lib/prisma'
import { searchSpotifyTracks, toAppSong } from '../packages/adapters/spotify'

async function addKarolGSong() {
  try {
    console.log('🎵 Searching for "Un Gatito Me Llamo" by Karol G on Spotify...')

    // Search for the track on Spotify
    const searchResults = await searchSpotifyTracks('Un Gatito Me Llamo Karol G')

    if (!searchResults || searchResults.length === 0) {
      console.error('❌ No tracks found on Spotify')
      return
    }

    // Find the best match (prefer Karol G as artist)
    const spotifyTrack = searchResults.find(t =>
      t.artists.some(a => a.name.toLowerCase().includes('karol g'))
    ) || searchResults[0]

    // Convert to app song format
    const track = toAppSong(spotifyTrack)

    console.log(`✅ Found track: ${track.title} by ${track.artist}`)
    console.log(`   Spotify ID: ${track.spotifyId}`)
    console.log(`   Album: ${track.album}`)

    // We'll need to fetch album art separately or use a placeholder for now
    // The basic Spotify search doesn't include images
    const albumArt = ''
    const albumArtSmall = ''

    // Check if song already exists
    const existingSong = await prisma.song.findFirst({
      where: {
        OR: [
          { spotifyId: track.spotifyId },
          {
            AND: [
              { title: track.title },
              { artist: track.artist }
            ]
          }
        ]
      }
    })

    if (existingSong) {
      console.log(`⚠️ Song already exists with ID: ${existingSong.id}`)

      // Update level if different
      if (existingSong.level !== 5) {
        await prisma.song.update({
          where: { id: existingSong.id },
          data: {
            level: 5,
            levelName: 'Upper-Intermediate'
          }
        })
        console.log('✅ Updated song level to 5')
      }
      return existingSong.id
    }

    // Create the song in database with Level 5
    const newSong = await prisma.song.create({
      data: {
        title: track.title,
        artist: track.artist,
        album: track.album || '',
        spotifyId: track.spotifyId,
        spotifyUrl: track.spotifyUrl || '',
        previewUrl: spotifyTrack.preview_url || '',
        albumArt: albumArt,
        albumArtSmall: albumArtSmall,
        level: 5,
        levelName: 'Upper-Intermediate',
        language: 'es',
        popularity: 0,
        genres: 'Reggaeton, Latin Pop',
        isActive: true,
        hasLyrics: false,
        hasTranslations: false,
        synced: false,
        culturalContext: 'Contemporary reggaeton hit by Colombian superstar Karol G, featuring urban slang and modern Latin American expressions'
      }
    })

    console.log('✅ Song added to database with ID:', newSong.id)
    console.log('   Level: 5 (Upper-Intermediate)')

    // Create initial metrics
    await prisma.metrics.create({
      data: {
        songId: newSong.id,
        wordCount: 0,
        verbDensity: 0,
        difficultyScore: 5.0
      }
    })

    console.log('✅ Initial metrics created')
    console.log('\n📝 Next steps:')
    console.log(`   1. Run hydration: npm run hydrate ${newSong.id}`)
    console.log(`   2. The song will appear in Level 5`)

    return newSong.id
  } catch (error) {
    console.error('❌ Error adding song:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
addKarolGSong().then(songId => {
  if (songId) {
    console.log('\n✅ Script completed successfully!')
    console.log(`Song ID: ${songId}`)
  }
  process.exit(0)
})