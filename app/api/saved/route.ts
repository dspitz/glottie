import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      // Return empty array for unauthenticated users
      // They will use localStorage instead
      return NextResponse.json([])
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json([])
    }

    // Get saved songs for the user
    const savedSongs = await prisma.savedSong.findMany({
      where: { userId: user.id },
      include: {
        song: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform the response to just return the songs with only needed fields
    const songs = savedSongs.map(saved => ({
      id: saved.song.id,
      title: saved.song.title,
      artist: saved.song.artist,
      album: saved.song.album,
      albumArt: saved.song.albumArt,
      albumArtSmall: saved.song.albumArtSmall,
      level: saved.song.level,
      levelName: saved.song.levelName,
      difficultyScore: saved.song.difficultyScore,
      spotifyUrl: saved.song.spotifyUrl,
      genres: saved.song.genres,
      popularity: saved.song.popularity,
      language: saved.song.language,
      savedAt: saved.createdAt
    }))

    return NextResponse.json(songs)
  } catch (error) {
    console.error('Error fetching saved songs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved songs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}