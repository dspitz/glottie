import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDifficultyScore(score: number): string {
  return score.toFixed(1)
}

export function getLevelColor(level: number): string {
  const colors = {
    1: 'bg-sky-100 text-sky-800 border-sky-200',
    2: 'bg-green-100 text-green-800 border-green-200',
    3: 'bg-green-200 text-green-900 border-green-300',
    4: 'bg-lime-200 text-lime-900 border-lime-300',
    5: 'bg-yellow-200 text-yellow-900 border-yellow-300',
    6: 'bg-orange-200 text-orange-900 border-orange-300',
    7: 'bg-orange-300 text-orange-900 border-orange-400',
    8: 'bg-red-200 text-red-900 border-red-300',
    9: 'bg-red-300 text-red-900 border-red-400',
    10: 'bg-purple-200 text-purple-900 border-purple-300',
    11: 'bg-purple-300 text-purple-900 border-purple-400',
  }
  return colors[level as keyof typeof colors] || colors[5]
}

export function getLevelDescription(level: number): string {
  const descriptions = {
    1: 'Kids songs\nwith simple words',
    2: 'Simple vocabulary\nand present tense',
    3: 'Basic past tense\nand common phrases',
    4: 'Simple future tense\nand descriptions',
    5: 'Mixed tenses\nand more vocabulary',
    6: 'Complex sentences\nand some idioms',
    7: 'Advanced tenses\nand expressions',
    8: 'Subjunctive\nand complex grammar',
    9: 'Sophisticated vocabulary\nand expressions',
    10: 'Literary language\nand complex idioms',
    11: 'Native-level complexity\nand nuanced expressions',
  }
  return descriptions[level as keyof typeof descriptions] || 'Unknown level'
}

export function segmentIntoSentences(text: string): string[] {
  // Simple sentence segmentation for Spanish
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  return sentences
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitFor: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitFor)
  }
}

export interface WordToken {
  word: string           // Original word with punctuation
  cleanWord: string      // Cleaned word for dictionary lookup
  isWord: boolean        // Whether this token is a meaningful word
}

export function parseTextIntoWords(text: string): WordToken[] {
  // Split by whitespace while preserving spaces
  const tokens = text.split(/(\s+)/)

  const wordTokens: WordToken[] = []

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      // This is just whitespace, add as-is
      wordTokens.push({
        word: token,
        cleanWord: '',
        isWord: false
      })
    } else if (token.trim().length > 0) {
      // This is a word (potentially with punctuation)
      const cleanWord = cleanWordForLookup(token)
      wordTokens.push({
        word: token,
        cleanWord,
        isWord: cleanWord.length > 1 && /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(cleanWord)
      })
    }
  }

  return wordTokens
}

export function cleanWordForLookup(word: string): string {
  // Handle French/Spanish contractions with apostrophes
  // l'homme → homme, j'aime → aime, d'accord → accord
  const lowerWord = word.toLowerCase()

  // Check if it's a French contraction (l', j', d', m', t', s', c', n', qu')
  const contractionMatch = lowerWord.match(/^([ljdmtscnq]'|qu')(.+)$/)
  if (contractionMatch) {
    // Return the word after the apostrophe
    return contractionMatch[2]
      .replace(/[¡¿""''"",.:;!?()[\]{}\-–—]/g, '')
      .trim()
  }

  // Otherwise, remove punctuation and convert to lowercase for dictionary lookup
  return lowerWord
    .replace(/[¡¿""''"",.:;!?()[\]{}\-–—]/g, '') // Remove common punctuation
    .trim()
}

export function normalizeSpanishText(text: string): string {
  // Helper function to normalize Spanish text for better matching
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .trim()
}