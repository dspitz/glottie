import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { analyzeLine } from '@/packages/core/morphology'
import { computeDifficulty, assignLevel } from '@/packages/core/scoring'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { trackId, recompute } = req.query

    if (!trackId || typeof trackId !== 'string') {
      return res.status(400).json({ error: 'Track ID is required' })
    }

    // Find the song
    const song = await prisma.song.findUnique({
      where: { spotifyId: trackId },
      include: { metrics: true }
    })

    if (!song) {
      return res.status(404).json({
        error: 'Song not found',
        trackId
      })
    }

    // Return existing metrics if available and not recomputing
    if (song.metrics && recompute !== 'true') {
      return res.status(200).json({
        trackId,
        title: song.title,
        artist: song.artist,
        level: song.level,
        metrics: {
          wordCount: song.metrics.wordCount,
          uniqueWordCount: song.metrics.uniqueWordCount,
          typeTokenRatio: song.metrics.typeTokenRatio,
          avgWordFreqZipf: song.metrics.avgWordFreqZipf,
          verbDensity: song.metrics.verbDensity,
          tenseWeights: song.metrics.tenseWeights,
          idiomCount: song.metrics.idiomCount,
          punctComplexity: song.metrics.punctComplexity,
          difficultyScore: song.metrics.difficultyScore
        },
        mode: 'cached'
      })
    }

    // Need to compute or recompute metrics
    let parsedLines

    // Check if we have parsed lyrics
    if (song.lyricsParsed && typeof song.lyricsParsed === 'string') {
      try {
        parsedLines = JSON.parse(song.lyricsParsed)
      } catch (e) {
        parsedLines = null
      }
    } else if (song.lyricsRaw) {
      // Parse from raw lyrics
      const lines = song.lyricsRaw.split('\n').filter(line => line.trim().length > 0)
      parsedLines = lines.map((line, index) => analyzeLine(line, index))
    } else {
      return res.status(400).json({
        error: 'No lyrics available for scoring',
        trackId,
        suggestion: 'Fetch lyrics first using the /api/lyrics endpoint'
      })
    }

    // Compute difficulty
    const { metrics, difficultyScore } = computeDifficulty(parsedLines)
    const level = assignLevel(difficultyScore)

    // Update or create metrics in database
    const updatedSong = await prisma.song.update({
      where: { id: song.id },
      data: {
        level: level,
        lyricsParsed: JSON.stringify(parsedLines),
        metrics: {
          upsert: {
            create: {
              wordCount: metrics.wordCount,
              uniqueWordCount: metrics.uniqueWordCount,
              typeTokenRatio: metrics.typeTokenRatio,
              avgWordFreqZipf: metrics.avgWordFreqZipf,
              verbDensity: metrics.verbDensity,
              tenseWeights: metrics.tenseWeights,
              idiomCount: metrics.idiomCount,
              punctComplexity: metrics.punctComplexity,
              difficultyScore: difficultyScore,
            },
            update: {
              wordCount: metrics.wordCount,
              uniqueWordCount: metrics.uniqueWordCount,
              typeTokenRatio: metrics.typeTokenRatio,
              avgWordFreqZipf: metrics.avgWordFreqZipf,
              verbDensity: metrics.verbDensity,
              tenseWeights: metrics.tenseWeights,
              idiomCount: metrics.idiomCount,
              punctComplexity: metrics.punctComplexity,
              difficultyScore: difficultyScore,
            }
          }
        }
      },
      include: { metrics: true }
    })

    return res.status(200).json({
      trackId,
      title: updatedSong.title,
      artist: updatedSong.artist,
      level: updatedSong.level,
      metrics: {
        wordCount: metrics.wordCount,
        uniqueWordCount: metrics.uniqueWordCount,
        typeTokenRatio: metrics.typeTokenRatio,
        avgWordFreqZipf: metrics.avgWordFreqZipf,
        verbDensity: metrics.verbDensity,
        tenseWeights: metrics.tenseWeights,
        idiomCount: metrics.idiomCount,
        punctComplexity: metrics.punctComplexity,
        difficultyScore: difficultyScore
      },
      mode: recompute === 'true' ? 'recomputed' : 'computed'
    })

  } catch (error) {
    console.error('Score API error:', error)
    return res.status(500).json({
      error: 'Failed to compute difficulty score',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}