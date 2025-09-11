import { describe, it, expect } from 'vitest'
import { computeDifficulty, assignLevel } from '@/packages/core/scoring'
import { analyzeLine } from '@/packages/core/morphology'

describe('Scoring System', () => {
  describe('computeDifficulty', () => {
    it('should compute basic metrics correctly', () => {
      const parsedLines = [
        analyzeLine('Hola me llamo Juan', 0),
        analyzeLine('Tengo veinte años', 1)
      ]

      const result = computeDifficulty(parsedLines)
      
      expect(result.metrics.wordCount).toBeGreaterThan(0)
      expect(result.metrics.uniqueWordCount).toBeGreaterThan(0)
      expect(result.metrics.typeTokenRatio).toBeGreaterThan(0)
      expect(result.metrics.typeTokenRatio).toBeLessThanOrEqual(1)
      expect(result.difficultyScore).toBeGreaterThanOrEqual(1)
      expect(result.difficultyScore).toBeLessThanOrEqual(10)
    })

    it('should handle empty input gracefully', () => {
      expect(() => computeDifficulty([])).toThrow('No parsed lines provided')
    })

    it('should assign higher difficulty to subjunctive verbs', () => {
      const simpleLine = [analyzeLine('Hablo español', 0)]
      const complexLine = [analyzeLine('Espero que hables español', 0)]

      const simpleResult = computeDifficulty(simpleLine)
      const complexResult = computeDifficulty(complexLine)

      // Complex sentence should have higher difficulty due to subjunctive
      expect(complexResult.difficultyScore).toBeGreaterThanOrEqual(simpleResult.difficultyScore)
    })

    it('should handle repeated words correctly', () => {
      const repeatedWords = [analyzeLine('La la la la la', 0)]
      const result = computeDifficulty(repeatedWords)

      expect(result.metrics.wordCount).toBe(5)
      expect(result.metrics.uniqueWordCount).toBe(1)
      expect(result.metrics.typeTokenRatio).toBe(0.2) // 1/5
    })
  })

  describe('assignLevel', () => {
    it('should assign correct levels based on difficulty score', () => {
      expect(assignLevel(1.0)).toBe(1)
      expect(assignLevel(5.5)).toBe(6)
      expect(assignLevel(10.0)).toBe(10)
      expect(assignLevel(0.5)).toBe(1) // Floor at 1
      expect(assignLevel(10.7)).toBe(10) // Ceiling at 10
    })

    it('should round to nearest integer', () => {
      expect(assignLevel(3.4)).toBe(3)
      expect(assignLevel(3.6)).toBe(4)
      expect(assignLevel(7.5)).toBe(8)
    })
  })

  describe('Difficulty progression', () => {
    const testCases = [
      { text: 'Hola', expectedLevel: [1, 3] },
      { text: 'Me gusta la música', expectedLevel: [1, 4] },
      { text: 'Si fuera rico compraría una casa grande', expectedLevel: [5, 10] },
      { text: 'Aunque hubiese estudiado más no habría aprobado', expectedLevel: [7, 10] }
    ]

    testCases.forEach(({ text, expectedLevel }) => {
      it(`should classify "${text}" within expected range`, () => {
        const parsedLines = [analyzeLine(text, 0)]
        const result = computeDifficulty(parsedLines)
        const level = assignLevel(result.difficultyScore)
        
        expect(level).toBeGreaterThanOrEqual(expectedLevel[0])
        expect(level).toBeLessThanOrEqual(expectedLevel[1])
      })
    })
  })

  describe('Scoring components', () => {
    it('should detect verbs correctly', () => {
      const verbSentence = [analyzeLine('Camino por la calle', 0)]
      const nounSentence = [analyzeLine('El camino es largo', 0)]

      const verbResult = computeDifficulty(verbSentence)
      const nounResult = computeDifficulty(nounSentence)

      expect(verbResult.metrics.verbDensity).toBeGreaterThan(0)
      expect(verbResult.metrics.verbDensity).toBeGreaterThan(nounResult.metrics.verbDensity)
    })

    it('should count unique words vs total words', () => {
      const uniqueWords = [analyzeLine('Uno dos tres cuatro', 0)]
      const repeatedWords = [analyzeLine('Uno uno uno uno', 0)]

      const uniqueResult = computeDifficulty(uniqueWords)
      const repeatedResult = computeDifficulty(repeatedWords)

      expect(uniqueResult.metrics.typeTokenRatio).toBeGreaterThan(repeatedResult.metrics.typeTokenRatio)
    })
  })
})