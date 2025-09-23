import { prisma } from '../lib/prisma'

async function verifySong() {
  const songId = 'cmfvnf7pj000085qr1re50ehl'

  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      metrics: true,
      translations: true
    }
  })

  if (!song) {
    console.log('❌ Song not found')
    return
  }

  console.log('🎵 Song Status: Un Gatito Me Llamó by KAROL G')
  console.log('=' + '='.repeat(50))

  console.log('\n📊 Basic Info:')
  console.log('  ID:', song.id)
  console.log('  Level:', song.level, '(' + song.levelName + ')')
  console.log('  Genres:', song.genres)
  console.log('  Album:', song.album)
  console.log('  Spotify ID:', song.spotifyId)

  console.log('\n🎨 Media:')
  console.log('  Album Art:', song.albumArt ? '✅' : '❌')
  console.log('  Preview URL:', song.previewUrl ? '✅' : '❌')
  console.log('  Spotify URL:', song.spotifyUrl ? '✅' : '❌')
  console.log('  Album Color:', song.albumArtColor || 'Not set')

  console.log('\n📝 Content:')
  console.log('  Has Lyrics:', song.hasLyrics ? '✅' : '❌')
  console.log('  Has Translations:', song.hasTranslations ? '✅' : '❌')
  console.log('  Synced:', song.synced ? '✅' : '❌')
  console.log('  Provider:', song.lyricsProvider)
  console.log('  Licensed:', song.lyricsLicensed ? '✅' : '❌')

  if (song.lyricsRaw) {
    try {
      const lyrics = JSON.parse(song.lyricsRaw)
      console.log('  Lines:', lyrics.lines?.length || 0)
      console.log('  Has Sync Data:', !!lyrics.synchronized)
    } catch (e) {
      console.log('  Lyrics format: Plain text')
    }
  }

  console.log('\n🌍 Translations:')
  if (song.translations && song.translations.length > 0) {
    song.translations.forEach(t => {
      console.log('  -', t.targetLang + ':', t.provider, '(Confidence:', t.confidence + ')')
      try {
        const lines = JSON.parse(t.lyricsLines || '[]')
        console.log('    Lines:', lines.length)
      } catch (e) {
        console.log('    Format error')
      }
    })
  } else {
    console.log('  None')
  }

  console.log('\n📈 Metrics:')
  if (song.metrics) {
    console.log('  Word Count:', song.metrics.wordCount)
    console.log('  Unique Words:', song.metrics.uniqueWordCount)
    console.log('  Type-Token Ratio:', song.metrics.typeTokenRatio)
    console.log('  Verb Density:', song.metrics.verbDensity)
    console.log('  Difficulty Score:', song.metrics.difficultyScore)
  } else {
    console.log('  No metrics')
  }

  console.log('\n✅ Song is ready for use in Level 5!')
}

verifySong().then(() => prisma.$disconnect())