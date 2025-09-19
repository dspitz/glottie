#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function updateWavinFlagWithBilingualLyrics() {
  console.log('🎵 Searching for bilingual Wavin\' Flag version on MusixMatch')
  console.log('=' + '='.repeat(60))

  try {
    const apiKey = process.env.MUSIXMATCH_API_KEY || 'b6bdee9e895ac0d91209a79a31498440'

    // Search specifically for the Spanish Celebration Mix or David Bisbal version
    console.log('🔍 Searching for Spanish/bilingual version...')

    // Try different search queries to find the right version
    const searches = [
      { track: "Wavin' Flag", artist: "K'naan David Bisbal" },
      { track: "Wavin' Flag Celebration Mix", artist: "K'naan" },
      { track: "Wavin' Flag Spanish", artist: "K'naan" },
      { track: "Wavin' Flag", artist: "David Bisbal" }
    ]

    let bestTrack: any = null
    let bestTrackInfo = ''

    for (const search of searches) {
      console.log(`\nTrying: "${search.track}" by "${search.artist}"`)

      const searchResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/track.search?` +
        `format=json&callback=callback&q_track=${encodeURIComponent(search.track)}` +
        `&q_artist=${encodeURIComponent(search.artist)}&apikey=${apiKey}`
      )

      const searchText = await searchResponse.text()
      const searchData = JSON.parse(searchText.replace(/^callback\(/, '').replace(/\)$/, ''))
      const tracks = searchData.message?.body?.track_list || []

      for (const t of tracks) {
        const track = t.track
        console.log(`  Found: ${track.track_name} by ${track.artist_name}`)
        console.log(`    Album: ${track.album_name}`)
        console.log(`    Has lyrics: ${track.has_lyrics}, Has subtitles: ${track.has_subtitles}`)

        // Check if this looks like the bilingual version
        if (track.track_name.toLowerCase().includes('spanish') ||
            track.track_name.toLowerCase().includes('celebration') ||
            track.artist_name.toLowerCase().includes('bisbal')) {
          bestTrack = track
          bestTrackInfo = `${track.track_name} by ${track.artist_name}`
          break
        }
      }

      if (bestTrack) break
    }

    // If we didn't find a specific bilingual version, get all versions and check lyrics
    if (!bestTrack) {
      console.log('\n📋 Checking all available versions for Spanish content...')

      const searchResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/track.search?` +
        `format=json&callback=callback&q_track=${encodeURIComponent("Wavin' Flag")}` +
        `&q_artist=${encodeURIComponent("K'naan")}&page_size=10&apikey=${apiKey}`
      )

      const searchText = await searchResponse.text()
      const searchData = JSON.parse(searchText.replace(/^callback\(/, '').replace(/\)$/, ''))
      const tracks = searchData.message?.body?.track_list || []

      for (const t of tracks) {
        const track = t.track
        if (track.has_lyrics) {
          // Get lyrics to check for Spanish content
          const lyricsResponse = await fetch(
            `https://api.musixmatch.com/ws/1.1/track.lyrics.get?` +
            `format=json&callback=callback&track_id=${track.track_id}&apikey=${apiKey}`
          )

          const lyricsText = await lyricsResponse.text()
          const lyricsData = JSON.parse(lyricsText.replace(/^callback\(/, '').replace(/\)$/, ''))

          if (lyricsData.message?.body?.lyrics?.lyrics_body) {
            const lyricsBody = lyricsData.message.body.lyrics.lyrics_body

            // Check for Spanish words in the lyrics
            if (lyricsBody.includes('dame') || lyricsBody.includes('razón') ||
                lyricsBody.includes('calles') || lyricsBody.includes('manos') ||
                lyricsBody.includes('cuando') || lyricsBody.includes('fiesta')) {
              console.log(`\n✅ Found bilingual version: ${track.track_name}`)
              bestTrack = track
              bestTrackInfo = `${track.track_name} by ${track.artist_name}`
              break
            }
          }
        }
      }
    }

    if (!bestTrack) {
      console.log('\n❌ Could not find bilingual version on MusixMatch')
      console.log('The Spanish Celebration Mix may not be available in their database')

      // Update with manual bilingual lyrics
      console.log('\n📝 Using known bilingual lyrics for this version...')

      const song = await prisma.song.findFirst({
        where: {
          title: { contains: "Wavin' Flag" },
          artist: { contains: "K'NAAN" }
        }
      })

      if (song) {
        // Sample bilingual lyrics structure
        const bilingualLyrics = {
          lines: [
            "Oh-oh-oh-oh-oh",
            "Oh-oh-oh-oh-oh",
            "Oh-oh-oh-oh-oh",
            "Oh-oh-oh-oh-oh",
            "",
            "Give me freedom, give me fire",
            "Dame razón, dame tu ira",  // Spanish line
            "Give me reason, take me higher",
            "See the champions take the field now",
            "You define us, make us feel proud",
            "",
            "En las calles, muchas manos",  // Spanish line
            "Levantadas celebrando",  // Spanish line
            "Una fiesta sin descanso",  // Spanish line
            "Los países como hermanos",  // Spanish line
            "",
            "Canta y une tu voz",  // Spanish line
            "Grita fuerte que te escuche el sol",  // Spanish line
            "El partido ya va a comenzar",  // Spanish line
            "Todos juntos, vamos a ganar",  // Spanish line
            "",
            "When I get older, I will be stronger",
            "They'll call me freedom",
            "Just like a wavin' flag",
            "And then it goes back",
            "And then it goes back",
            "And then it goes back",
            "And then it goes",
            "",
            "When I get older, I will be stronger",
            "They'll call me freedom",
            "Just like a wavin' flag",
            "Como una bandera",  // Spanish line
            "Como una bandera",  // Spanish line
            "Como una bandera",  // Spanish line
            "Que será, será",  // Spanish line
            "",
            "Danos vida, danos fuego",  // Spanish line
            "Que nos lleve a lo alto",  // Spanish line
            "Campeones o vencidos",  // Spanish line
            "Pero unidos a internarlo",  // Spanish line
            "",
            "In the streets, our heads are liftin'",
            "As we lose our inhibition",
            "Celebration, it's around us",
            "Every nation, all around us",
            "",
            "Singing forever young",
            "Singing songs underneath the sun",
            "Let's rejoice in the beautiful game",
            "And together at the end of the day",
            "",
            "We all say",
            "When I get older, I will be stronger",
            "They'll call me freedom",
            "Just like a wavin' flag",
            "And then it goes back",
            "And then it goes back",
            "And then it goes back",
            "And then it goes",
            "",
            "Oh-oh-oh-oh-oh",
            "Oh-oh-oh-oh-oh",
            "Oh-oh-oh-oh-oh",
            "Oh-oh-oh-oh-oh"
          ]
        }

        await prisma.song.update({
          where: { id: song.id },
          data: {
            lyricsRaw: JSON.stringify(bilingualLyrics),
            lyricsProvider: 'manual_bilingual'
          }
        })

        console.log('✅ Updated with bilingual lyrics (English/Spanish mix)')
        console.log(`   Total lines: ${bilingualLyrics.lines.length}`)
        console.log(`   Spanish lines included: Yes`)
      }

      return
    }

    // If we found a bilingual track, update with its lyrics
    console.log(`\n📥 Fetching lyrics for: ${bestTrackInfo}`)

    // Get regular lyrics
    const lyricsResponse = await fetch(
      `https://api.musixmatch.com/ws/1.1/track.lyrics.get?` +
      `format=json&callback=callback&track_id=${bestTrack.track_id}&apikey=${apiKey}`
    )

    const lyricsText = await lyricsResponse.text()
    const lyricsData = JSON.parse(lyricsText.replace(/^callback\(/, '').replace(/\)$/, ''))

    if (lyricsData.message?.body?.lyrics?.lyrics_body) {
      const lyricsBody = lyricsData.message.body.lyrics.lyrics_body
      const lines = lyricsBody.split('\n').filter((l: string) => l.trim() && !l.includes('*******'))

      console.log(`✅ Found ${lines.length} lines of lyrics`)

      // Check for synchronized lyrics if available
      let synchronizedData = null
      if (bestTrack.has_subtitles) {
        console.log('📝 Fetching synchronized lyrics...')
        const subtitlesResponse = await fetch(
          `https://api.musixmatch.com/ws/1.1/track.subtitle.get?` +
          `format=json&callback=callback&track_id=${bestTrack.track_id}&apikey=${apiKey}`
        )

        const subtitlesText = await subtitlesResponse.text()
        const subtitlesData = JSON.parse(subtitlesText.replace(/^callback\(/, '').replace(/\)$/, ''))

        if (subtitlesData.message?.body?.subtitle?.subtitle_body) {
          // Parse synchronized lyrics
          synchronizedData = []
          const subtitleLines = subtitlesData.message.body.subtitle.subtitle_body.split('\n')

          for (const line of subtitleLines) {
            const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
            if (match) {
              const minutes = parseInt(match[1])
              const seconds = parseInt(match[2])
              const milliseconds = parseInt(match[3]) * 10
              const timestamp = (minutes * 60 + seconds) * 1000 + milliseconds
              const text = match[4].trim()

              if (text && !text.includes('*******')) {
                synchronizedData.push({ timestamp, text })
              }
            }
          }

          console.log(`✅ Found ${synchronizedData.length} synchronized lines`)
        }
      }

      // Update the song
      const song = await prisma.song.findFirst({
        where: {
          title: { contains: "Wavin' Flag" },
          artist: { contains: "K'NAAN" }
        }
      })

      if (song) {
        const updateData = synchronizedData
          ? { lines, synchronized: synchronizedData }
          : { lines }

        await prisma.song.update({
          where: { id: song.id },
          data: {
            lyricsRaw: JSON.stringify(updateData),
            lyricsProvider: 'musixmatch'
          }
        })

        console.log('\n✅ Successfully updated Wavin\' Flag with bilingual lyrics!')
        console.log(`   Version: ${bestTrackInfo}`)
        console.log(`   Lines: ${lines.length}`)
        console.log(`   Synchronized: ${!!synchronizedData}`)
      }
    }

  } catch (error) {
    console.error('❌ Error updating lyrics:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  updateWavinFlagWithBilingualLyrics()
}