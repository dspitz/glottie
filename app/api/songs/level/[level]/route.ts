import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { level: string } }
) {
  try {
    const level = parseInt(params.level)

    if (isNaN(level)) {
      return NextResponse.json(
        { error: 'Invalid level parameter' },
        { status: 400 }
      )
    }

    const songs = await prisma.song.findMany({
      where: {
        level: level,
        isActive: true
      },
      orderBy: [
        { order: 'asc' },
        { title: 'asc' }
      ],
      select: {
        id: true,
        title: true,
        artist: true,
        order: true
      }
    })

    return NextResponse.json(songs)
  } catch (error) {
    // console.error('Failed to fetch level songs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    )
  }
}