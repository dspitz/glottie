import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    // Build where clause for search
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { translation: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch top vocabulary words, ordered by usefulness score
    const vocabulary = await prisma.vocabulary.findMany({
      where: whereClause,
      orderBy: {
        usefulnessScore: 'desc'
      },
      take: limit
    })

    // Get total count for display
    const totalCount = await prisma.vocabulary.count()

    return NextResponse.json({
      vocabulary,
      totalCount
    })
  } catch (error) {
    console.error('Error fetching vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    )
  }
}