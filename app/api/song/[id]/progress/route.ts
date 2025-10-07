import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { playProgress } = body

    if (typeof playProgress !== 'number' || playProgress < 0 || playProgress > 100) {
      return NextResponse.json(
        { error: 'Invalid playProgress value (must be 0-100)' },
        { status: 400 }
      )
    }

    const songId = params.id

    // Verify song exists
    const song = await prisma.song.findUnique({
      where: { id: songId }
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    // Auto-complete if progress >= 90%
    const isCompleted = playProgress >= 90

    // Upsert song progress
    const progress = await prisma.songProgress.upsert({
      where: {
        userId_songId: {
          userId: user.id,
          songId: songId
        }
      },
      update: {
        playProgress,
        lastPlayedAt: new Date(),
        completed: isCompleted || undefined, // Only update if true
        completedAt: isCompleted ? new Date() : undefined
      },
      create: {
        userId: user.id,
        songId: songId,
        playProgress,
        lastPlayedAt: new Date(),
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    })

    return NextResponse.json({
      success: true,
      progress: {
        playProgress: progress.playProgress,
        completed: progress.completed,
        lastPlayedAt: progress.lastPlayedAt
      }
    })
  } catch (error) {
    console.error('Error updating song progress:', error)
    return NextResponse.json(
      { error: 'Failed to update song progress' },
      { status: 500 }
    )
  }
}
