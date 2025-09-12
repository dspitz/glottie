import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    if (!song.lyricsRaw) {
      // Return a message indicating no lyrics available
      return NextResponse.json({
        lyrics: null,
        message: 'Lyrics not available for this song',
        song: {
          id: song.id,
          title: song.title,
          artist: song.artist,
          level: song.level
        },
        // Also provide the data at the top level for backwards compatibility
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
        genres: song.genres
      })
    }

    // Parse the lyrics if they're stored as JSON
    let parsedLyrics = song.lyricsRaw
    try {
      if (typeof song.lyricsRaw === 'string') {
        parsedLyrics = JSON.parse(song.lyricsRaw)
      }
    } catch (e) {
      // If parsing fails, treat as plain text
      parsedLyrics = { text: song.lyricsRaw }
    }

    return NextResponse.json({
      lyrics: parsedLyrics,
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        level: song.level
      },
      // Also provide the data at the top level for backwards compatibility
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
      genres: song.genres
    })
  } catch (error) {
    console.error('Error fetching lyrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lyrics' },
      { status: 500 }
    )
  }
}