export interface LevelTag {
  label: string
  color?: string
}

export interface LevelTags {
  grammar: LevelTag[]
  themes: LevelTag[]
  focus: string
}

export const levelTags: Record<number, LevelTags> = {
  1: {
    grammar: [
      { label: 'Present Tense' },
      { label: 'Basic Pronouns' },
      { label: 'Simple Sentences' }
    ],
    themes: [
      { label: 'Love & Life' },
      { label: 'Dance & Music' },
      { label: 'Everyday Vocabulary' }
    ],
    focus: 'Foundation vocabulary and basic sentence structures'
  },
  2: {
    grammar: [
      { label: 'Past Tense' },
      { label: 'Object Pronouns' },
      { label: 'Possessives' }
    ],
    themes: [
      { label: 'Emotions' },
      { label: 'Nature' },
      { label: 'Relationships' }
    ],
    focus: 'Introduction to past tense and emotional expressions'
  },
  3: {
    grammar: [
      { label: 'Multiple Tenses' },
      { label: 'Ser vs Estar' },
      { label: 'Subjunctive Basics' }
    ],
    themes: [
      { label: 'Complex Emotions' },
      { label: 'Time Expressions' },
      { label: 'Abstract Concepts' }
    ],
    focus: 'Past tense variations and subjunctive mood introduction'
  },
  4: {
    grammar: [
      { label: 'Advanced Subjunctive' },
      { label: 'Por vs Para' },
      { label: 'Complex Conjugations' }
    ],
    themes: [
      { label: 'Cultural Expressions' },
      { label: 'Idiomatic Phrases' },
      { label: 'Poetic Language' }
    ],
    focus: 'Advanced verb forms and cultural expressions'
  },
  5: {
    grammar: [
      { label: 'Colloquial Forms' },
      { label: 'Regional Variations' },
      { label: 'Mixed Registers' }
    ],
    themes: [
      { label: 'Urban Slang' },
      { label: 'Contemporary Culture' },
      { label: 'Social Commentary' }
    ],
    focus: 'Contemporary slang and regional language variations'
  }
}

export function getLevelTags(level: number): LevelTags | null {
  return levelTags[level] || null
}