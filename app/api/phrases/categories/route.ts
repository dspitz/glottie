import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch all categories ordered by their display order
    const categories = await prisma.phraseCategory.findMany({
      where: {
        phraseCount: { gt: 0 }  // Only show categories with phrases
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching phrase categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}