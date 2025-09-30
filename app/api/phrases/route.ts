import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build where clause
    const whereClause: any = {}

    if (category) {
      whereClause.category = category
    }

    if (search) {
      whereClause.OR = [
        { originalText: { contains: search, mode: 'insensitive' } },
        { translatedText: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch phrases with song info
    const phrases = await prisma.phrase.findMany({
      where: whereClause,
      include: {
        song: {
          select: {
            id: true,
            title: true,
            artist: true,
            albumArt: true,
            spotifyId: true
          }
        }
      },
      orderBy: [
        { usefulnessScore: 'desc' },
        { category: 'asc' }
      ],
      take: limit,
      skip: offset
    })

    return NextResponse.json(phrases)
  } catch (error) {
    console.error('Error fetching phrases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch phrases' },
      { status: 500 }
    )
  }
}