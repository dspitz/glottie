import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/bookmarks/lines - Get all bookmarked lines for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language') || 'es'

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

    // Get bookmarked lines for the user filtered by language
    const bookmarkedLines = await prisma.bookmarkedLine.findMany({
      where: {
        userId: user.id,
        song: {
          language: language
        }
      },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            artist: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform the response
    const lines = bookmarkedLines.map(bookmark => ({
      id: bookmark.id,
      songId: bookmark.songId,
      songTitle: bookmark.song.title,
      songArtist: bookmark.song.artist,
      lineText: bookmark.lineText,
      lineTranslation: bookmark.lineTranslation,
      lineIndex: bookmark.lineIndex,
      bookmarkedAt: bookmark.createdAt.toISOString()
    }))

    return NextResponse.json(lines)
  } catch (error) {
    // console.error('Error fetching bookmarked lines:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarked lines' },
      { status: 500 }
    )
  }
}

// POST /api/bookmarks/lines - Create a new bookmarked line
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      // Return success but don't save to database
      // User will use localStorage instead
      return NextResponse.json({ success: true })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    const body = await request.json()
    const { songId, lineText, lineTranslation, lineIndex } = body

    if (!songId || !lineText || lineIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the bookmarked line
    const bookmarkedLine = await prisma.bookmarkedLine.create({
      data: {
        userId: user.id,
        songId,
        lineText,
        lineTranslation: lineTranslation || null,
        lineIndex
      }
    })

    return NextResponse.json({
      id: bookmarkedLine.id,
      success: true
    })
  } catch (error) {
    // console.error('Error creating bookmarked line:', error)
    return NextResponse.json(
      { error: 'Failed to create bookmarked line' },
      { status: 500 }
    )
  }
}
