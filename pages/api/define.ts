import type { NextApiRequest, NextApiResponse } from 'next'
import { define as defineWord } from '@/packages/adapters/dictionary'
import { conjugations } from '@/packages/core/morphology'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { word, lang = 'es' } = req.body

    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: 'Word is required' })
    }

    if (word.length > 50) {
      return res.status(400).json({ error: 'Word too long (max 50 characters)' })
    }

    // Get definition
    const definition = await defineWord(word, lang)

    // Get conjugations if it's a verb
    let conjugationTable = null
    if (definition.pos === 'VERB') {
      conjugationTable = conjugations(definition.lemma)
    }

    return res.status(200).json({
      word: definition.word,
      lemma: definition.lemma,
      pos: definition.pos,
      definitions: definition.definitions,
      examples: definition.examples || [],
      conjugations: conjugationTable,
      provider: definition.provider
    })

  } catch (error) {
    console.error('Definition API error:', error)
    return res.status(500).json({
      error: 'Definition lookup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}