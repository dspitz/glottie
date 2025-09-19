#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

interface ManualTranslation {
  songId: string
  artist: string
  title: string
  translations: string[]
}

// Directory for storing manual translations
const TRANSLATIONS_DIR = path.join(__dirname, 'manual-translations')

// Ensure translations directory exists
if (!fs.existsSync(TRANSLATIONS_DIR)) {
  fs.mkdirSync(TRANSLATIONS_DIR, { recursive: true })
}

async function loadTranslation(filename: string): Promise<ManualTranslation | null> {
  const filePath = path.join(TRANSLATIONS_DIR, filename)
  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`Error loading translation from ${filename}:`, error)
    return null
  }
}

async function saveTranslation(translation: ManualTranslation) {
  const filename = `${translation.artist.toLowerCase().replace(/\s+/g, '-')}-${translation.title.toLowerCase().replace(/\s+/g, '-')}.json`
  const filePath = path.join(TRANSLATIONS_DIR, filename)

  fs.writeFileSync(filePath, JSON.stringify(translation, null, 2))
  console.log(`✅ Saved translation to ${filename}`)
  return filename
}

async function applyTranslation(translation: ManualTranslation) {
  const { songId, translations } = translation

  // Get the song to verify line count
  const song = await prisma.song.findUnique({
    where: { id: songId }
  })

  if (!song || !song.lyricsRaw) {
    console.error(`Song ${songId} not found or has no lyrics`)
    return false
  }

  // Parse original lyrics
  let originalLines: string[] = []
  try {
    const parsed = JSON.parse(song.lyricsRaw)
    if (parsed.lines && Array.isArray(parsed.lines)) {
      originalLines = parsed.lines
    }
  } catch {
    // Try plain text fallback
    originalLines = song.lyricsRaw.split('\n').filter(l => l !== undefined)
  }

  if (originalLines.length !== translations.length) {
    console.error(`Line count mismatch for ${song.title}!`)
    console.error(`Original: ${originalLines.length} lines, Translation: ${translations.length} lines`)
    return false
  }

  // Delete existing translations
  await prisma.translation.deleteMany({
    where: {
      songId: songId,
      targetLang: 'en'
    }
  })

  // Create new manual translation
  await prisma.translation.create({
    data: {
      songId: songId,
      targetLang: 'en',
      lyricsLines: JSON.stringify(translations),
      title: translation.title,
      provider: 'manual',
      confidence: 1.0
    }
  })

  console.log(`✅ Applied ${translations.length} manual translations for ${song.title}`)
  return true
}

async function listAvailableTranslations() {
  const files = fs.readdirSync(TRANSLATIONS_DIR).filter(f => f.endsWith('.json'))

  console.log('\n📚 Available Manual Translations:')
  console.log('================================')

  for (const file of files) {
    const translation = await loadTranslation(file)
    if (translation) {
      console.log(`- ${translation.artist} - ${translation.title} (${translation.translations.length} lines)`)
      console.log(`  File: ${file}`)
      console.log(`  Song ID: ${translation.songId}`)
    }
  }

  if (files.length === 0) {
    console.log('No manual translations found.')
  }

  return files
}

async function applyAllTranslations() {
  const files = fs.readdirSync(TRANSLATIONS_DIR).filter(f => f.endsWith('.json'))

  console.log(`\n🔄 Applying ${files.length} manual translations...`)

  let successful = 0
  let failed = 0

  for (const file of files) {
    const translation = await loadTranslation(file)
    if (translation) {
      console.log(`\nProcessing: ${translation.artist} - ${translation.title}`)
      const result = await applyTranslation(translation)
      if (result) {
        successful++
      } else {
        failed++
      }
    }
  }

  console.log(`\n✅ Summary: ${successful} successful, ${failed} failed`)
}

async function createTranslationTemplate(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId }
  })

  if (!song || !song.lyricsRaw) {
    console.error('Song not found or has no lyrics')
    return
  }

  // Parse original lyrics
  let originalLines: string[] = []
  try {
    const parsed = JSON.parse(song.lyricsRaw)
    if (parsed.lines && Array.isArray(parsed.lines)) {
      originalLines = parsed.lines
    }
  } catch {
    originalLines = song.lyricsRaw.split('\n').filter(l => l !== undefined)
  }

  const template: ManualTranslation = {
    songId: song.id,
    artist: song.artist,
    title: song.title,
    translations: originalLines.map(line => `[TRANSLATE: ${line}]`)
  }

  const filename = `template-${song.artist.toLowerCase().replace(/\s+/g, '-')}-${song.title.toLowerCase().replace(/\s+/g, '-')}.json`
  const filePath = path.join(TRANSLATIONS_DIR, filename)

  fs.writeFileSync(filePath, JSON.stringify(template, null, 2))

  console.log(`\n📝 Template created: ${filename}`)
  console.log(`Song: ${song.artist} - ${song.title}`)
  console.log(`Lines to translate: ${originalLines.length}`)
  console.log(`\nEdit the file and replace [TRANSLATE: ...] with English translations`)
  console.log(`Then run: npm run apply-translation ${filename}`)
}

// Command line interface
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  switch (command) {
    case 'list':
      await listAvailableTranslations()
      break

    case 'apply':
      if (arg) {
        const translation = await loadTranslation(arg)
        if (translation) {
          await applyTranslation(translation)
        } else {
          console.error(`Translation file not found: ${arg}`)
        }
      } else {
        await applyAllTranslations()
      }
      break

    case 'template':
      if (arg) {
        await createTranslationTemplate(arg)
      } else {
        console.error('Please provide a song ID')
      }
      break

    default:
      console.log('Manual Translation System')
      console.log('========================')
      console.log('')
      console.log('Commands:')
      console.log('  list                  - List all available manual translations')
      console.log('  apply [filename]      - Apply a specific translation (or all if no filename)')
      console.log('  template <songId>     - Create a translation template for a song')
      console.log('')
      console.log('Examples:')
      console.log('  npx tsx scripts/manualTranslationSystem.ts list')
      console.log('  npx tsx scripts/manualTranslationSystem.ts apply bailando.json')
      console.log('  npx tsx scripts/manualTranslationSystem.ts apply')
      console.log('  npx tsx scripts/manualTranslationSystem.ts template cmfm3ztww00048mv3y4sn8tpl')
  }

  await prisma.$disconnect()
}

main().catch(console.error)