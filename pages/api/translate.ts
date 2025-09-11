import type { NextApiRequest, NextApiResponse } from 'next'
import { translate as translateText } from '@/packages/adapters/translate'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, targetLang = 'en' } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' })
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: 'Text too long (max 1000 characters)' })
    }

    const translation = await translateText(text, targetLang)

    return res.status(200).json({
      original: text,
      translation: translation.text,
      sourceLang: translation.source,
      targetLang: translation.target,
      provider: translation.provider
    })

  } catch (error) {
    console.error('Translation API error:', error)
    return res.status(500).json({
      error: 'Translation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}