import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simple admin authentication - in production, use proper auth
function isAdmin(req: NextApiRequest): boolean {
  const adminKey = req.headers['x-admin-key']
  return adminKey === process.env.ADMIN_API_KEY || process.env.NODE_ENV === 'development'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetSongs(req, res)
      case 'POST':
        return handleCreateSong(req, res)
      case 'PUT':
        return handleUpdateSong(req, res)
      case 'DELETE':
        return handleDeleteSong(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGetSongs(req: NextApiRequest, res: NextApiResponse) {
  const {
    page = '1',
    limit = '20',
    search,
    language,
    level,
    hasLyrics,
    hasArtwork,
    isActive = 'true'
  } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where: any = {
    isActive: isActive === 'true'
  }

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { artist: { contains: search as string, mode: 'insensitive' } },
      { album: { contains: search as string, mode: 'insensitive' } }
    ]
  }

  if (language) {
    where.language = language
  }

  if (level) {
    where.level = parseInt(level as string)
  }

  if (hasLyrics === 'true') {
    where.lyricsRaw = { not: null }
  } else if (hasLyrics === 'false') {
    where.lyricsRaw = null
  }

  if (hasArtwork === 'true') {
    where.albumArt = { not: null }
  } else if (hasArtwork === 'false') {
    where.albumArt = null
  }

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where,
      include: {
        metrics: true,
        translations: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.song.count({ where })
  ])

  return res.status(200).json({
    songs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
}

async function handleCreateSong(req: NextApiRequest, res: NextApiResponse) {
  const {
    title,
    artist,
    album,
    year,
    spotifyId,
    spotifyUrl,
    previewUrl,
    albumArt,
    albumArtSmall,
    language = 'es',
    level,
    lyricsRaw,
    lyricsProvider,
    culturalContext,
    genres,
    popularity,
    danceability,
    energy,
    valence,
    tempo
  } = req.body

  if (!title || !artist) {
    return res.status(400).json({ error: 'Title and artist are required' })
  }

  // Check if song with same Spotify ID already exists
  if (spotifyId) {
    const existing = await prisma.song.findUnique({
      where: { spotifyId }
    })
    if (existing) {
      return res.status(409).json({ error: 'Song with this Spotify ID already exists' })
    }
  }

  const song = await prisma.song.create({
    data: {
      title,
      artist,
      album,
      year: year ? parseInt(year) : null,
      spotifyId,
      spotifyUrl,
      previewUrl,
      albumArt,
      albumArtSmall,
      language,
      level: level ? parseInt(level) : null,
      lyricsRaw,
      lyricsProvider,
      lyricsLicensed: Boolean(lyricsRaw),
      culturalContext,
      genres,
      popularity: popularity ? parseInt(popularity) : null,
      danceability: danceability ? parseFloat(danceability) : null,
      energy: energy ? parseFloat(energy) : null,
      valence: valence ? parseFloat(valence) : null,
      tempo: tempo ? parseFloat(tempo) : null,
      isActive: true
    },
    include: {
      metrics: true,
      translations: true
    }
  })

  return res.status(201).json({ song })
}

async function handleUpdateSong(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Song ID is required' })
  }

  const updateData: any = {}
  const {
    title,
    artist,
    album,
    year,
    spotifyId,
    spotifyUrl,
    previewUrl,
    albumArt,
    albumArtSmall,
    language,
    level,
    lyricsRaw,
    lyricsProvider,
    culturalContext,
    genres,
    popularity,
    danceability,
    energy,
    valence,
    tempo,
    isActive
  } = req.body

  // Only update fields that are provided
  if (title !== undefined) updateData.title = title
  if (artist !== undefined) updateData.artist = artist
  if (album !== undefined) updateData.album = album
  if (year !== undefined) updateData.year = year ? parseInt(year) : null
  if (spotifyId !== undefined) updateData.spotifyId = spotifyId
  if (spotifyUrl !== undefined) updateData.spotifyUrl = spotifyUrl
  if (previewUrl !== undefined) updateData.previewUrl = previewUrl
  if (albumArt !== undefined) updateData.albumArt = albumArt
  if (albumArtSmall !== undefined) updateData.albumArtSmall = albumArtSmall
  if (language !== undefined) updateData.language = language
  if (level !== undefined) updateData.level = level ? parseInt(level) : null
  if (lyricsRaw !== undefined) {
    updateData.lyricsRaw = lyricsRaw
    updateData.lyricsLicensed = Boolean(lyricsRaw)
  }
  if (lyricsProvider !== undefined) updateData.lyricsProvider = lyricsProvider
  if (culturalContext !== undefined) updateData.culturalContext = culturalContext
  if (genres !== undefined) updateData.genres = genres
  if (popularity !== undefined) updateData.popularity = popularity ? parseInt(popularity) : null
  if (danceability !== undefined) updateData.danceability = danceability ? parseFloat(danceability) : null
  if (energy !== undefined) updateData.energy = energy ? parseFloat(energy) : null
  if (valence !== undefined) updateData.valence = valence ? parseFloat(valence) : null
  if (tempo !== undefined) updateData.tempo = tempo ? parseFloat(tempo) : null
  if (isActive !== undefined) updateData.isActive = Boolean(isActive)

  const song = await prisma.song.update({
    where: { id },
    data: updateData,
    include: {
      metrics: true,
      translations: true
    }
  })

  return res.status(200).json({ song })
}

async function handleDeleteSong(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Song ID is required' })
  }

  // Soft delete by setting isActive to false
  const song = await prisma.song.update({
    where: { id },
    data: { isActive: false }
  })

  return res.status(200).json({ message: 'Song deleted successfully', song })
}