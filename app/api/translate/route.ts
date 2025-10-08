import { NextRequest, NextResponse } from 'next/server'
import { translate } from '@/packages/adapters/translate'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, targetLang = 'en' } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const translation = await translate(text, targetLang)

    return NextResponse.json({
      translation: translation.text,
      source: translation.source,
      target: translation.target,
      provider: translation.provider
    })
  } catch (error) {
    // console.error('Translation API error:', error)

    return NextResponse.json(
      {
        error: 'Translation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}