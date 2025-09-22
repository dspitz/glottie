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
        song: {
          select: {
            id: true,
            title: true,
            artist: true,
            album: true,
            albumArt: true,
            albumArtSmall: true,
            level: true,
            levelName: true,
            difficultyScore: true,
            spotifyUrl: true,
            genres: true,
            popularity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform the response to just return the songs
    const songs = savedSongs.map(saved => ({
      ...saved.song,
      savedAt: saved.createdAt
    }))

    return NextResponse.json(songs)
  } catch (error) {
    console.error('Error fetching saved songs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved songs' },
      { status: 500 }
    )
  }
}