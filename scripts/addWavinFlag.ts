#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function addWavinFlagSong() {
  console.log('🎵 Adding Wavin\' Flag (Coca-Cola Spanish Celebration Mix)')
  console.log('=' + '='.repeat(60))

  try {
    // First, get Spotify metadata
    const clientId = process.env.SPOTIFY_CLIENT_ID || '074c9198ca534a588df3b95c7eaf2e98'
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || 'b6911b7446704d61acdb47af4d2c2489'

    // Get Spotify token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials'
    })

    const tokenData = await tokenResponse.json()
    const token = tokenData.access_token

    // Search for the song
    const query = "Wavin' Flag K'NAAN David Bisbal"
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    const searchData = await searchResponse.json()
    const tracks = searchData.tracks?.items || []

    // Find the Spanish version
    const track = tracks.find(t =>
      t.name.toLowerCase().includes('wavin') &&
      t.name.toLowerCase().includes('flag') &&
      (t.name.toLowerCase().includes('spanish') ||
       t.name.toLowerCase().includes('celebration') ||
       t.artists.some(a => a.name.includes('Bisbal')))
    ) || tracks[0]

    if (!track) {
      console.log('❌ Could not find the song on Spotify')
      return
    }

    console.log(`✅ Found on Spotify: ${track.name} by ${track.artists.map(a => a.name).join(', ')}`)
    console.log(`   Album: ${track.album.name}`)
    console.log(`   Spotify ID: ${track.id}`)

    // Get audio features
    const featuresResponse = await fetch(
      `https://api.spotify.com/v1/audio-features/${track.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const audioFeatures = await featuresResponse.json()

    // Sample lyrics for this bilingual song (mix of English and Spanish)
    // This is a celebratory anthem with simple, repetitive lyrics
    const sampleLyrics = `
Oh-oh-oh-oh-oh
Oh-oh-oh-oh-oh
Oh-oh-oh-oh-oh
Oh-oh-oh-oh-oh

Give me freedom, give me fire
Dame razón, dame tu ira
Give me reason, take me higher
See the champions take the field now

You define us, make us feel proud
En las calles, muchas manos
Levantadas celebrando
Una fiesta sin descanso

When I get older, I will be stronger
They'll call me freedom
Just like a wavin' flag
And then it goes back
And then it goes back
And then it goes back
And then it goes

Cuando sea grande, quiero ser estrella
Ser una gran estrella mundial
Que brille en el firmamento
Como brilla el sol por la mañana
`

    // Analyze the lyrics
    const lyricsLines = sampleLyrics.trim().split('\n').filter(line => line.trim())

    // This song mixes English and Spanish, has repetitive structure
    // Good for intermediate level (Level 4)
    const level = 4

    // Check if song already exists
    const existingSong = await prisma.song.findFirst({
      where: {
        title: { contains: "Wavin' Flag" },
        artist: { contains: "K'NAAN" }
      }
    })

    if (existingSong) {
      console.log('⚠️  Song already exists in database')
      return
    }

    // Create the song record
    const song = await prisma.song.create({
      data: {
        title: "Wavin' Flag (Coca-Cola Spanish Celebration Mix)",
        artist: "K'NAAN & David Bisbal",
        album: track.album.name,
        year: 2010, // World Cup 2010 anthem
        spotifyId: track.id,
        spotifyUrl: track.external_urls.spotify,
        previewUrl: track.preview_url,
        albumArt: track.album.images[0]?.url,
        albumArtSmall: track.album.images[track.album.images.length - 1]?.url,
        popularity: track.popularity,
        danceability: audioFeatures.danceability,
        energy: audioFeatures.energy,
        valence: audioFeatures.valence,
        tempo: audioFeatures.tempo,
        lyricsRaw: JSON.stringify({ lines: lyricsLines }),
        lyricsProvider: 'manual',
        level: level,
        isActive: true,
        culturalContext: "Bilingual World Cup 2010 anthem celebrating unity and freedom. Mixes English and Spanish, representing global celebration and Latin American passion for football.",
        order: 1000 // Add at end of level
      }
    })

    console.log(`\n✅ Successfully added "${song.title}" to Level ${level}`)
    console.log(`   Bilingual: Yes (English/Spanish mix)`)

  } catch (error) {
    console.error('❌ Error adding song:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  addWavinFlagSong()
}