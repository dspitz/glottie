import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get completed songs count
    const completedSongs = await prisma.songProgress.count({
      where: {
        userId: user.id,
        completed: true
      }
    })

    // Get average quiz score
    const progressWithScores = await prisma.songProgress.findMany({
      where: {
        userId: user.id,
        completed: true,
        quizScore: { not: null }
      },
      select: {
        quizScore: true
      }
    })

    const averageGrade = progressWithScores.length > 0
      ? progressWithScores.reduce((sum, p) => sum + (p.quizScore || 0), 0) / progressWithScores.length
      : null

    // Get completed songs with their levels to calculate average level
    const completedSongsWithLevels = await prisma.songProgress.findMany({
      where: {
        userId: user.id,
        completed: true
      },
      include: {
        song: {
          select: {
            level: true,
            levelName: true
          }
        }
      }
    })

    const songsWithLevels = completedSongsWithLevels.filter(s => s.song.level !== null)
    const averageSongLevel = songsWithLevels.length > 0
      ? songsWithLevels.reduce((sum, s) => sum + (s.song.level || 0), 0) / songsWithLevels.length
      : 0

    // Get saved songs count for user level calculation
    const savedSongsCount = await prisma.savedSong.count({
      where: { userId: user.id }
    })

    // Determine user level based on saved songs and average level
    let userLevel = 1
    let userLevelName = 'Beginner'

    if (savedSongsCount === 0) {
      userLevel = 1
      userLevelName = 'Beginner'
    } else if (savedSongsCount < 3) {
      userLevel = 1
      userLevelName = 'Beginner'
    } else if (averageSongLevel < 1.5) {
      userLevel = 1
      userLevelName = 'Beginner'
    } else if (averageSongLevel < 2.5) {
      userLevel = 2
      userLevelName = 'Upper Beginner'
    } else if (averageSongLevel < 3.5) {
      userLevel = 3
      userLevelName = 'Intermediate'
    } else if (averageSongLevel < 4.5) {
      userLevel = 4
      userLevelName = 'Upper Intermediate'
    } else {
      userLevel = 5
      userLevelName = 'Advanced'
    }

    return NextResponse.json({
      userLevel,
      userLevelName,
      songsCompleted: completedSongs,
      averageSongLevel: averageSongLevel > 0 ? Number(averageSongLevel.toFixed(1)) : 1.0,
      averageGrade: averageGrade !== null ? Number(averageGrade.toFixed(0)) : 0,
      totalSavedSongs: savedSongsCount
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
