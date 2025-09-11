import { ParsedLine, ParsedToken } from './morphology'
import freqData from './freq-es.json'
import idioms from './idioms-es.json'

export interface DifficultyMetrics {
  wordCount: number
  uniqueWordCount: number
  typeTokenRatio: number
  avgWordFreqZipf: number
  verbDensity: number
  tenseWeights: number
  idiomCount: number
  punctComplexity: number
}

export interface ScoringResult {
  metrics: DifficultyMetrics
  difficultyScore: number
}

// Tense difficulty weights
const TENSE_WEIGHTS: { [key: string]: number } = {
  'presente': 0.5,
  'preterito': 1.0,
  'imperfecto': 1.0,
  'futuro': 0.8,
  'condicional': 1.1,
  'subjuntivo': 1.6,
  'subjuntivo_presente': 1.6,
  'subjuntivo_imperfecto': 1.8,
}

// Baseline values for normalization (will be updated from corpus)
let BASELINE_STATS = {
  wordCount: { mean: 80, std: 30 },
  typeTokenRatio: { mean: 0.7, std: 0.15 },
  avgWordFreqZipf: { mean: 4.0, std: 1.0 },
  verbDensity: { mean: 0.15, std: 0.05 },
  tenseWeights: { mean: 0.8, std: 0.3 },
  idiomCount: { mean: 1, std: 1 },
  punctComplexity: { mean: 0.2, std: 0.1 },
}

function getWordFrequency(word: string): number {
  const normalizedWord = word.toLowerCase().trim()
  const freq = freqData[normalizedWord as keyof typeof freqData]
  
  if (freq !== undefined) {
    return freq
  }
  
  // Fallback: estimate based on word characteristics
  if (normalizedWord.length <= 3) return 3.0
  if (normalizedWord.length <= 5) return 2.0
  if (normalizedWord.length <= 8) return 1.0
  return 0.5
}

function countIdioms(parsedLines: ParsedLine[]): number {
  const fullText = parsedLines.map(line => line.line).join(' ').toLowerCase()
  
  return idioms.reduce((count, idiom) => {
    const idiomRegex = new RegExp(idiom.replace(/\s+/g, '\\s+'), 'gi')
    const matches = fullText.match(idiomRegex)
    return count + (matches ? matches.length : 0)
  }, 0)
}

function calculatePunctComplexity(parsedLines: ParsedLine[]): number {
  const fullText = parsedLines.map(line => line.line).join(' ')
  
  // Count complex punctuation
  const commas = (fullText.match(/,/g) || []).length
  const semicolons = (fullText.match(/;/g) || []).length
  const questions = (fullText.match(/¿|\?/g) || []).length
  const exclamations = (fullText.match(/¡|!/g) || []).length
  const colons = (fullText.match(/:/g) || []).length
  
  // Calculate clause length variance
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length)
  const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length
  
  // Normalize and combine factors
  const punctuationScore = (commas + semicolons * 1.5 + questions * 0.8 + exclamations * 0.8 + colons * 1.2) / fullText.length * 100
  const varianceScore = Math.sqrt(variance) / avgLength
  
  return Math.min(punctuationScore + varianceScore, 2.0)
}

function norm(value: number, baseline: { mean: number; std: number }): number {
  return (value - baseline.mean) / baseline.std
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function computeDifficulty(parsedLines: ParsedLine[]): ScoringResult {
  if (parsedLines.length === 0) {
    throw new Error('No parsed lines provided')
  }

  // Extract all tokens
  const allTokens: ParsedToken[] = parsedLines.flatMap(line => line.tokens)
  
  // Basic metrics
  const wordCount = allTokens.length
  const uniqueWords = new Set(allTokens.map(token => token.lemma.toLowerCase()))
  const uniqueWordCount = uniqueWords.size
  const typeTokenRatio = uniqueWordCount / wordCount
  
  // Frequency analysis
  const frequencies = allTokens.map(token => getWordFrequency(token.text))
  const avgWordFreqZipf = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length
  
  // Verb analysis
  const verbs = allTokens.filter(token => token.isVerb)
  const verbDensity = verbs.length / wordCount
  
  // Tense complexity
  const tenseWeights = verbs.reduce((sum, verb) => {
    const weight = verb.tense ? TENSE_WEIGHTS[verb.tense] || 1.0 : 0.5
    return sum + weight
  }, 0)
  
  // Idiom and punctuation analysis
  const idiomCount = countIdioms(parsedLines)
  const punctComplexity = calculatePunctComplexity(parsedLines)
  
  const metrics: DifficultyMetrics = {
    wordCount,
    uniqueWordCount,
    typeTokenRatio,
    avgWordFreqZipf,
    verbDensity,
    tenseWeights,
    idiomCount,
    punctComplexity,
  }
  
  // Compute composite difficulty score
  let z = 0
  z += 0.12 * norm(wordCount, BASELINE_STATS.wordCount)
  z += 0.18 * norm(1 - typeTokenRatio, BASELINE_STATS.typeTokenRatio)
  z += 0.22 * norm(7 - avgWordFreqZipf, BASELINE_STATS.avgWordFreqZipf)
  z += 0.18 * norm(verbDensity, BASELINE_STATS.verbDensity)
  z += 0.22 * norm(tenseWeights, BASELINE_STATS.tenseWeights)
  z += 0.04 * norm(idiomCount, BASELINE_STATS.idiomCount)
  z += 0.04 * norm(punctComplexity, BASELINE_STATS.punctComplexity)
  
  const difficultyScore = clamp(1 + 9 * sigmoid(z), 1, 10)
  
  return {
    metrics,
    difficultyScore,
  }
}

export function updateBaselines(allMetrics: DifficultyMetrics[]): void {
  if (allMetrics.length === 0) return
  
  const calculateStats = (values: number[]) => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const std = Math.sqrt(variance)
    return { mean, std: Math.max(std, 0.001) } // Prevent division by zero
  }
  
  BASELINE_STATS = {
    wordCount: calculateStats(allMetrics.map(m => m.wordCount)),
    typeTokenRatio: calculateStats(allMetrics.map(m => m.typeTokenRatio)),
    avgWordFreqZipf: calculateStats(allMetrics.map(m => m.avgWordFreqZipf)),
    verbDensity: calculateStats(allMetrics.map(m => m.verbDensity)),
    tenseWeights: calculateStats(allMetrics.map(m => m.tenseWeights)),
    idiomCount: calculateStats(allMetrics.map(m => m.idiomCount)),
    punctComplexity: calculateStats(allMetrics.map(m => m.punctComplexity)),
  }
}

export function assignLevel(difficultyScore: number): number {
  return Math.max(1, Math.min(10, Math.round(difficultyScore)))
}

export function getLevelDistribution(scores: number[]): Record<string, number> {
  const distribution: Record<string, number> = {}
  
  for (let i = 1; i <= 10; i++) {
    distribution[i.toString()] = 0
  }
  
  scores.forEach(score => {
    const level = assignLevel(score)
    distribution[level.toString()]++
  })
  
  return distribution
}