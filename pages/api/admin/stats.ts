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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get comprehensive statistics
    const [
      totalSongs,
      activeSongs,
      inactiveSongs,
      songsWithLyrics,
      songsWithArtwork,
      songsWithPreview,
      songsWithSpotifyId,
      songsWithGenius,
      totalTranslations,
      languageStats,
      levelStats,
      providerStats,
      recentSongs,
      popularityStats
    ] = await Promise.all([
      // Basic counts
      prisma.song.count(),
      prisma.song.count({ where: { isActive: true } }),
      prisma.song.count({ where: { isActive: false } }),
      
      // Content availability
      prisma.song.count({ where: { AND: [{ isActive: true }, { lyricsRaw: { not: null } }] } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { albumArt: { not: null } }] } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { previewUrl: { not: null } }] } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { spotifyId: { not: null } }] } }),
      prisma.song.count({ where: { AND: [{ isActive: true }, { culturalContext: { not: null } }] } }),
      
      // Translations
      prisma.translation.count(),
      
      // Language distribution
      prisma.song.groupBy({
        by: ['language'],
        where: { isActive: true },
        _count: { id: true }
      }),
      
      // Level distribution
      prisma.song.groupBy({
        by: ['level'],
        where: { isActive: true },
        _count: { id: true },
        orderBy: { level: 'asc' }
      }),
      
      // Lyrics provider distribution
      prisma.song.groupBy({
        by: ['lyricsProvider'],
        where: { AND: [{ isActive: true }, { lyricsProvider: { not: null } }] },
        _count: { id: true }
      }),
      
      // Recent activity
      prisma.song.findMany({
        where: { isActive: true },
        select: {
          title: true,
          artist: true,
          createdAt: true,
          lyricsProvider: true,
          albumArt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Popularity statistics
      prisma.song.aggregate({
        where: { AND: [{ isActive: true }, { popularity: { not: null } }] },
        _avg: { popularity: true },
        _min: { popularity: true },
        _max: { popularity: true }
      })
    ])

    // Calculate percentages
    const stats = {
      overview: {
        totalSongs,
        activeSongs,
        inactiveSongs,
        completionRate: {
          lyrics: activeSongs > 0 ? ((songsWithLyrics / activeSongs) * 100).toFixed(1) + '%' : '0%',
          artwork: activeSongs > 0 ? ((songsWithArtwork / activeSongs) * 100).toFixed(1) + '%' : '0%',
          preview: activeSongs > 0 ? ((songsWithPreview / activeSongs) * 100).toFixed(1) + '%' : '0%',
          spotifyId: activeSongs > 0 ? ((songsWithSpotifyId / activeSongs) * 100).toFixed(1) + '%' : '0%',
          geniusData: activeSongs > 0 ? ((songsWithGenius / activeSongs) * 100).toFixed(1) + '%' : '0%'
        }
      },
      
      content: {
        songsWithLyrics,
        songsWithArtwork,
        songsWithPreview,
        songsWithSpotifyId,
        songsWithGenius,
        totalTranslations
      },
      
      distribution: {
        byLanguage: languageStats.map(stat => ({
          language: stat.language,
          count: stat._count.id,
          percentage: activeSongs > 0 ? ((stat._count.id / activeSongs) * 100).toFixed(1) + '%' : '0%'
        })),
        
        byLevel: levelStats.map(stat => ({
          level: stat.level,
          count: stat._count.id,
          percentage: activeSongs > 0 ? ((stat._count.id / activeSongs) * 100).toFixed(1) + '%' : '0%'
        })),
        
        byLyricsProvider: providerStats.map(stat => ({
          provider: stat.lyricsProvider,
          count: stat._count.id,
          percentage: songsWithLyrics > 0 ? ((stat._count.id / songsWithLyrics) * 100).toFixed(1) + '%' : '0%'
        }))
      },
      
      quality: {
        averagePopularity: popularityStats._avg.popularity ? popularityStats._avg.popularity.toFixed(1) : null,
        popularityRange: {
          min: popularityStats._min.popularity,
          max: popularityStats._max.popularity
        }
      },
      
      recent: {
        songs: recentSongs
      },
      
      health: {
        dataCompleteness: {
          excellent: Math.round((songsWithLyrics && songsWithArtwork && songsWithSpotifyId) / activeSongs * 100) || 0,
          good: Math.round(songsWithArtwork / activeSongs * 100) || 0,
          basic: Math.round(songsWithSpotifyId / activeSongs * 100) || 0
        },
        
        recommendations: []
      }
    }

    // Add health recommendations
    if (songsWithLyrics / activeSongs < 0.5) {
      stats.health.recommendations.push('Consider running lyrics population for more songs')
    }
    
    if (songsWithPreview / activeSongs < 0.1) {
      stats.health.recommendations.push('Preview URLs are limited - this is expected due to Spotify policy changes')
    }
    
    if (songsWithGenius / activeSongs < 0.3) {
      stats.health.recommendations.push('Run Genius metadata enrichment to add cultural context')
    }

    return res.status(200).json(stats)

  } catch (error) {
    console.error('Admin stats API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}