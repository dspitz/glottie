import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLyricsByTrack } from '@/packages/adapters/lyricsProvider'

export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const trackId = params.trackId

    const song = await prisma.song.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        spotifyId: true,
        spotifyUrl: true,
        previewUrl: true,
        albumArt: true,
        albumArtSmall: true,
        lyricsRaw: true,
        lyricsProvider: true,
        lyricsLicensed: true,
        level: true,
        popularity: true,
        genres: true,
        culturalContext: true,
        translations: true
      }
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    let lyricsData: any = null
    let lyricsLines: string[] = []

    // If we don't have lyrics yet, try to fetch them
    if (!song.lyricsRaw) {
      console.log(`🎵 Fetching lyrics for "${song.title}" by ${song.artist}`)
      
      try {
        const lyricsResult = await getLyricsByTrack(song.artist, song.title)
        
        if (lyricsResult.lines.length > 0) {
          console.log(`✅ Found lyrics using ${lyricsResult.provider} provider`)
          
          // Store the lyrics in the database for future use
          await prisma.song.update({
            where: { id: song.id },
            data: {
              lyricsRaw: JSON.stringify(lyricsResult),
              lyricsProvider: lyricsResult.provider,
              lyricsLicensed: lyricsResult.licensed
            }
          })
          
          lyricsLines = lyricsResult.lines
          lyricsData = {
            lines: lyricsResult.lines,
            provider: lyricsResult.provider,
            licensed: lyricsResult.licensed,
            isExcerpt: lyricsResult.isExcerpt,
            attribution: lyricsResult.attribution,
            culturalContext: lyricsResult.culturalContext,
            translations: lyricsResult.translations,
            synchronized: lyricsResult.synchronized
          }
        } else {
          console.log(`⚠️ No lyrics found: ${lyricsResult.error || 'No lyrics available'}`)
        }
        
      } catch (error) {
        console.error('Error fetching lyrics from provider:', error)
      }
    } else {
      // Parse existing lyrics from database
      try {
        const parsedLyrics = JSON.parse(song.lyricsRaw)
        lyricsLines = parsedLyrics.lines || []
        lyricsData = parsedLyrics
      } catch (e) {
        // If parsing fails, treat as plain text and split into lines
        lyricsLines = song.lyricsRaw.split('\n').filter(line => line.trim().length > 0)
        lyricsData = {
          lines: lyricsLines,
          provider: song.lyricsProvider || 'unknown',
          licensed: song.lyricsLicensed || false
        }
      }
    }

    // Use full raw lyrics if available and MUSIXMATCH_FULL_LYRICS is enabled
    let finalLines = lyricsLines
    if (process.env.MUSIXMATCH_FULL_LYRICS === 'true' && lyricsData?.raw) {
      // Split raw lyrics into lines
      const rawLines = lyricsData.raw
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.includes('******* This Lyrics'))
      if (rawLines.length > lyricsLines.length) {
        console.log(`📚 Using full raw lyrics (${rawLines.length} lines instead of ${lyricsLines.length})`)
        finalLines = rawLines
      }
    }

    // Process database translations
    let dbTranslations: { [targetLang: string]: string[] } = {}
    console.log(`📚 Processing translations for song ${song.id}:`, {
      hasTranslations: !!song.translations,
      translationCount: song.translations?.length || 0,
      translations: song.translations?.map(t => ({
        targetLang: t.targetLang,
        provider: t.provider,
        confidence: t.confidence,
        lyricsLines: t.lyricsLines ? `${t.lyricsLines.length} chars` : 'null'
      }))
    })

    if (song.translations && song.translations.length > 0) {
      for (const translation of song.translations) {
        try {
          const parsed = JSON.parse(translation.lyricsLines || '[]')
          console.log(`  Translation ${translation.targetLang}:`, {
            isParsed: !!parsed,
            isArray: Array.isArray(parsed),
            length: Array.isArray(parsed) ? parsed.length : 0,
            firstItem: Array.isArray(parsed) && parsed[0] ? parsed[0].substring(0, 40) : null
          })

          // Handle different formats
          if (Array.isArray(parsed)) {
            // Check if it's an array of strings (correct format)
            if (parsed.length > 0 && typeof parsed[0] === 'string') {
              // Check if first element is a JSON object (corrupted data)
              if (parsed[0].startsWith('{')) {
                console.log(`⚠️ Fixing corrupted translation data for ${translation.targetLang}`)
                continue // Skip corrupted data
              }
              dbTranslations[translation.targetLang] = parsed
              console.log(`✅ Added ${translation.targetLang} translation with ${parsed.length} lines`)
              console.log(`📚 Found ${parsed.length} translated lines for ${translation.targetLang}`)
            }
          }
        } catch (e) {
          console.error(`Failed to parse translation for ${translation.targetLang}:`, e)
        }
      }
    }

    // Merge translations: database translations take priority over demo ones
    const finalTranslations = {
      ...(lyricsData?.translations || {}),
      ...dbTranslations
    }

    // Keep original synchronized data without offset adjustment
    // The timings from Musixmatch are actually correct
    let adjustedSynchronized = lyricsData?.synchronized

    console.log(`📤 Sending response with:`, {
      hasTranslations: Object.keys(dbTranslations || {}).length > 0,
      translationLanguages: Object.keys(dbTranslations || {}),
      enTranslationCount: dbTranslations?.en?.length || 0,
      hasSynchronized: !!adjustedSynchronized,
      linesCount: finalLines.length
    })

    return NextResponse.json({
      // Core response data
      trackId: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      spotifyId: song.spotifyId,
      spotifyUrl: song.spotifyUrl,
      previewUrl: song.previewUrl,
      albumArt: song.albumArt,
      albumArtSmall: song.albumArtSmall,
      level: song.level,
      popularity: song.popularity,
      genres: song.genres,

      // Lyrics data
      lines: finalLines,
      lyrics: lyricsData,
      lyricsProvider: lyricsData?.provider,
      lyricsLicensed: lyricsData?.licensed,
      attribution: lyricsData?.attribution,
      culturalContext: song.culturalContext || lyricsData?.culturalContext,
      translations: finalTranslations,
      synchronized: adjustedSynchronized,
      
      // Legacy compatibility
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        level: song.level
      }
    })
  } catch (error) {
    console.error('Error fetching lyrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lyrics' },
      { status: 500 }
    )
  }
}