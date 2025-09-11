import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { getLyricsByTrack } from '@/packages/adapters/lyricsProvider'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { trackId } = req.query

    if (!trackId || typeof trackId !== 'string') {
      return res.status(400).json({ error: 'Track ID is required' })
    }

    // Check if song exists in database
    const dbSong = await prisma.song.findUnique({
      where: { spotifyId: trackId },
      include: {
        metrics: true
      }
    })

    if (dbSong && dbSong.lyricsRaw) {
      // Return cached lyrics from database
      const lines = dbSong.lyricsRaw.split('\n').filter(line => line.trim().length > 0)
      
      // Get any existing translations from database
      const existingTranslations = await prisma.translation.findMany({
        where: { songId: dbSong.id }
      })
      
      const translations: { [targetLang: string]: string[] } = {}
      existingTranslations.forEach(translation => {
        if (translation.lyricsLines) {
          try {
            translations[translation.targetLang] = JSON.parse(translation.lyricsLines)
          } catch (error) {
            console.warn(`Failed to parse translations for ${translation.targetLang}:`, error)
          }
        }
      })
      
      return res.status(200).json({
        trackId,
        artist: dbSong.artist,
        title: dbSong.title,
        album: dbSong.album,
        spotifyUrl: dbSong.spotifyUrl,
        previewUrl: dbSong.previewUrl,
        albumArt: dbSong.albumArt,
        albumArtSmall: dbSong.albumArtSmall,
        level: dbSong.level,
        difficultyScore: dbSong.metrics?.difficultyScore,
        metrics: dbSong.metrics,
        lines,
        translations,
        licensed: true,
        provider: 'database',
        mode: 'cached'
      })
    }

    // If song exists but no lyrics, try to fetch them
    if (dbSong) {
      try {
        const lyricsResult = await getLyricsByTrack(dbSong.artist, dbSong.title)
        
        // Cache lyrics in database if they're licensed
        if (lyricsResult.licensed && lyricsResult.raw) {
          await prisma.song.update({
            where: { id: dbSong.id },
            data: { lyricsRaw: lyricsResult.raw }
          })
        }

        return res.status(200).json({
          trackId,
          artist: dbSong.artist,
          title: dbSong.title,
          album: dbSong.album,
          spotifyUrl: dbSong.spotifyUrl,
          previewUrl: dbSong.previewUrl,
          albumArt: dbSong.albumArt,
          albumArtSmall: dbSong.albumArtSmall,
          level: dbSong.level,
          difficultyScore: dbSong.metrics?.difficultyScore,
          metrics: dbSong.metrics,
          lines: lyricsResult.lines,
          translations: lyricsResult.translations || {},
          licensed: lyricsResult.licensed,
          provider: lyricsResult.provider,
          mode: 'fetched',
          error: lyricsResult.error
        })
      } catch (fetchError) {
        console.error('Failed to fetch lyrics:', fetchError)
        return res.status(200).json({
          trackId,
          artist: dbSong.artist,
          title: dbSong.title,
          album: dbSong.album,
          spotifyUrl: dbSong.spotifyUrl,
          previewUrl: dbSong.previewUrl,
          albumArt: dbSong.albumArt,
          albumArtSmall: dbSong.albumArtSmall,
          level: dbSong.level,
          difficultyScore: dbSong.metrics?.difficultyScore,
          metrics: dbSong.metrics,
          lines: [],
          translations: {},
          licensed: false,
          provider: 'error',
          mode: 'failed',
          error: 'Failed to fetch lyrics'
        })
      }
    }

    // Song not found
    return res.status(404).json({
      error: 'Track not found',
      trackId,
      suggestion: 'Ensure the song exists in the database. You may need to populate it first.'
    })

  } catch (error) {
    console.error('Lyrics API error:', error)
    return res.status(500).json({
      error: 'Failed to fetch lyrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}