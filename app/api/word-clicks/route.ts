import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { word, translation, definition, language } = await req.json()

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    // Normalize word (lowercase, trim)
    const normalizedWord = word.toLowerCase().trim()

    // Find vocabulary entry if exists
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { word: normalizedWord }
    })

    // Create word click record with translation, definition, and language
    await prisma.wordClick.create({
      data: {
        word: normalizedWord,
        vocabularyId: vocabulary?.id || null,
        userId: null, // TODO: Add user tracking when auth is implemented
        translation: translation || null,
        definition: definition || null,
        language: language || 'es',
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Error tracking word click:', error)
    return NextResponse.json(
      { error: 'Failed to track word click' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const specificWord = searchParams.get('word')
    const language = searchParams.get('language') || 'es'

    // If specific word is requested, return just that word's count
    if (specificWord) {
      const normalizedWord = specificWord.toLowerCase().trim()
      const clickCount = await prisma.wordClick.count({
        where: {
          word: normalizedWord,
          language: language
        }
      })

      const vocab = await prisma.vocabulary.findUnique({
        where: { word: normalizedWord }
      })

      return NextResponse.json({
        words: [{
          word: normalizedWord,
          clickCount,
          vocabulary: vocab
        }]
      })
    }

    // Get most engaged words by click count for the specified language
    const wordClicks = await prisma.wordClick.groupBy({
      by: ['word'],
      where: {
        language: language
      },
      _count: {
        word: true
      },
      orderBy: {
        _count: {
          word: 'desc'
        }
      },
      take: limit
    })

    // Get vocabulary details and most recent click data for each word
    const words = await Promise.all(
      wordClicks.map(async (wc) => {
        const vocab = await prisma.vocabulary.findUnique({
          where: { word: wc.word }
        })

        // Get most recent click to retrieve translation/definition (filtered by language)
        const recentClick = await prisma.wordClick.findFirst({
          where: {
            word: wc.word,
            language: language
          },
          orderBy: { clickedAt: 'desc' }
        })

        return {
          word: wc.word,
          clickCount: wc._count.word,
          vocabulary: vocab,
          translation: recentClick?.translation || null,
          definition: recentClick?.definition || null,
          lastClickedAt: recentClick?.clickedAt || null
        }
      })
    )

    return NextResponse.json({ words })
  } catch (error) {
    // console.error('Error fetching word clicks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch word clicks' },
      { status: 500 }
    )
  }
}
