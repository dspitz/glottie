import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { songId, rating } = await request.json()

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }

    if (rating !== null && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: { devRating: rating },
    })

    return NextResponse.json({
      success: true,
      devRating: updatedSong.devRating
    })
  } catch (error) {
    console.error('Error updating dev rating:', error)
    return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 })
  }
}