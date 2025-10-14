import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractVocabulary } from '@/lib/vocabExtraction'
import { getEnrichedVocabulary, getIdiomsForLyrics } from '@/lib/vocabularyEnrichment'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const songId = params.id

    // Get enrichment level from query params (basic or full)
    const { searchParams } = new URL(request.url)
    const enrichmentLevel = searchParams.get('enrich') || 'basic'

    // Fetch song with translations
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: {
        translations: {
          where: { targetLang: 'en' },
        },
      },
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    // Parse lyrics
    let lyrics: string[] = []
    if (song.lyricsRaw) {
      try {
        const lyricsData = JSON.parse(song.lyricsRaw)
        lyrics = lyricsData.lines || []
      } catch (e) {
        console.error('Failed to parse lyrics:', e)
        return NextResponse.json(
          { error: 'Invalid lyrics format' },
          { status: 500 }
        )
      }
    }

    // Parse translations
    let translations: string[] = []
    if (song.translations.length > 0) {
      try {
        const translationData = song.translations[0]
        translations = JSON.parse(translationData.lyricsLines)
      } catch (e) {
        console.error('Failed to parse translations:', e)
      }
    }

    // Extract vocabulary (pass prisma for vocabulary database lookup)
    const vocab = await extractVocabulary(
      lyrics,
      translations,
      song.language,
      12, // Get top 12 words
      prisma
    )

    // If full enrichment requested, get multi-language data
    let enrichedVocab = null
    if (enrichmentLevel === 'full' && vocab.length > 0) {
      try {
        const words = vocab.map(v => v.word)
        enrichedVocab = await getEnrichedVocabulary(words, song.language)
      } catch (error) {
        console.error('Error enriching vocabulary:', error)
        // Continue without enrichment
      }
    }

    // Detect idioms
    let idioms = []
    if (lyrics.length > 0) {
      try {
        idioms = await getIdiomsForLyrics(lyrics, song.language)
      } catch (error) {
        console.error('Error detecting idioms:', error)
        // Continue without idioms
      }
    }

    return NextResponse.json({
      vocab,
      enrichedVocab,
      idioms,
      language: song.language,
    })
  } catch (error) {
    console.error('Error extracting vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to extract vocabulary' },
      { status: 500 }
    )
  }
}
