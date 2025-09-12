import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLyricsByTrack } from '@/packages/adapters/lyricsProvider'

export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const trackId = params.trackId

    const song = await prisma.song.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        spotifyId: true,
        spotifyUrl: true,
        previewUrl: true,
        albumArt: true,
        albumArtSmall: true,
        lyricsRaw: true,
        lyricsProvider: true,
        lyricsLicensed: true,
        level: true,
        popularity: true,
        genres: true
      }
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    let lyricsData: any = null
    let lyricsLines: string[] = []

    // If we don't have lyrics yet, try to fetch them
    if (!song.lyricsRaw) {
      console.log(`🎵 Fetching lyrics for "${song.title}" by ${song.artist}`)
      
      try {
        const lyricsResult = await getLyricsByTrack(song.artist, song.title)
        
        if (lyricsResult.lines.length > 0) {
          console.log(`✅ Found lyrics using ${lyricsResult.provider} provider`)
          
          // Store the lyrics in the database for future use
          await prisma.song.update({
            where: { id: song.id },
            data: {
              lyricsRaw: JSON.stringify(lyricsResult),
              lyricsProvider: lyricsResult.provider,
              lyricsLicensed: lyricsResult.licensed
            }
          })
          
          lyricsLines = lyricsResult.lines
          lyricsData = {
            lines: lyricsResult.lines,
            provider: lyricsResult.provider,
            licensed: lyricsResult.licensed,
            isExcerpt: lyricsResult.isExcerpt,
            attribution: lyricsResult.attribution,
            culturalContext: lyricsResult.culturalContext,
            translations: lyricsResult.translations
          }
        } else {
          console.log(`⚠️ No lyrics found: ${lyricsResult.error || 'No lyrics available'}`)
        }
        
      } catch (error) {
        console.error('Error fetching lyrics from provider:', error)
      }
    } else {
      // Parse existing lyrics from database
      try {
        const parsedLyrics = JSON.parse(song.lyricsRaw)
        lyricsLines = parsedLyrics.lines || []
        lyricsData = parsedLyrics
      } catch (e) {
        // If parsing fails, treat as plain text and split into lines
        lyricsLines = song.lyricsRaw.split('\n').filter(line => line.trim().length > 0)
        lyricsData = {
          lines: lyricsLines,
          provider: song.lyricsProvider || 'unknown',
          licensed: song.lyricsLicensed || false
        }
      }
    }

    return NextResponse.json({
      // Core response data
      trackId: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      spotifyId: song.spotifyId,
      spotifyUrl: song.spotifyUrl,
      previewUrl: song.previewUrl,
      albumArt: song.albumArt,
      albumArtSmall: song.albumArtSmall,
      level: song.level,
      popularity: song.popularity,
      genres: song.genres,
      
      // Lyrics data
      lines: lyricsLines,
      lyrics: lyricsData,
      lyricsProvider: lyricsData?.provider,
      lyricsLicensed: lyricsData?.licensed,
      attribution: lyricsData?.attribution,
      culturalContext: lyricsData?.culturalContext,
      translations: lyricsData?.translations,
      
      // Legacy compatibility
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        level: song.level
      }
    })
  } catch (error) {
    console.error('Error fetching lyrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lyrics' },
      { status: 500 }
    )
  }
}