import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const word = searchParams.get('word')
    const language = searchParams.get('language')

    if (!word || !language) {
      return NextResponse.json(
        { error: 'Missing word or language parameter' },
        { status: 400 }
      )
    }

    // Try to find the word in the enriched vocabulary database
    const enrichedWord = await prisma.vocabularyEnriched.findUnique({
      where: {
        word_language: {
          word: word.toLowerCase(),
          language: language.toLowerCase(),
        },
      },
    })

    if (!enrichedWord) {
      return NextResponse.json(
        { error: 'Word not found in enriched vocabulary' },
        { status: 404 }
      )
    }

    // Parse the stored JSON fields
    const translations = JSON.parse(enrichedWord.translations)
    const conjugations = enrichedWord.conjugations ? JSON.parse(enrichedWord.conjugations) : undefined
    const synonyms = enrichedWord.synonyms ? JSON.parse(enrichedWord.synonyms) : undefined
    const antonyms = enrichedWord.antonyms ? JSON.parse(enrichedWord.antonyms) : undefined

    // Return in the same format as enrichedVocab from vocab route
    return NextResponse.json({
      word: enrichedWord.word,
      language: enrichedWord.language,
      translations,
      root: enrichedWord.root || undefined,
      partOfSpeech: enrichedWord.partOfSpeech,
      conjugations,
      synonyms,
      antonyms,
      definition: enrichedWord.definition || undefined,
      exampleSentence: enrichedWord.exampleSentence || undefined,
      exampleTranslation: enrichedWord.exampleTranslation || undefined,
      usefulnessScore: enrichedWord.usefulnessScore || undefined,
    })
  } catch (error) {
    console.error('Error fetching enriched vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enriched vocabulary' },
      { status: 500 }
    )
  }
}
