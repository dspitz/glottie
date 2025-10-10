import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Check if a song is saved
export async function GET(
  request: Request,
  { params }: { params: { songId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      // Return false for unauthenticated users (they use localStorage)
      return NextResponse.json({ saved: false })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ saved: false })
    }

    // Check if song is saved in database
    const savedSong = await prisma.savedSong.findUnique({
      where: {
        userId_songId: {
          userId: user.id,
          songId: params.songId
        }
      }
    })

    return NextResponse.json({ saved: !!savedSong })
  } catch (error) {
    // console.error('Error checking saved song:', error)
    return NextResponse.json(
      { error: 'Failed to check saved song' },
      { status: 500 }
    )
  }
}

// Save a song
export async function POST(
  request: Request,
  { params }: { params: { songId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      // Return success but don't save to database
      // Unauthenticated users will use localStorage
      return NextResponse.json({ success: true })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Check if song exists
    const song = await prisma.song.findUnique({
      where: { id: params.songId }
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    // Create saved song (upsert to handle duplicates)
    const savedSong = await prisma.savedSong.upsert({
      where: {
        userId_songId: {
          userId: user.id,
          songId: params.songId
        }
      },
      update: {},
      create: {
        userId: user.id,
        songId: params.songId
      }
    })

    return NextResponse.json({
      success: true,
      savedSong: {
        songId: savedSong.songId,
        createdAt: savedSong.createdAt.toISOString()
      }
    })
  } catch (error) {
    // console.error('Error saving song:', error)
    return NextResponse.json(
      { error: 'Failed to save song' },
      { status: 500 }
    )
  }
}

// Unsave a song
export async function DELETE(
  request: Request,
  { params }: { params: { songId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      // Return success but don't delete from database
      // Unauthenticated users will use localStorage
      return NextResponse.json({ success: true })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Delete saved song
    await prisma.savedSong.deleteMany({
      where: {
        userId: user.id,
        songId: params.songId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Error unsaving song:', error)
    return NextResponse.json(
      { error: 'Failed to unsave song' },
      { status: 500 }
    )
  }
}