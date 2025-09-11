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
        return handleGetTranslations(req, res)
      case 'POST':
        return handleCreateTranslation(req, res)
      case 'PUT':
        return handleUpdateTranslation(req, res)
      case 'DELETE':
        return handleDeleteTranslation(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Admin translations API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGetTranslations(req: NextApiRequest, res: NextApiResponse) {
  const {
    songId,
    targetLang,
    page = '1',
    limit = '50'
  } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where: any = {}

  if (songId) {
    where.songId = songId
  }

  if (targetLang) {
    where.targetLang = targetLang
  }

  const [translations, total] = await Promise.all([
    prisma.translation.findMany({
      where,
      include: {
        song: {
          select: {
            title: true,
            artist: true,
            language: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.translation.count({ where })
  ])

  return res.status(200).json({
    translations,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  })
}

async function handleCreateTranslation(req: NextApiRequest, res: NextApiResponse) {
  const {
    songId,
    targetLang,
    lyricsLines,
    title,
    culturalNotes,
    provider = 'manual',
    confidence
  } = req.body

  if (!songId || !targetLang) {
    return res.status(400).json({ error: 'Song ID and target language are required' })
  }

  // Validate that the song exists
  const song = await prisma.song.findUnique({
    where: { id: songId }
  })

  if (!song) {
    return res.status(404).json({ error: 'Song not found' })
  }

  // Check if translation already exists
  const existing = await prisma.translation.findUnique({
    where: {
      songId_targetLang: {
        songId,
        targetLang
      }
    }
  })

  if (existing) {
    return res.status(409).json({ error: 'Translation already exists for this language' })
  }

  const translation = await prisma.translation.create({
    data: {
      songId,
      targetLang,
      lyricsLines: lyricsLines ? JSON.stringify(lyricsLines) : null,
      title,
      culturalNotes,
      provider,
      confidence: confidence ? parseFloat(confidence) : null
    },
    include: {
      song: {
        select: {
          title: true,
          artist: true,
          language: true
        }
      }
    }
  })

  return res.status(201).json({ translation })
}

async function handleUpdateTranslation(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Translation ID is required' })
  }

  const updateData: any = {}
  const {
    lyricsLines,
    title,
    culturalNotes,
    provider,
    confidence
  } = req.body

  // Only update fields that are provided
  if (lyricsLines !== undefined) {
    updateData.lyricsLines = lyricsLines ? JSON.stringify(lyricsLines) : null
  }
  if (title !== undefined) updateData.title = title
  if (culturalNotes !== undefined) updateData.culturalNotes = culturalNotes
  if (provider !== undefined) updateData.provider = provider
  if (confidence !== undefined) updateData.confidence = confidence ? parseFloat(confidence) : null

  const translation = await prisma.translation.update({
    where: { id },
    data: updateData,
    include: {
      song: {
        select: {
          title: true,
          artist: true,
          language: true
        }
      }
    }
  })

  return res.status(200).json({ translation })
}

async function handleDeleteTranslation(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Translation ID is required' })
  }

  await prisma.translation.delete({
    where: { id }
  })

  return res.status(200).json({ message: 'Translation deleted successfully' })
}