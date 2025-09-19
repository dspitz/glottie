import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userRating, hasLyrics, hasTranslations, synced } = body
    const songId = params.id

    console.log('Feedback API: Received request', {
      songId,
      body,
      userRating,
      hasLyrics,
      hasTranslations,
      synced
    })

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }

    // Validate rating if provided
    if (userRating !== undefined && userRating !== null && (userRating < 1 || userRating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Build update data object with only provided fields
    const updateData: any = {}
    if (userRating !== undefined) updateData.userRating = userRating
    if (hasLyrics !== undefined) updateData.hasLyrics = hasLyrics
    if (hasTranslations !== undefined) updateData.hasTranslations = hasTranslations
    if (synced !== undefined) updateData.synced = synced

    console.log('Feedback API: Updating with data', updateData)

    // Update song with provided feedback
    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: updateData,
      select: {
        id: true,
        userRating: true,
        hasLyrics: true,
        hasTranslations: true,
        synced: true
      }
    })

    console.log('Feedback API: Update successful', updatedSong)

    return NextResponse.json({
      success: true,
      feedback: {
        userRating: updatedSong.userRating,
        hasLyrics: updatedSong.hasLyrics,
        hasTranslations: updatedSong.hasTranslations,
        synced: updatedSong.synced
      }
    })
  } catch (error) {
    console.error('Error updating song feedback:', error)
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}