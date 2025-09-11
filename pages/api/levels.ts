import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface LevelSummary {
  id: string
  title: string
  artist: string
  album?: string
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
  difficultyScore: number
  wordCount: number
  verbDensity: number
}

interface LevelResponse {
  levels: Record<string, LevelSummary[]>
  stats: {
    totalSongs: number
    averageDifficulty: number
    levelDistribution: Record<string, number>
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<LevelResponse | { error: string }>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch all songs with their metrics
    const songs = await prisma.song.findMany({
      include: {
        metrics: true
      },
      where: {
        level: {
          not: null
        }
      },
      orderBy: [
        { level: 'asc' },
        { metrics: { difficultyScore: 'asc' } }
      ]
    })

    // Group songs by level
    const levels: Record<string, LevelSummary[]> = {}
    const levelCounts: Record<string, number> = {}
    let totalDifficulty = 0

    // Initialize levels 1-10
    for (let i = 1; i <= 10; i++) {
      levels[i.toString()] = []
      levelCounts[i.toString()] = 0
    }

    // Process each song
    for (const song of songs) {
      if (!song.level || !song.metrics) continue

      const levelKey = song.level.toString()
      levelCounts[levelKey]++
      totalDifficulty += song.metrics.difficultyScore

      const summary: LevelSummary = {
        id: song.spotifyId || song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || undefined,
        spotifyUrl: song.spotifyUrl || undefined,
        previewUrl: song.previewUrl || undefined,
        albumArt: song.albumArt || undefined,
        albumArtSmall: song.albumArtSmall || undefined,
        difficultyScore: parseFloat(song.metrics.difficultyScore.toFixed(2)),
        wordCount: song.metrics.wordCount,
        verbDensity: parseFloat(song.metrics.verbDensity.toFixed(3))
      }

      levels[levelKey].push(summary)
    }

    // Calculate stats
    const stats = {
      totalSongs: songs.length,
      averageDifficulty: songs.length > 0 ? parseFloat((totalDifficulty / songs.length).toFixed(2)) : 0,
      levelDistribution: levelCounts
    }

    return res.status(200).json({
      levels,
      stats
    })

  } catch (error) {
    console.error('Levels API error:', error)
    return res.status(500).json({
      error: 'Failed to fetch levels',
    })
  } finally {
    await prisma.$disconnect()
  }
}