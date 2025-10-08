import { NextRequest, NextResponse } from 'next/server'
import { define } from '@/packages/adapters/dictionary'

// Spanish verb conjugation data (expanded for all tenses)
const verbConjugations: { [key: string]: any } = {
  'hablar': {
    presente: { yo: 'hablo', tu: 'hablas', el: 'habla', nosotros: 'hablamos', vosotros: 'habláis', ellos: 'hablan' },
    preterito: { yo: 'hablé', tu: 'hablaste', el: 'habló', nosotros: 'hablamos', vosotros: 'hablasteis', ellos: 'hablaron' },
    imperfecto: { yo: 'hablaba', tu: 'hablabas', el: 'hablaba', nosotros: 'hablábamos', vosotros: 'hablabais', ellos: 'hablaban' },
    futuro: { yo: 'hablaré', tu: 'hablarás', el: 'hablará', nosotros: 'hablaremos', vosotros: 'hablaréis', ellos: 'hablarán' },
    condicional: { yo: 'hablaría', tu: 'hablarías', el: 'hablaría', nosotros: 'hablaríamos', vosotros: 'hablaríais', ellos: 'hablarían' },
    subjuntivo_presente: { yo: 'hable', tu: 'hables', el: 'hable', nosotros: 'hablemos', vosotros: 'habléis', ellos: 'hablen' },
    subjuntivo_imperfecto: { yo: 'hablara', tu: 'hablaras', el: 'hablara', nosotros: 'habláramos', vosotros: 'hablarais', ellos: 'hablaran' },
    imperativo: { tu: 'habla', usted: 'hable', nosotros: 'hablemos', vosotros: 'hablad', ustedes: 'hablen' },
    gerundio: 'hablando',
    participio: 'hablado'
  },
  'comer': {
    presente: { yo: 'como', tu: 'comes', el: 'come', nosotros: 'comemos', vosotros: 'coméis', ellos: 'comen' },
    preterito: { yo: 'comí', tu: 'comiste', el: 'comió', nosotros: 'comimos', vosotros: 'comisteis', ellos: 'comieron' },
    imperfecto: { yo: 'comía', tu: 'comías', el: 'comía', nosotros: 'comíamos', vosotros: 'comíais', ellos: 'comían' },
    futuro: { yo: 'comeré', tu: 'comerás', el: 'comerá', nosotros: 'comeremos', vosotros: 'comeréis', ellos: 'comerán' },
    condicional: { yo: 'comería', tu: 'comerías', el: 'comería', nosotros: 'comeríamos', vosotros: 'comeríais', ellos: 'comerían' },
    subjuntivo_presente: { yo: 'coma', tu: 'comas', el: 'coma', nosotros: 'comamos', vosotros: 'comáis', ellos: 'coman' },
    subjuntivo_imperfecto: { yo: 'comiera', tu: 'comieras', el: 'comiera', nosotros: 'comiéramos', vosotros: 'comierais', ellos: 'comieran' },
    imperativo: { tu: 'come', usted: 'coma', nosotros: 'comamos', vosotros: 'comed', ustedes: 'coman' },
    gerundio: 'comiendo',
    participio: 'comido'
  },
  'vivir': {
    presente: { yo: 'vivo', tu: 'vives', el: 'vive', nosotros: 'vivimos', vosotros: 'vivís', ellos: 'viven' },
    preterito: { yo: 'viví', tu: 'viviste', el: 'vivió', nosotros: 'vivimos', vosotros: 'vivisteis', ellos: 'vivieron' },
    imperfecto: { yo: 'vivía', tu: 'vivías', el: 'vivía', nosotros: 'vivíamos', vosotros: 'vivíais', ellos: 'vivían' },
    futuro: { yo: 'viviré', tu: 'vivirás', el: 'vivirá', nosotros: 'viviremos', vosotros: 'viviréis', ellos: 'vivirán' },
    condicional: { yo: 'viviría', tu: 'vivirías', el: 'viviría', nosotros: 'viviríamos', vosotros: 'viviríais', ellos: 'vivirían' },
    subjuntivo_presente: { yo: 'viva', tu: 'vivas', el: 'viva', nosotros: 'vivamos', vosotros: 'viváis', ellos: 'vivan' },
    subjuntivo_imperfecto: { yo: 'viviera', tu: 'vivieras', el: 'viviera', nosotros: 'viviéramos', vosotros: 'vivierais', ellos: 'vivieran' },
    imperativo: { tu: 'vive', usted: 'viva', nosotros: 'vivamos', vosotros: 'vivid', ustedes: 'vivan' },
    gerundio: 'viviendo',
    participio: 'vivido'
  },
  'ser': {
    presente: { yo: 'soy', tu: 'eres', el: 'es', nosotros: 'somos', vosotros: 'sois', ellos: 'son' },
    preterito: { yo: 'fui', tu: 'fuiste', el: 'fue', nosotros: 'fuimos', vosotros: 'fuisteis', ellos: 'fueron' },
    imperfecto: { yo: 'era', tu: 'eras', el: 'era', nosotros: 'éramos', vosotros: 'erais', ellos: 'eran' },
    futuro: { yo: 'seré', tu: 'serás', el: 'será', nosotros: 'seremos', vosotros: 'seréis', ellos: 'serán' },
    condicional: { yo: 'sería', tu: 'serías', el: 'sería', nosotros: 'seríamos', vosotros: 'seríais', ellos: 'serían' },
    subjuntivo_presente: { yo: 'sea', tu: 'seas', el: 'sea', nosotros: 'seamos', vosotros: 'seáis', ellos: 'sean' },
    subjuntivo_imperfecto: { yo: 'fuera', tu: 'fueras', el: 'fuera', nosotros: 'fuéramos', vosotros: 'fuerais', ellos: 'fueran' },
    imperativo: { tu: 'sé', usted: 'sea', nosotros: 'seamos', vosotros: 'sed', ustedes: 'sean' },
    gerundio: 'siendo',
    participio: 'sido'
  },
  'estar': {
    presente: { yo: 'estoy', tu: 'estás', el: 'está', nosotros: 'estamos', vosotros: 'estáis', ellos: 'están' },
    preterito: { yo: 'estuve', tu: 'estuviste', el: 'estuvo', nosotros: 'estuvimos', vosotros: 'estuvisteis', ellos: 'estuvieron' },
    imperfecto: { yo: 'estaba', tu: 'estabas', el: 'estaba', nosotros: 'estábamos', vosotros: 'estabais', ellos: 'estaban' },
    futuro: { yo: 'estaré', tu: 'estarás', el: 'estará', nosotros: 'estaremos', vosotros: 'estaréis', ellos: 'estarán' },
    condicional: { yo: 'estaría', tu: 'estarías', el: 'estaría', nosotros: 'estaríamos', vosotros: 'estaríais', ellos: 'estarían' },
    subjuntivo_presente: { yo: 'esté', tu: 'estés', el: 'esté', nosotros: 'estemos', vosotros: 'estéis', ellos: 'estén' },
    subjuntivo_imperfecto: { yo: 'estuviera', tu: 'estuvieras', el: 'estuviera', nosotros: 'estuviéramos', vosotros: 'estuvierais', ellos: 'estuvieran' },
    imperativo: { tu: 'está', usted: 'esté', nosotros: 'estemos', vosotros: 'estad', ustedes: 'estén' },
    gerundio: 'estando',
    participio: 'estado'
  },
  'tener': {
    presente: { yo: 'tengo', tu: 'tienes', el: 'tiene', nosotros: 'tenemos', vosotros: 'tenéis', ellos: 'tienen' },
    preterito: { yo: 'tuve', tu: 'tuviste', el: 'tuvo', nosotros: 'tuvimos', vosotros: 'tuvisteis', ellos: 'tuvieron' },
    imperfecto: { yo: 'tenía', tu: 'tenías', el: 'tenía', nosotros: 'teníamos', vosotros: 'teníais', ellos: 'tenían' },
    futuro: { yo: 'tendré', tu: 'tendrás', el: 'tendrá', nosotros: 'tendremos', vosotros: 'tendréis', ellos: 'tendrán' },
    condicional: { yo: 'tendría', tu: 'tendrías', el: 'tendría', nosotros: 'tendríamos', vosotros: 'tendríais', ellos: 'tendrían' },
    subjuntivo_presente: { yo: 'tenga', tu: 'tengas', el: 'tenga', nosotros: 'tengamos', vosotros: 'tengáis', ellos: 'tengan' },
    subjuntivo_imperfecto: { yo: 'tuviera', tu: 'tuvieras', el: 'tuviera', nosotros: 'tuviéramos', vosotros: 'tuvierais', ellos: 'tuvieran' },
    imperativo: { tu: 'ten', usted: 'tenga', nosotros: 'tengamos', vosotros: 'tened', ustedes: 'tengan' },
    gerundio: 'teniendo',
    participio: 'tenido'
  },
  'hacer': {
    presente: { yo: 'hago', tu: 'haces', el: 'hace', nosotros: 'hacemos', vosotros: 'hacéis', ellos: 'hacen' },
    preterito: { yo: 'hice', tu: 'hiciste', el: 'hizo', nosotros: 'hicimos', vosotros: 'hicisteis', ellos: 'hicieron' },
    imperfecto: { yo: 'hacía', tu: 'hacías', el: 'hacía', nosotros: 'hacíamos', vosotros: 'hacíais', ellos: 'hacían' },
    futuro: { yo: 'haré', tu: 'harás', el: 'hará', nosotros: 'haremos', vosotros: 'haréis', ellos: 'harán' },
    condicional: { yo: 'haría', tu: 'harías', el: 'haría', nosotros: 'haríamos', vosotros: 'haríais', ellos: 'harían' },
    subjuntivo_presente: { yo: 'haga', tu: 'hagas', el: 'haga', nosotros: 'hagamos', vosotros: 'hagáis', ellos: 'hagan' },
    subjuntivo_imperfecto: { yo: 'hiciera', tu: 'hicieras', el: 'hiciera', nosotros: 'hiciéramos', vosotros: 'hicierais', ellos: 'hicieran' },
    imperativo: { tu: 'haz', usted: 'haga', nosotros: 'hagamos', vosotros: 'haced', ustedes: 'hagan' },
    gerundio: 'haciendo',
    participio: 'hecho'
  },
  'querer': {
    presente: { yo: 'quiero', tu: 'quieres', el: 'quiere', nosotros: 'queremos', vosotros: 'queréis', ellos: 'quieren' },
    preterito: { yo: 'quise', tu: 'quisiste', el: 'quiso', nosotros: 'quisimos', vosotros: 'quisisteis', ellos: 'quisieron' },
    imperfecto: { yo: 'quería', tu: 'querías', el: 'quería', nosotros: 'queríamos', vosotros: 'queríais', ellos: 'querían' },
    futuro: { yo: 'querré', tu: 'querrás', el: 'querrá', nosotros: 'querremos', vosotros: 'querréis', ellos: 'querrán' },
    condicional: { yo: 'querría', tu: 'querrías', el: 'querría', nosotros: 'querríamos', vosotros: 'querríais', ellos: 'querrían' },
    subjuntivo_presente: { yo: 'quiera', tu: 'quieras', el: 'quiera', nosotros: 'queramos', vosotros: 'queráis', ellos: 'quieran' },
    subjuntivo_imperfecto: { yo: 'quisiera', tu: 'quisieras', el: 'quisiera', nosotros: 'quisiéramos', vosotros: 'quisierais', ellos: 'quisieran' },
    imperativo: { tu: 'quiere', usted: 'quiera', nosotros: 'queramos', vosotros: 'quered', ustedes: 'quieran' },
    gerundio: 'queriendo',
    participio: 'querido'
  }
}

// Helper to detect verb infinitive from conjugated form
function findVerbRoot(word: string): string | null {
  const lowerWord = word.toLowerCase()

  // Check each verb's conjugations
  for (const [infinitive, conjugations] of Object.entries(verbConjugations)) {
    // Check all tenses
    for (const [tense, forms] of Object.entries(conjugations)) {
      if (typeof forms === 'string' && forms === lowerWord) {
        return infinitive
      }
      if (typeof forms === 'object' && forms !== null) {
        for (const form of Object.values(forms)) {
          if (form === lowerWord) {
            return infinitive
          }
        }
      }
    }
  }

  // Check if it's already an infinitive
  if (verbConjugations[lowerWord]) {
    return lowerWord
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, lang = 'es' } = body

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    // Get base definition
    const definition = await define(word, lang)

    // Check if word is a verb or verb conjugation
    const verbRoot = findVerbRoot(word.toLowerCase())

    // Add conjugations if it's a verb
    if (verbRoot && verbConjugations[verbRoot]) {
      definition.conjugations = verbConjugations[verbRoot]
      definition.lemma = verbRoot
      definition.pos = 'VERB'
    }

    return NextResponse.json(definition)
  } catch (error) {
    // console.error('Definition API error:', error)

    return NextResponse.json(
      {
        error: 'Definition failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}