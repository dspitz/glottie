#!/usr/bin/env tsx

/**
 * Song Hydration Script - Complete data pipeline for songs
 *
 * Usage:
 *   npx tsx scripts/songHydration.ts [songId or spotifyUrl]
 *   npx tsx scripts/songHydration.ts --all
 *   npx tsx scripts/songHydration.ts --dry-run [songId]
 *   npx tsx scripts/songHydration.ts --force [songId]
 *
 * Environment variables required:
 *   - DATABASE_URL
 *   - SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET
 *   - MUSIXMATCH_API_KEY (paid license for full lyrics)
 *   - MUSIXMATCH_FULL_LYRICS=true (for complete songs)
 *   - TRANSLATOR=openai (or deepl/google/claude)
 *   - OPENAI_API_KEY (if using OpenAI translator)
 */

import { prisma } from '../lib/prisma'
import { getLyricsByTrack } from '../packages/adapters/lyricsProvider'
import { translate, batchTranslate, generateSongSummary } from '../packages/adapters/translate'
import sharp from 'sharp'

// Types
interface HydrationOptions {
  force?: boolean
  dryRun?: boolean
  verbose?: boolean
}

interface HydrationStats {
  spotifyFetched: boolean
  colorExtracted: boolean
  lyricsFetched: boolean
  translationCreated: boolean
  errors: string[]
}

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    release_date: string
    images: { url: string; height: number; width: number }[]
  }
  preview_url: string | null
  popularity: number
  external_urls: { spotify: string }
}

interface AudioFeatures {
  danceability: number
  energy: number
  valence: number
  tempo: number
}

// Color utilities
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function constrainLightness(h: number, s: number, l: number, minL: number = 33, maxL: number = 50): [number, number, number] {
  const constrainedL = Math.min(Math.max(l, minL), maxL)
  return [h, s, constrainedL]
}

// Spotify functions
async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not found in environment variables')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json() as any
  if (!data.access_token) {
    throw new Error('Failed to get Spotify access token')
  }
  return data.access_token
}

async function getSpotifyTrack(trackId: string, token: string): Promise<SpotifyTrack | null> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) return null
    return await response.json() as SpotifyTrack
  } catch (error) {
    console.error(`Failed to get track ${trackId}:`, error)
    return null
  }
}

async function getAudioFeatures(trackId: string, token: string): Promise<AudioFeatures | null> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) return null
    return await response.json() as AudioFeatures
  } catch (error) {
    console.error(`Failed to get audio features for ${trackId}:`, error)
    return null
  }
}

async function extractColorFromAlbumArt(imageUrl: string): Promise<{
  hex: string
  rgb: string
  hsl: string
} | null> {
  try {
    // Fetch the image data
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use sharp to process the image and extract dominant color
    const { dominant } = await sharp(buffer)
      .resize(50, 50, { fit: 'cover' }) // Resize for faster processing
      .stats()

    // Get the dominant color from each channel
    const r = Math.round(dominant.r)
    const g = Math.round(dominant.g)
    const b = Math.round(dominant.b)

    // Convert to HSL and apply constraints
    let [h, s, l] = rgbToHsl(r, g, b)
    ;[h, s, l] = constrainLightness(h, s, l, 33, 50)

    // Convert back to RGB with constrained lightness
    const [finalR, finalG, finalB] = hslToRgb(h, s, l)

    // Format the colors
    const hex = rgbToHex(finalR, finalG, finalB)
    const rgb = `${finalR},${finalG},${finalB}`
    const hsl = `${Math.round(h)},${Math.round(s)},${Math.round(l)}`

    return { hex, rgb, hsl }
  } catch (error) {
    console.error('Error extracting color with sharp:', error)

    // Fallback: generate a consistent color from the URL hash
    const hash = imageUrl.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)

    const r = (hash & 0xFF0000) >> 16
    const g = (hash & 0x00FF00) >> 8
    const b = hash & 0x0000FF

    let [h, s, l] = rgbToHsl(r, g, b)
    ;[h, s, l] = constrainLightness(h, s, l, 33, 50)
    const [newR, newG, newB] = hslToRgb(h, s, l)

    return {
      hex: rgbToHex(newR, newG, newB),
      rgb: `${newR},${newG},${newB}`,
      hsl: `${Math.round(h)},${Math.round(s)},${Math.round(l)}`
    }
  }
}

// Main hydration function for a single song
async function hydrateSong(songId: string, options: HydrationOptions = {}): Promise<HydrationStats> {
  const stats: HydrationStats = {
    spotifyFetched: false,
    colorExtracted: false,
    lyricsFetched: false,
    translationCreated: false,
    errors: []
  }

  try {
    // Get song from database
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: { translations: true }
    })

    if (!song) {
      throw new Error(`Song with ID ${songId} not found`)
    }

    console.log(`\n🎵 Hydrating: "${song.title}" by ${song.artist}`)
    console.log('=' + '='.repeat(60))

    const updates: any = {}

    // 1. SPOTIFY DATA
    if (!song.spotifyId || !song.albumArt || options.force) {
      console.log('\n📡 Fetching Spotify data...')

      if (song.spotifyId) {
        const token = await getSpotifyToken()
        const track = await getSpotifyTrack(song.spotifyId, token)

        if (track) {
          // Get album art URLs
          const images = track.album.images.sort((a, b) => b.width - a.width)
          updates.albumArt = images[0]?.url
          updates.albumArtSmall = images.find(img => img.width <= 300)?.url || images[images.length - 1]?.url
          updates.previewUrl = track.preview_url
          updates.popularity = track.popularity
          updates.spotifyUrl = track.external_urls.spotify

          // Get audio features
          const features = await getAudioFeatures(song.spotifyId, token)
          if (features) {
            updates.danceability = features.danceability
            updates.energy = features.energy
            updates.valence = features.valence
            updates.tempo = features.tempo
          }

          stats.spotifyFetched = true
          console.log('  ✅ Spotify data fetched')
        } else {
          stats.errors.push('Failed to fetch Spotify track data')
        }
      } else {
        console.log('  ⚠️ No Spotify ID available')
      }
    }

    // 2. COLOR EXTRACTION
    if ((updates.albumArt || song.albumArt) && (!song.albumArtColor || options.force)) {
      console.log('\n🎨 Extracting album art color...')

      const imageUrl = updates.albumArt || song.albumArt
      const colors = await extractColorFromAlbumArt(imageUrl!)

      if (colors) {
        updates.albumArtColor = colors.hex
        updates.albumArtColorRGB = colors.rgb
        updates.albumArtColorHSL = colors.hsl
        stats.colorExtracted = true
        console.log(`  ✅ Color extracted: ${colors.hex} (HSL: ${colors.hsl})`)
      } else {
        stats.errors.push('Failed to extract color from album art')
      }
    }

    // 3. LYRICS
    if (!song.lyricsRaw || options.force) {
      console.log('\n📝 Fetching lyrics...')

      const lyricsResult = await getLyricsByTrack(song.artist, song.title)

      if (!lyricsResult.error && (lyricsResult.raw || lyricsResult.synchronized)) {
        // If we have synchronized data, store it as JSON with timing info
        if (lyricsResult.synchronized?.lines?.length > 0) {
          const structuredData = {
            lines: lyricsResult.lines,
            synchronized: lyricsResult.synchronized
          }
          updates.lyricsRaw = JSON.stringify(structuredData)
          console.log(`  ✅ Storing synchronized lyrics with timing data`)
        } else if (lyricsResult.raw) {
          // Store raw text for backward compatibility
          updates.lyricsRaw = lyricsResult.raw
        }

        updates.lyricsProvider = lyricsResult.provider
        updates.lyricsLicensed = lyricsResult.licensed && !lyricsResult.isExcerpt

        if (lyricsResult.culturalContext) {
          updates.culturalContext = lyricsResult.culturalContext
        }

        stats.lyricsFetched = true
        const hasSynced = lyricsResult.synchronized?.lines?.length > 0
        console.log(`  ✅ Lyrics fetched from ${lyricsResult.provider} (${lyricsResult.lines.length} lines${hasSynced ? ', synchronized' : ''})`)
      } else {
        stats.errors.push(`Failed to fetch lyrics: ${lyricsResult.error}`)
      }
    }

    // Apply updates if not dry run
    if (!options.dryRun && Object.keys(updates).length > 0) {
      await prisma.song.update({
        where: { id: songId },
        data: updates
      })
      console.log(`\n✅ Updated ${Object.keys(updates).length} fields`)
    } else if (options.dryRun) {
      console.log('\n🔍 DRY RUN - Would update:')
      Object.keys(updates).forEach(key => {
        console.log(`  - ${key}`)
      })
    }

    // 4. TRANSLATIONS
    const hasEnTranslation = song.translations.some(t => t.targetLang === 'en')
    if ((updates.lyricsRaw || song.lyricsRaw) && (!hasEnTranslation || options.force)) {
      console.log('\n🌐 Creating translations...')

      let lines: string[] = []
      const rawLyrics = updates.lyricsRaw || song.lyricsRaw

      // Try parsing as JSON first (for new synchronized format)
      try {
        const parsed = JSON.parse(rawLyrics)
        if (parsed.lines && Array.isArray(parsed.lines)) {
          lines = parsed.lines
          console.log(`  📋 Parsed ${lines.length} lines from JSON format`)
        } else if (parsed.synchronized?.lines) {
          // Extract text from synchronized data
          lines = parsed.synchronized.lines.map(l => l.text)
          console.log(`  📋 Extracted ${lines.length} lines from synchronized data`)
        }
      } catch {
        // Fallback to plain text parsing (for legacy format)
        if (typeof rawLyrics === 'string') {
          lines = rawLyrics.split('\n').filter(line => line.trim())
          console.log(`  📋 Split ${lines.length} lines from plain text format`)
        } else {
          console.log('  ⚠️ Could not parse lyrics for translation')
        }
      }

      if (lines.length > 0) {
        console.log(`  Translating ${lines.length} lines using batch translation...`)
        let translations: string[] = []
        let successCount = 0

        try {
          // Use batch translation for efficiency
          const uniqueLines = Array.from(new Set(lines))
          console.log(`  📊 ${uniqueLines.length} unique lines from ${lines.length} total lines`)

          const translationResults = await batchTranslate(lines, 'en')
          translations = translationResults.map(result => result.text)
          successCount = translationResults.filter(result => result.provider !== 'passthrough').length

          console.log(`  ✅ Batch translation completed (${successCount}/${lines.length} lines translated)`)
        } catch (error) {
          console.log(`  ⚠️ Batch translation failed, falling back to sequential...`)

          // Fallback to sequential translation on batch failure
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // Progress indicator
            if (i % 10 === 0 && i > 0) {
              console.log(`  Progress: ${i}/${lines.length} lines translated`)
            }

            try {
              const result = await translate(line, 'en')
              translations.push(result.text)
              successCount++

              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (error) {
              console.log(`  ⚠️ Translation failed for line ${i + 1}`)
              translations.push(line) // Keep original on failure
            }
          }
        }

        if (!options.dryRun && successCount > 0) {
          // Delete existing translation if force mode
          if (options.force && hasEnTranslation) {
            await prisma.translation.deleteMany({
              where: {
                songId: songId,
                targetLang: 'en'
              }
            })
          }

          // Create new translation
          await prisma.translation.create({
            data: {
              songId: songId,
              targetLang: 'en',
              lyricsLines: JSON.stringify(translations),
              title: song.title,
              provider: process.env.TRANSLATOR || 'demo',
              confidence: 0.9
            }
          })

          stats.translationCreated = true
          console.log(`  ✅ Created English translation (${successCount}/${lines.length} lines)`)

          // Generate song summary using the translated lyrics
          console.log('\n📝 Generating song summary...')
          const songSummary = await generateSongSummary(translations, song.title, song.artist)

          if (songSummary !== "Problem fetching translations") {
            await prisma.song.update({
              where: { id: songId },
              data: { songSummary }
            })
            console.log('  ✅ Song summary generated and saved')
          } else {
            console.log('  ⚠️ Could not generate song summary')
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error hydrating song:', error)
    stats.errors.push(String(error))
  }

  return stats
}

// Parse Spotify URL to get track ID
function parseSpotifyUrl(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Song Hydration Script
=====================

Usage:
  npx tsx scripts/songHydration.ts [songId or spotifyUrl]
  npx tsx scripts/songHydration.ts --all
  npx tsx scripts/songHydration.ts --dry-run [songId]
  npx tsx scripts/songHydration.ts --force [songId]

Options:
  --all       Process all songs missing data
  --dry-run   Preview changes without applying
  --force     Force update even if data exists
  --verbose   Show detailed progress

Examples:
  npx tsx scripts/songHydration.ts cmfmziuj30000g1k50azzfxmb
  npx tsx scripts/songHydration.ts https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
  npx tsx scripts/songHydration.ts --all --dry-run
`)
    process.exit(0)
  }

  const options: HydrationOptions = {
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose')
  }

  console.log('🚀 Song Hydration Pipeline')
  console.log('=' + '='.repeat(60))

  try {
    if (args.includes('--all')) {
      // Process all songs missing data
      const songs = await prisma.song.findMany({
        where: {
          isActive: true,
          OR: [
            { albumArt: null },
            { albumArtColor: null },
            { lyricsRaw: null },
            { translations: { none: { targetLang: 'en' } } }
          ]
        },
        select: { id: true, title: true, artist: true }
      })

      console.log(`Found ${songs.length} songs needing hydration\n`)

      let successCount = 0
      for (const song of songs) {
        const stats = await hydrateSong(song.id, options)
        if (stats.errors.length === 0) successCount++
      }

      console.log(`\n✅ Hydrated ${successCount}/${songs.length} songs successfully`)

    } else {
      // Process single song
      let songId = args.find(arg => !arg.startsWith('--'))

      if (!songId) {
        console.error('❌ No song ID or URL provided')
        process.exit(1)
      }

      // Check if it's a Spotify URL
      if (songId.includes('spotify.com')) {
        const trackId = parseSpotifyUrl(songId)
        if (!trackId) {
          console.error('❌ Invalid Spotify URL')
          process.exit(1)
        }

        // Find song by Spotify ID
        const song = await prisma.song.findUnique({
          where: { spotifyId: trackId }
        })

        if (!song) {
          console.error(`❌ No song found with Spotify ID: ${trackId}`)
          process.exit(1)
        }

        songId = song.id
      }

      const stats = await hydrateSong(songId, options)

      console.log('\n📊 Summary:')
      console.log(`  Spotify data: ${stats.spotifyFetched ? '✅' : '⏭️'}`)
      console.log(`  Color extraction: ${stats.colorExtracted ? '✅' : '⏭️'}`)
      console.log(`  Lyrics: ${stats.lyricsFetched ? '✅' : '⏭️'}`)
      console.log(`  Translation: ${stats.translationCreated ? '✅' : '⏭️'}`)

      if (stats.errors.length > 0) {
        console.log(`  Errors: ${stats.errors.length}`)
        stats.errors.forEach(err => console.log(`    - ${err}`))
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { hydrateSong, HydrationOptions, HydrationStats }