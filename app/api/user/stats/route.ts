import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language') || 'es'

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

    // Get completed songs count for this language
    const completedSongs = await prisma.songProgress.count({
      where: {
        userId: user.id,
        completed: true,
        song: {
          language: language
        }
      }
    })

    // Get average quiz score for this language
    const progressWithScores = await prisma.songProgress.findMany({
      where: {
        userId: user.id,
        completed: true,
        quizScore: { not: null },
        song: {
          language: language
        }
      },
      select: {
        quizScore: true
      }
    })

    const averageGrade = progressWithScores.length > 0
      ? progressWithScores.reduce((sum, p) => sum + (p.quizScore || 0), 0) / progressWithScores.length
      : null

    // Get completed songs with their levels to calculate average level for this language
    const completedSongsWithLevels = await prisma.songProgress.findMany({
      where: {
        userId: user.id,
        completed: true,
        song: {
          language: language
        }
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

    // Get saved songs count for this language
    const savedSongsCount = await prisma.savedSong.count({
      where: {
        userId: user.id,
        song: {
          language: language
        }
      }
    })

    // Get or create user language progress for this language
    let userLangProgress = await prisma.userLanguageProgress.findUnique({
      where: {
        userId_language: {
          userId: user.id,
          language: language
        }
      }
    })

    // Calculate user level based on progress in this language
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

    // Update or create user language progress
    if (userLangProgress) {
      // Update existing progress if level changed
      if (userLangProgress.level !== userLevel) {
        userLangProgress = await prisma.userLanguageProgress.update({
          where: { id: userLangProgress.id },
          data: {
            level: userLevel,
            levelName: userLevelName
          }
        })
      }
    } else {
      // Create new language progress
      userLangProgress = await prisma.userLanguageProgress.create({
        data: {
          userId: user.id,
          language: language,
          level: userLevel,
          levelName: userLevelName
        }
      })
    }

    return NextResponse.json({
      userLevel: userLangProgress.level,
      userLevelName: userLangProgress.levelName,
      songsCompleted: completedSongs,
      averageSongLevel: averageSongLevel > 0 ? Number(averageSongLevel.toFixed(1)) : 1.0,
      averageGrade: averageGrade !== null ? Number(averageGrade.toFixed(0)) : 0,
      totalSavedSongs: savedSongsCount,
      language: language
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
