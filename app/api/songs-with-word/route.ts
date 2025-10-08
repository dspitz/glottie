import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const word = searchParams.get('word')

    if (!word) {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      )
    }

    const normalizedWord = word.toLowerCase().trim()

    // Get songs where this word appears in parsed lyrics
    const songs = await prisma.song.findMany({
      where: {
        isActive: true,
        lyricsParsed: {
          contains: normalizedWord
        }
      },
      select: {
        id: true,
        title: true,
        artist: true,
        albumArt: true,
        albumArtSmall: true,
        level: true,
        levelName: true,
        lyricsParsed: true
      },
      take: 50 // Limit to first 50 songs
    })

    // Filter songs that actually contain the word in their tokens
    // and get click history to prioritize songs user clicked the word in
    const wordClicks = await prisma.wordClick.findMany({
      where: { word: normalizedWord },
      select: {
        clickedAt: true,
        // We'll need to infer song context from the definition if available
      },
      orderBy: { clickedAt: 'desc' }
    })

    const songsWithWord = songs.filter(song => {
      if (!song.lyricsParsed) return false
      try {
        const parsed = JSON.parse(song.lyricsParsed)
        // Check if any line contains the word in its tokens
        return parsed.some((line: any) =>
          line.tokens?.some((token: any) =>
            token.lemma?.toLowerCase() === normalizedWord ||
            token.text?.toLowerCase() === normalizedWord
          )
        )
      } catch {
        return false
      }
    })

    // Sort: prioritize songs with more occurrences of the word
    const songsWithCounts = songsWithWord.map(song => {
      let count = 0
      try {
        const parsed = JSON.parse(song.lyricsParsed!)
        parsed.forEach((line: any) => {
          line.tokens?.forEach((token: any) => {
            if (token.lemma?.toLowerCase() === normalizedWord ||
                token.text?.toLowerCase() === normalizedWord) {
              count++
            }
          })
        })
      } catch {
        // ignore
      }

      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        albumArt: song.albumArtSmall || song.albumArt,
        level: song.level,
        levelName: song.levelName,
        occurrences: count
      }
    })

    // Sort by occurrences desc
    songsWithCounts.sort((a, b) => b.occurrences - a.occurrences)

    return NextResponse.json({ songs: songsWithCounts })
  } catch (error) {
    // console.error('Error finding songs with word:', error)
    return NextResponse.json(
      { error: 'Failed to find songs' },
      { status: 500 }
    )
  }
}
