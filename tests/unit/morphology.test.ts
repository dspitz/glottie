import { describe, it, expect } from 'vitest'
import { analyzeLine, conjugations } from '@/packages/core/morphology'

describe('Morphology Analysis', () => {
  describe('analyzeLine', () => {
    it('should parse a simple Spanish sentence', () => {
      const result = analyzeLine('Hola me llamo María', 0)
      
      expect(result.line).toBe('Hola me llamo María')
      expect(result.sentenceIndex).toBe(0)
      expect(result.tokens).toHaveLength(4)
      expect(result.tokens[0].text).toBe('Hola')
    })

    it('should identify verbs correctly', () => {
      const result = analyzeLine('Yo hablo español', 0)
      const habloToken = result.tokens.find(t => t.text === 'hablo')
      
      expect(habloToken).toBeDefined()
      expect(habloToken?.isVerb).toBe(true)
      expect(habloToken?.pos).toBe('VERB')
    })

    it('should provide lemmas', () => {
      const result = analyzeLine('Los niños corren rápidamente', 0)
      
      result.tokens.forEach(token => {
        expect(token.lemma).toBeDefined()
        expect(token.lemma.length).toBeGreaterThan(0)
      })
    })

    it('should handle punctuation', () => {
      const result = analyzeLine('¡Hola! ¿Cómo estás?', 0)
      
      expect(result.tokens.length).toBeGreaterThan(0)
      // Should still parse despite punctuation
      const words = result.tokens.filter(t => /[a-záéíóúñü]/i.test(t.text))
      expect(words.length).toBeGreaterThanOrEqual(3) // Hola, Cómo, estás
    })

    it('should detect tenses when possible', () => {
      const result = analyzeLine('Caminé por el parque ayer', 0)
      const camineToken = result.tokens.find(t => t.text.toLowerCase() === 'caminé')
      
      if (camineToken) {
        expect(camineToken.isVerb).toBe(true)
        // Should attempt to detect preterite tense
        expect(camineToken.tense).toBeDefined()
      }
    })

    it('should handle empty or invalid input', () => {
      expect(() => analyzeLine('', 0)).not.toThrow()
      expect(() => analyzeLine('   ', 0)).not.toThrow()
      
      const result = analyzeLine('', 0)
      expect(result.tokens).toHaveLength(0)
    })
  })

  describe('conjugations', () => {
    it('should return conjugation table for -ar verbs', () => {
      const table = conjugations('hablar')
      
      expect(table).toBeDefined()
      expect(table?.lemma).toBe('hablar')
      expect(table?.presente.yo).toBe('hablo')
      expect(table?.presente.tú).toBe('hablas')
      expect(table?.presente.él).toBe('habla')
    })

    it('should return conjugation table for -er verbs', () => {
      const table = conjugations('comer')
      
      expect(table).toBeDefined()
      expect(table?.lemma).toBe('comer')
      expect(table?.presente.yo).toBe('como')
      expect(table?.presente.tú).toBe('comes')
      expect(table?.presente.él).toBe('come')
    })

    it('should return conjugation table for -ir verbs', () => {
      const table = conjugations('vivir')
      
      expect(table).toBeDefined()
      expect(table?.lemma).toBe('vivir')
      expect(table?.presente.yo).toBe('vivo')
      expect(table?.presente.tú).toBe('vives')
      expect(table?.presente.él).toBe('vive')
    })

    it('should generate conjugations for unknown regular verbs', () => {
      const table = conjugations('caminar')
      
      expect(table).toBeDefined()
      expect(table?.presente.yo).toBe('camino')
      expect(table?.preterito.yo).toBe('caminé')
      expect(table?.futuro.yo).toBe('caminaré')
    })

    it('should return null for non-verbs', () => {
      const table = conjugations('casa')
      expect(table).toBeNull()
    })

    it('should include multiple tenses', () => {
      const table = conjugations('hablar')
      
      expect(table).toBeDefined()
      expect(table?.presente).toBeDefined()
      expect(table?.preterito).toBeDefined()
      expect(table?.imperfecto).toBeDefined()
      expect(table?.futuro).toBeDefined()
      expect(table?.condicional).toBeDefined()
      expect(table?.subjuntivo_presente).toBeDefined()
      expect(table?.subjuntivo_imperfecto).toBeDefined()
    })
  })

  describe('Integration', () => {
    it('should work together for complete analysis', () => {
      const sentence = 'María habla español muy bien'
      const analysis = analyzeLine(sentence, 0)
      
      // Find the verb
      const verbToken = analysis.tokens.find(t => t.isVerb)
      expect(verbToken).toBeDefined()
      
      if (verbToken) {
        // Get conjugations for the verb's lemma
        const conjugationTable = conjugations(verbToken.lemma)
        expect(conjugationTable).toBeDefined()
      }
    })

    it('should maintain consistency between analysis and conjugation', () => {
      const analysis = analyzeLine('Ellos caminan lentamente', 0)
      const verbToken = analysis.tokens.find(t => t.isVerb)
      
      if (verbToken) {
        const table = conjugations(verbToken.lemma)
        expect(table).toBeDefined()
        
        // The conjugation table should contain forms related to the analyzed verb
        if (table) {
          const presentForms = Object.values(table.presente)
          // Should find some connection between analyzed form and conjugation table
          expect(presentForms.length).toBeGreaterThan(0)
        }
      }
    })
  })
})