export interface VerbConjugation {
  yo: string
  tú: string
  él: string
  nosotros: string
  vosotros: string
  ellos: string
}

export interface VerbExample {
  infinitive: string
  english: string
  conjugations: VerbConjugation
}

export interface Tense {
  id: string
  name: string
  nameSpanish: string
  description: string
  briefUsage: string
  examplePhrase: {
    spanish: string
    english: string
  }
  whenToUse: string[]
  regularPatterns: {
    ar: VerbConjugation
    er: VerbConjugation
    ir: VerbConjugation
  }
  regularExamples: VerbExample[]
  irregularExamples: VerbExample[]
  exampleSentences: Array<{
    spanish: string
    english: string
  }>
}

export const tenses: Tense[] = [
  {
    id: 'present',
    name: 'Present',
    nameSpanish: 'Presente',
    description: 'Describes actions happening now or habitual actions',
    briefUsage: 'For current or habitual actions',
    examplePhrase: {
      spanish: 'Yo hablo español',
      english: 'I speak Spanish'
    },
    whenToUse: [
      'Current actions or states',
      'Habitual or repeated actions',
      'General truths',
      'Scheduled future events'
    ],
    regularPatterns: {
      ar: { yo: '-o', tú: '-as', él: '-a', nosotros: '-amos', vosotros: '-áis', ellos: '-an' },
      er: { yo: '-o', tú: '-es', él: '-e', nosotros: '-emos', vosotros: '-éis', ellos: '-en' },
      ir: { yo: '-o', tú: '-es', él: '-e', nosotros: '-imos', vosotros: '-ís', ellos: '-en' }
    },
    regularExamples: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        conjugations: { yo: 'hablo', tú: 'hablas', él: 'habla', nosotros: 'hablamos', vosotros: 'habláis', ellos: 'hablan' }
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        conjugations: { yo: 'como', tú: 'comes', él: 'come', nosotros: 'comemos', vosotros: 'coméis', ellos: 'comen' }
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        conjugations: { yo: 'vivo', tú: 'vives', él: 'vive', nosotros: 'vivimos', vosotros: 'vivís', ellos: 'viven' }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'ser',
        english: 'to be',
        conjugations: { yo: 'soy', tú: 'eres', él: 'es', nosotros: 'somos', vosotros: 'sois', ellos: 'son' }
      },
      {
        infinitive: 'estar',
        english: 'to be',
        conjugations: { yo: 'estoy', tú: 'estás', él: 'está', nosotros: 'estamos', vosotros: 'estáis', ellos: 'están' }
      },
      {
        infinitive: 'tener',
        english: 'to have',
        conjugations: { yo: 'tengo', tú: 'tienes', él: 'tiene', nosotros: 'tenemos', vosotros: 'tenéis', ellos: 'tienen' }
      },
      {
        infinitive: 'ir',
        english: 'to go',
        conjugations: { yo: 'voy', tú: 'vas', él: 'va', nosotros: 'vamos', vosotros: 'vais', ellos: 'van' }
      }
    ],
    exampleSentences: [
      { spanish: 'Yo hablo español todos los días', english: 'I speak Spanish every day' },
      { spanish: 'Ella come frutas y verduras', english: 'She eats fruits and vegetables' },
      { spanish: 'Nosotros vivimos en Madrid', english: 'We live in Madrid' }
    ]
  },
  {
    id: 'preterite',
    name: 'Preterite',
    nameSpanish: 'Pretérito',
    description: 'Describes completed actions in the past',
    briefUsage: 'For completed past actions',
    examplePhrase: {
      spanish: 'Yo hablé con ella',
      english: 'I spoke with her'
    },
    whenToUse: [
      'Actions completed at a specific time',
      'Actions with a clear beginning and end',
      'Series of completed actions',
      'Interrupting actions'
    ],
    regularPatterns: {
      ar: { yo: '-é', tú: '-aste', él: '-ó', nosotros: '-amos', vosotros: '-asteis', ellos: '-aron' },
      er: { yo: '-í', tú: '-iste', él: '-ió', nosotros: '-imos', vosotros: '-isteis', ellos: '-ieron' },
      ir: { yo: '-í', tú: '-iste', él: '-ió', nosotros: '-imos', vosotros: '-isteis', ellos: '-ieron' }
    },
    regularExamples: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        conjugations: { yo: 'hablé', tú: 'hablaste', él: 'habló', nosotros: 'hablamos', vosotros: 'hablasteis', ellos: 'hablaron' }
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        conjugations: { yo: 'comí', tú: 'comiste', él: 'comió', nosotros: 'comimos', vosotros: 'comisteis', ellos: 'comieron' }
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        conjugations: { yo: 'viví', tú: 'viviste', él: 'vivió', nosotros: 'vivimos', vosotros: 'vivisteis', ellos: 'vivieron' }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'ser',
        english: 'to be',
        conjugations: { yo: 'fui', tú: 'fuiste', él: 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', ellos: 'fueron' }
      },
      {
        infinitive: 'ir',
        english: 'to go',
        conjugations: { yo: 'fui', tú: 'fuiste', él: 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', ellos: 'fueron' }
      },
      {
        infinitive: 'hacer',
        english: 'to do/make',
        conjugations: { yo: 'hice', tú: 'hiciste', él: 'hizo', nosotros: 'hicimos', vosotros: 'hicisteis', ellos: 'hicieron' }
      },
      {
        infinitive: 'tener',
        english: 'to have',
        conjugations: { yo: 'tuve', tú: 'tuviste', él: 'tuvo', nosotros: 'tuvimos', vosotros: 'tuvisteis', ellos: 'tuvieron' }
      }
    ],
    exampleSentences: [
      { spanish: 'Ayer hablé con mi madre', english: 'Yesterday I spoke with my mother' },
      { spanish: 'Comimos paella en Valencia', english: 'We ate paella in Valencia' },
      { spanish: 'Ella vivió en Barcelona durante cinco años', english: 'She lived in Barcelona for five years' }
    ]
  },
  {
    id: 'imperfect',
    name: 'Imperfect',
    nameSpanish: 'Imperfecto',
    description: 'Describes ongoing or repeated past actions',
    briefUsage: 'For repeated or ongoing past actions',
    examplePhrase: {
      spanish: 'Yo hablaba español todos los días',
      english: 'I used to speak Spanish every day'
    },
    whenToUse: [
      'Habitual past actions',
      'Ongoing past actions without clear end',
      'Descriptions in the past',
      'Time and age in the past',
      'Background actions'
    ],
    regularPatterns: {
      ar: { yo: '-aba', tú: '-abas', él: '-aba', nosotros: '-ábamos', vosotros: '-abais', ellos: '-aban' },
      er: { yo: '-ía', tú: '-ías', él: '-ía', nosotros: '-íamos', vosotros: '-íais', ellos: '-ían' },
      ir: { yo: '-ía', tú: '-ías', él: '-ía', nosotros: '-íamos', vosotros: '-íais', ellos: '-ían' }
    },
    regularExamples: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        conjugations: { yo: 'hablaba', tú: 'hablabas', él: 'hablaba', nosotros: 'hablábamos', vosotros: 'hablabais', ellos: 'hablaban' }
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        conjugations: { yo: 'comía', tú: 'comías', él: 'comía', nosotros: 'comíamos', vosotros: 'comíais', ellos: 'comían' }
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        conjugations: { yo: 'vivía', tú: 'vivías', él: 'vivía', nosotros: 'vivíamos', vosotros: 'vivíais', ellos: 'vivían' }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'ser',
        english: 'to be',
        conjugations: { yo: 'era', tú: 'eras', él: 'era', nosotros: 'éramos', vosotros: 'erais', ellos: 'eran' }
      },
      {
        infinitive: 'ir',
        english: 'to go',
        conjugations: { yo: 'iba', tú: 'ibas', él: 'iba', nosotros: 'íbamos', vosotros: 'ibais', ellos: 'iban' }
      },
      {
        infinitive: 'ver',
        english: 'to see',
        conjugations: { yo: 'veía', tú: 'veías', él: 'veía', nosotros: 'veíamos', vosotros: 'veíais', ellos: 'veían' }
      }
    ],
    exampleSentences: [
      { spanish: 'De niño, jugaba en el parque todos los días', english: 'As a child, I used to play in the park every day' },
      { spanish: 'Ella siempre comía frutas para el desayuno', english: 'She always used to eat fruits for breakfast' },
      { spanish: 'Vivíamos en una casa grande', english: 'We used to live in a big house' }
    ]
  },
  {
    id: 'future',
    name: 'Future',
    nameSpanish: 'Futuro',
    description: 'Describes actions that will happen',
    briefUsage: 'For future actions and predictions',
    examplePhrase: {
      spanish: 'Yo hablaré mañana',
      english: 'I will speak tomorrow'
    },
    whenToUse: [
      'Actions that will occur in the future',
      'Predictions and suppositions',
      'Probability in the present',
      'Formal commands'
    ],
    regularPatterns: {
      ar: { yo: '-é', tú: '-ás', él: '-á', nosotros: '-emos', vosotros: '-éis', ellos: '-án' },
      er: { yo: '-é', tú: '-ás', él: '-á', nosotros: '-emos', vosotros: '-éis', ellos: '-án' },
      ir: { yo: '-é', tú: '-ás', él: '-á', nosotros: '-emos', vosotros: '-éis', ellos: '-án' }
    },
    regularExamples: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        conjugations: { yo: 'hablaré', tú: 'hablarás', él: 'hablará', nosotros: 'hablaremos', vosotros: 'hablaréis', ellos: 'hablarán' }
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        conjugations: { yo: 'comeré', tú: 'comerás', él: 'comerá', nosotros: 'comeremos', vosotros: 'comeréis', ellos: 'comerán' }
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        conjugations: { yo: 'viviré', tú: 'vivirás', él: 'vivirá', nosotros: 'viviremos', vosotros: 'viviréis', ellos: 'vivirán' }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'tener',
        english: 'to have',
        conjugations: { yo: 'tendré', tú: 'tendrás', él: 'tendrá', nosotros: 'tendremos', vosotros: 'tendréis', ellos: 'tendrán' }
      },
      {
        infinitive: 'hacer',
        english: 'to do/make',
        conjugations: { yo: 'haré', tú: 'harás', él: 'hará', nosotros: 'haremos', vosotros: 'haréis', ellos: 'harán' }
      },
      {
        infinitive: 'poder',
        english: 'to be able',
        conjugations: { yo: 'podré', tú: 'podrás', él: 'podrá', nosotros: 'podremos', vosotros: 'podréis', ellos: 'podrán' }
      },
      {
        infinitive: 'decir',
        english: 'to say',
        conjugations: { yo: 'diré', tú: 'dirás', él: 'dirá', nosotros: 'diremos', vosotros: 'diréis', ellos: 'dirán' }
      }
    ],
    exampleSentences: [
      { spanish: 'Mañana hablaré con el jefe', english: 'Tomorrow I will speak with the boss' },
      { spanish: 'Comeremos en ese restaurante nuevo', english: 'We will eat at that new restaurant' },
      { spanish: '¿Vivirás en España el próximo año?', english: 'Will you live in Spain next year?' }
    ]
  },
  {
    id: 'conditional',
    name: 'Conditional',
    nameSpanish: 'Condicional',
    description: 'Describes what would happen under certain conditions',
    briefUsage: 'For hypothetical situations and polite requests',
    examplePhrase: {
      spanish: 'Yo hablaría con él',
      english: 'I would speak with him'
    },
    whenToUse: [
      'Hypothetical situations',
      'Polite requests',
      'Suggestions or advice',
      'Probability in the past',
      'Future from a past perspective'
    ],
    regularPatterns: {
      ar: { yo: '-ía', tú: '-ías', él: '-ía', nosotros: '-íamos', vosotros: '-íais', ellos: '-ían' },
      er: { yo: '-ía', tú: '-ías', él: '-ía', nosotros: '-íamos', vosotros: '-íais', ellos: '-ían' },
      ir: { yo: '-ía', tú: '-ías', él: '-ía', nosotros: '-íamos', vosotros: '-íais', ellos: '-ían' }
    },
    regularExamples: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        conjugations: { yo: 'hablaría', tú: 'hablarías', él: 'hablaría', nosotros: 'hablaríamos', vosotros: 'hablaríais', ellos: 'hablarían' }
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        conjugations: { yo: 'comería', tú: 'comerías', él: 'comería', nosotros: 'comeríamos', vosotros: 'comeríais', ellos: 'comerían' }
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        conjugations: { yo: 'viviría', tú: 'vivirías', él: 'viviría', nosotros: 'viviríamos', vosotros: 'viviríais', ellos: 'vivirían' }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'tener',
        english: 'to have',
        conjugations: { yo: 'tendría', tú: 'tendrías', él: 'tendría', nosotros: 'tendríamos', vosotros: 'tendríais', ellos: 'tendrían' }
      },
      {
        infinitive: 'hacer',
        english: 'to do/make',
        conjugations: { yo: 'haría', tú: 'harías', él: 'haría', nosotros: 'haríamos', vosotros: 'haríais', ellos: 'harían' }
      },
      {
        infinitive: 'poder',
        english: 'to be able',
        conjugations: { yo: 'podría', tú: 'podrías', él: 'podría', nosotros: 'podríamos', vosotros: 'podríais', ellos: 'podrían' }
      },
      {
        infinitive: 'decir',
        english: 'to say',
        conjugations: { yo: 'diría', tú: 'dirías', él: 'diría', nosotros: 'diríamos', vosotros: 'diríais', ellos: 'dirían' }
      }
    ],
    exampleSentences: [
      { spanish: 'Me gustaría hablar con ella', english: 'I would like to speak with her' },
      { spanish: '¿Podrías ayudarme?', english: 'Could you help me?' },
      { spanish: 'Viviríamos en París si pudiéramos', english: 'We would live in Paris if we could' }
    ]
  },
  {
    id: 'present-perfect',
    name: 'Present Perfect',
    nameSpanish: 'Pretérito Perfecto',
    description: 'Describes actions that happened in the recent past or have relevance to the present',
    briefUsage: 'For recent past with present relevance',
    examplePhrase: {
      spanish: 'Yo he hablado con ella',
      english: 'I have spoken with her'
    },
    whenToUse: [
      'Recent past actions',
      'Life experiences',
      'Actions with present relevance',
      'Actions that just happened'
    ],
    regularPatterns: {
      ar: { yo: 'he -ado', tú: 'has -ado', él: 'ha -ado', nosotros: 'hemos -ado', vosotros: 'habéis -ado', ellos: 'han -ado' },
      er: { yo: 'he -ido', tú: 'has -ido', él: 'ha -ido', nosotros: 'hemos -ido', vosotros: 'habéis -ido', ellos: 'han -ido' },
      ir: { yo: 'he -ido', tú: 'has -ido', él: 'ha -ido', nosotros: 'hemos -ido', vosotros: 'habéis -ido', ellos: 'han -ido' }
    },
    regularExamples: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        conjugations: { yo: 'he hablado', tú: 'has hablado', él: 'ha hablado', nosotros: 'hemos hablado', vosotros: 'habéis hablado', ellos: 'han hablado' }
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        conjugations: { yo: 'he comido', tú: 'has comido', él: 'ha comido', nosotros: 'hemos comido', vosotros: 'habéis comido', ellos: 'han comido' }
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        conjugations: { yo: 'he vivido', tú: 'has vivido', él: 'ha vivido', nosotros: 'hemos vivido', vosotros: 'habéis vivido', ellos: 'han vivido' }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'hacer',
        english: 'to do/make',
        conjugations: { yo: 'he hecho', tú: 'has hecho', él: 'ha hecho', nosotros: 'hemos hecho', vosotros: 'habéis hecho', ellos: 'han hecho' }
      },
      {
        infinitive: 'ver',
        english: 'to see',
        conjugations: { yo: 'he visto', tú: 'has visto', él: 'ha visto', nosotros: 'hemos visto', vosotros: 'habéis visto', ellos: 'han visto' }
      },
      {
        infinitive: 'escribir',
        english: 'to write',
        conjugations: { yo: 'he escrito', tú: 'has escrito', él: 'ha escrito', nosotros: 'hemos escrito', vosotros: 'habéis escrito', ellos: 'han escrito' }
      },
      {
        infinitive: 'decir',
        english: 'to say',
        conjugations: { yo: 'he dicho', tú: 'has dicho', él: 'ha dicho', nosotros: 'hemos dicho', vosotros: 'habéis dicho', ellos: 'han dicho' }
      }
    ],
    exampleSentences: [
      { spanish: 'He hablado con mi profesor hoy', english: 'I have spoken with my teacher today' },
      { spanish: '¿Has comido paella alguna vez?', english: 'Have you ever eaten paella?' },
      { spanish: 'Hemos vivido muchas aventuras', english: 'We have lived many adventures' }
    ]
  },
  {
    id: 'present-subjunctive',
    name: 'Present Subjunctive',
    nameSpanish: 'Presente de Subjuntivo',
    description: 'Expresses doubt, desire, emotion, or uncertainty in the present',
    briefUsage: 'For doubt, desire, or emotion',
    examplePhrase: {
      spanish: 'Espero que yo hable bien',
      english: 'I hope that I speak well'
    },
    whenToUse: [
      'After expressions of doubt or uncertainty',
      'After expressions of emotion',
      'After expressions of desire or will',
      'After impersonal expressions',
      'In certain dependent clauses'
    ],
    regularPatterns: {
      ar: { yo: '-e', tú: '-es', él: '-e', nosotros: '-emos', vosotros: '-éis', ellos: '-en' },
      er: { yo: '-a', tú: '-as', él: '-a', nosotros: '-amos', vosotros: '-áis', ellos: '-an' },
      ir: { yo: '-a', tú: '-as', él: '-a', nosotros: '-amos', vosotros: '-áis', ellos: '-an' }
    },
    regularExamples: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        conjugations: { yo: 'hable', tú: 'hables', él: 'hable', nosotros: 'hablemos', vosotros: 'habléis', ellos: 'hablen' }
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        conjugations: { yo: 'coma', tú: 'comas', él: 'coma', nosotros: 'comamos', vosotros: 'comáis', ellos: 'coman' }
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        conjugations: { yo: 'viva', tú: 'vivas', él: 'viva', nosotros: 'vivamos', vosotros: 'viváis', ellos: 'vivan' }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'ser',
        english: 'to be',
        conjugations: { yo: 'sea', tú: 'seas', él: 'sea', nosotros: 'seamos', vosotros: 'seáis', ellos: 'sean' }
      },
      {
        infinitive: 'estar',
        english: 'to be',
        conjugations: { yo: 'esté', tú: 'estés', él: 'esté', nosotros: 'estemos', vosotros: 'estéis', ellos: 'estén' }
      },
      {
        infinitive: 'ir',
        english: 'to go',
        conjugations: { yo: 'vaya', tú: 'vayas', él: 'vaya', nosotros: 'vayamos', vosotros: 'vayáis', ellos: 'vayan' }
      },
      {
        infinitive: 'saber',
        english: 'to know',
        conjugations: { yo: 'sepa', tú: 'sepas', él: 'sepa', nosotros: 'sepamos', vosotros: 'sepáis', ellos: 'sepan' }
      }
    ],
    exampleSentences: [
      { spanish: 'Espero que hables con ella', english: 'I hope that you speak with her' },
      { spanish: 'Es importante que comas bien', english: 'It\'s important that you eat well' },
      { spanish: 'Quiero que vivas feliz', english: 'I want you to live happily' }
    ]
  },
  {
    id: 'imperfect-subjunctive',
    name: 'Imperfect Subjunctive',
    nameSpanish: 'Imperfecto de Subjuntivo',
    description: 'Expresses doubt, desire, or emotion in the past',
    briefUsage: 'For past doubt/desire or "if" clauses',
    examplePhrase: {
      spanish: 'Si yo hablara español...',
      english: 'If I spoke Spanish...'
    },
    whenToUse: [
      'After past expressions of doubt',
      'After past expressions of emotion',
      'After past expressions of desire',
      'In conditional sentences (si clauses)',
      'Polite requests'
    ],
    regularPatterns: {
      ar: { yo: '-ara', tú: '-aras', él: '-ara', nosotros: '-áramos', vosotros: '-arais', ellos: '-aran' },
      er: { yo: '-iera', tú: '-ieras', él: '-iera', nosotros: '-iéramos', vosotros: '-ierais', ellos: '-ieran' },
      ir: { yo: '-iera', tú: '-ieras', él: '-iera', nosotros: '-iéramos', vosotros: '-ierais', ellos: '-ieran' }
    },
    regularExamples: [
      {
        infinitive: 'hablar',
        english: 'to speak',
        conjugations: { yo: 'hablara', tú: 'hablaras', él: 'hablara', nosotros: 'habláramos', vosotros: 'hablarais', ellos: 'hablaran' }
      },
      {
        infinitive: 'comer',
        english: 'to eat',
        conjugations: { yo: 'comiera', tú: 'comieras', él: 'comiera', nosotros: 'comiéramos', vosotros: 'comierais', ellos: 'comieran' }
      },
      {
        infinitive: 'vivir',
        english: 'to live',
        conjugations: { yo: 'viviera', tú: 'vivieras', él: 'viviera', nosotros: 'viviéramos', vosotros: 'vivierais', ellos: 'vivieran' }
      }
    ],
    irregularExamples: [
      {
        infinitive: 'ser',
        english: 'to be',
        conjugations: { yo: 'fuera', tú: 'fueras', él: 'fuera', nosotros: 'fuéramos', vosotros: 'fuerais', ellos: 'fueran' }
      },
      {
        infinitive: 'ir',
        english: 'to go',
        conjugations: { yo: 'fuera', tú: 'fueras', él: 'fuera', nosotros: 'fuéramos', vosotros: 'fuerais', ellos: 'fueran' }
      },
      {
        infinitive: 'tener',
        english: 'to have',
        conjugations: { yo: 'tuviera', tú: 'tuvieras', él: 'tuviera', nosotros: 'tuviéramos', vosotros: 'tuvierais', ellos: 'tuvieran' }
      },
      {
        infinitive: 'hacer',
        english: 'to do/make',
        conjugations: { yo: 'hiciera', tú: 'hicieras', él: 'hiciera', nosotros: 'hiciéramos', vosotros: 'hicierais', ellos: 'hicieran' }
      }
    ],
    exampleSentences: [
      { spanish: 'Si hablara español, viajaría a México', english: 'If I spoke Spanish, I would travel to Mexico' },
      { spanish: 'Quería que comieras más verduras', english: 'I wanted you to eat more vegetables' },
      { spanish: 'Si viviera en España, sería muy feliz', english: 'If I lived in Spain, I would be very happy' }
    ]
  }
]
