#!/usr/bin/env tsx

import { translate, batchTranslate } from '../packages/adapters/translate'

async function testOpenAITranslation() {
  // Check if API key is provided
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not set in environment')
    console.log('\nTo test OpenAI translation, run:')
    console.log('OPENAI_API_KEY="your-key-here" npx tsx scripts/testOpenAITranslation.ts')
    console.log('\nOr for the hydration script:')
    console.log('DATABASE_URL="file:./dev.db" TRANSLATOR=openai OPENAI_API_KEY="your-key-here" npx tsx scripts/songHydration.ts cmfm3ztww00048mv3y4sn8tpl')
    return
  }

  // Set environment variables to use OpenAI
  process.env.TRANSLATOR = 'openai'

  console.log('Testing OpenAI Translation (GPT-3.5-turbo)')
  console.log('============================================\n')

  // Test individual translations
  const testLines = [
    "Bailando",
    "Tu cuerpo y el mío llenando el vacío",
    "Yo quiero estar contigo",
    "Gente de Zona",
    "One love",
    "La cerveza y el tequila"
  ]

  console.log('Individual Translation Tests:')
  for (const line of testLines) {
    try {
      const result = await translate(line, 'en')
      console.log(`  Spanish: "${line}"`)
      console.log(`  English: "${result.text}"`)
      console.log(`  Provider: ${result.provider}\n`)
    } catch (error: any) {
      console.error(`  Error translating "${line}": ${error.message}\n`)
    }
  }

  // Test batch translation
  console.log('\nBatch Translation Test:')
  try {
    const batchResults = await batchTranslate(testLines, 'en')
    console.log(`  Batch translated ${batchResults.length} lines:`)
    batchResults.forEach((result, i) => {
      console.log(`    ${i + 1}. "${testLines[i]}" → "${result.text}"`)
    })
  } catch (error: any) {
    console.error(`  Batch translation error: ${error.message}`)
  }
}

testOpenAITranslation().catch(console.error)