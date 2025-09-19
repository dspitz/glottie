import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const songs = await prisma.song.findMany({
      where: {
        isActive: true,
        level: { not: null }
      },
      select: {
        id: true,
        title: true,
        artist: true,
        level: true,
        albumArt: true,
        albumArtSmall: true,
        previewUrl: true,
        spotifyId: true,
        spotifyUrl: true,
        genres: true,
        metrics: {
          select: {
            wordCount: true,
            verbDensity: true,
            difficultyScore: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { title: 'asc' }
      ]
    })

    // Group songs by level
    const levels: Record<string, any[]> = {}
    songs.forEach(song => {
      if (song.level) {
        const levelKey = song.level.toString()
        if (!levels[levelKey]) {
          levels[levelKey] = []
        }
        levels[levelKey].push(song)
      }
    })

    // Calculate stats
    const totalSongs = songs.length
    const averageDifficulty = songs.length > 0 
      ? songs.reduce((sum, song) => sum + (song.level || 0), 0) / songs.length 
      : 0

    return NextResponse.json({
      levels,
      stats: {
        totalSongs,
        averageDifficulty
      }
    })
  } catch (error) {
    console.error('Error fetching levels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch levels' },
      { status: 500 }
    )
  }
}