import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simplified version using a temporary in-memory store
// In production, this would be stored in the database with proper authentication
const savedSongs = new Set<string>()

// Check if a song is saved
export async function GET(
  request: Request,
  { params }: { params: { songId: string } }
) {
  try {
    // For now, always return false since we're using localStorage on the client
    // This endpoint is kept for future authentication implementation
    return NextResponse.json({ saved: false })
  } catch (error) {
    console.error('Error checking saved song:', error)
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

    // Add to saved songs (in production, this would be saved to database)
    savedSongs.add(params.songId)

    return NextResponse.json({
      success: true,
      savedSong: {
        songId: params.songId,
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error saving song:', error)
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
    // Remove from saved songs
    savedSongs.delete(params.songId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unsaving song:', error)
    return NextResponse.json(
      { error: 'Failed to unsave song' },
      { status: 500 }
    )
  }
}