#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function updateWavinFlagLyrics() {
  console.log('🎵 Updating Wavin\' Flag with synchronized lyrics from Musixmatch')
  console.log('=' + '='.repeat(60))

  try {
    // Find the song we just added
    const song = await prisma.song.findFirst({
      where: {
        title: { contains: "Wavin' Flag" },
        artist: { contains: "K'NAAN" }
      }
    })

    if (!song) {
      console.log('❌ Wavin\' Flag song not found in database')
      return
    }

    console.log(`✅ Found song: ${song.title} (ID: ${song.id})`)

    // Get Musixmatch API key
    const apiKey = process.env.MUSIXMATCH_API_KEY || 'b6bdee9e895ac0d91209a79a31498440'

    // Search for the track on Musixmatch
    console.log('🔍 Searching Musixmatch for synchronized lyrics...')
    const searchResponse = await fetch(
      `https://api.musixmatch.com/ws/1.1/track.search?` +
      `format=json&callback=callback&q_track=${encodeURIComponent("Wavin' Flag")}` +
      `&q_artist=${encodeURIComponent("K'NAAN")}&apikey=${apiKey}`
    )

    const searchText = await searchResponse.text()
    const searchData = JSON.parse(searchText.replace(/^callback\(/, '').replace(/\)$/, ''))
    const tracks = searchData.message?.body?.track_list || []

    // Find the Coca-Cola version or any version with subtitles
    let track = tracks.find((t: any) =>
      t.track.track_name.toLowerCase().includes('wavin') &&
      t.track.has_subtitles === 1
    )

    if (!track) {
      // Try to find any version with lyrics
      track = tracks.find((t: any) =>
        t.track.track_name.toLowerCase().includes('wavin') &&
        t.track.has_lyrics === 1
      )
    }

    if (!track) {
      track = tracks[0]
    }

    if (!track) {
      console.log('❌ Could not find track on Musixmatch')
      return
    }

    const musixmatchTrack = track.track
    console.log(`✅ Found on Musixmatch: ${musixmatchTrack.track_name}`)
    console.log(`   Track ID: ${musixmatchTrack.track_id}`)
    console.log(`   Has lyrics: ${musixmatchTrack.has_lyrics}`)
    console.log(`   Has subtitles: ${musixmatchTrack.has_subtitles}`)

    // Try to get synchronized lyrics (subtitles)
    if (musixmatchTrack.has_subtitles) {
      console.log('📝 Fetching synchronized lyrics...')
      const subtitlesResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/track.subtitle.get?` +
        `format=json&callback=callback&track_id=${musixmatchTrack.track_id}&apikey=${apiKey}`
      )

      const subtitlesText = await subtitlesResponse.text()
      const subtitlesData = JSON.parse(subtitlesText.replace(/^callback\(/, '').replace(/\)$/, ''))

      if (subtitlesData.message?.body?.subtitle?.subtitle_body) {
        const subtitleBody = subtitlesData.message.body.subtitle.subtitle_body

        // Parse the subtitle format (usually in LRC or similar format)
        const lines = subtitleBody.split('\n').filter((l: string) => l.trim())
        const synchronizedLines = []

        for (const line of lines) {
          // Parse timestamp format like [00:12.34] or similar
          const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
          if (match) {
            const minutes = parseInt(match[1])
            const seconds = parseInt(match[2])
            const milliseconds = parseInt(match[3]) * 10
            const timestamp = (minutes * 60 + seconds) * 1000 + milliseconds
            const text = match[4].trim()

            if (text && !text.includes('*******')) {
              synchronizedLines.push({
                timestamp,
                text
              })
            }
          }
        }

        if (synchronizedLines.length > 0) {
          console.log(`✅ Found ${synchronizedLines.length} synchronized lines`)

          // Update the song with synchronized lyrics
          await prisma.song.update({
            where: { id: song.id },
            data: {
              lyricsRaw: JSON.stringify({
                lines: synchronizedLines.map(l => l.text),
                synchronized: synchronizedLines
              }),
              lyricsProvider: 'musixmatch'
            }
          })

          console.log('✅ Updated song with synchronized lyrics')
        }
      }
    }

    // If no synchronized lyrics, try regular lyrics
    if (!musixmatchTrack.has_subtitles && musixmatchTrack.has_lyrics) {
      console.log('📝 No synchronized lyrics, fetching regular lyrics...')
      const lyricsResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/track.lyrics.get?` +
        `format=json&callback=callback&track_id=${musixmatchTrack.track_id}&apikey=${apiKey}`
      )

      const lyricsText = await lyricsResponse.text()
      const lyricsData = JSON.parse(lyricsText.replace(/^callback\(/, '').replace(/\)$/, ''))

      if (lyricsData.message?.body?.lyrics?.lyrics_body) {
        const lyricsBody = lyricsData.message.body.lyrics.lyrics_body
        const lines = lyricsBody.split('\n').filter((l: string) => l.trim() && !l.includes('*******'))

        console.log(`✅ Found ${lines.length} lines of lyrics`)

        // Update with regular lyrics
        await prisma.song.update({
          where: { id: song.id },
          data: {
            lyricsRaw: JSON.stringify({ lines }),
            lyricsProvider: 'musixmatch'
          }
        })

        console.log('✅ Updated song with regular lyrics')
      }
    }

    console.log('\n📊 Song updated successfully!')

  } catch (error) {
    console.error('❌ Error updating lyrics:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  updateWavinFlagLyrics()
}