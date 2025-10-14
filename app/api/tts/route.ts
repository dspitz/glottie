import { NextRequest, NextResponse } from 'next/server'

/**
 * Text-to-Speech API Route
 *
 * Supports:
 * - Google Cloud Text-to-Speech (premium voices)
 * - ElevenLabs (ultra-realistic voices)
 * - Fallback to browser TTS
 *
 * Usage: POST /api/tts
 * Body: { text: string, language: string }
 */

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json()

    if (!text || !language) {
      return NextResponse.json(
        { error: 'Missing text or language' },
        { status: 400 }
      )
    }

    // Try Google Cloud TTS first (best quality/price ratio)
    if (process.env.GOOGLE_CLOUD_TTS_API_KEY) {
      return await generateGoogleTTS(text, language)
    }

    // Try ElevenLabs (most realistic but expensive)
    if (process.env.ELEVENLABS_API_KEY) {
      return await generateElevenLabsTTS(text, language)
    }

    // No API keys available - tell client to use browser TTS
    return NextResponse.json({
      useBrowserTTS: true,
      message: 'No TTS service configured, use browser TTS',
    })
  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech', useBrowserTTS: true },
      { status: 500 }
    )
  }
}

/**
 * Google Cloud Text-to-Speech
 * https://cloud.google.com/text-to-speech
 *
 * Pricing: ~$4 per 1M characters (Neural2 voices)
 * Quality: Excellent, very natural
 */
async function generateGoogleTTS(text: string, language: string) {
  const langMap: Record<string, { languageCode: string; name: string }> = {
    es: { languageCode: 'es-ES', name: 'es-ES-Neural2-A' },
    fr: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' },
    de: { languageCode: 'de-DE', name: 'de-DE-Neural2-A' },
    it: { languageCode: 'it-IT', name: 'it-IT-Neural2-A' },
    pt: { languageCode: 'pt-PT', name: 'pt-PT-Neural2-A' },
    ja: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B' },
    zh: { languageCode: 'zh-CN', name: 'cmn-CN-Neural2-A' },
    ko: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-A' },
    ru: { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-A' },
    ar: { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-A' },
    hi: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A' },
  }

  const voiceConfig = langMap[language] || langMap['es']

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_CLOUD_TTS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.85,
          pitch: 0,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Google TTS failed: ${response.statusText}`)
  }

  const data = await response.json()

  // Return base64 audio that can be played directly
  return NextResponse.json({
    audio: data.audioContent,
    format: 'mp3',
    provider: 'google',
  })
}

/**
 * ElevenLabs Text-to-Speech
 * https://elevenlabs.io/
 *
 * Pricing: ~$0.30 per 1000 characters
 * Quality: Best in class, ultra-realistic
 */
async function generateElevenLabsTTS(text: string, language: string) {
  // ElevenLabs voice IDs for different languages
  const voiceMap: Record<string, string> = {
    es: 'ThT5KcBeYPX3keUQqHPh', // Spanish voice
    fr: 'cgSgspJ2msm6clMCkdW9', // French voice
    de: 'iP95p4xoKVk53GoZ742B', // German voice
    en: '21m00Tcm4TlvDq8ikWAM', // English voice
    // Add more as needed
  }

  const voiceId = voiceMap[language] || voiceMap['en']

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed: ${response.statusText}`)
  }

  const audioBuffer = await response.arrayBuffer()
  const base64Audio = Buffer.from(audioBuffer).toString('base64')

  return NextResponse.json({
    audio: base64Audio,
    format: 'mp3',
    provider: 'elevenlabs',
  })
}
