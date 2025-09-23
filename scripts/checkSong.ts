import { prisma } from '../lib/prisma'

async function checkSong(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      translations: true,
      metrics: true
    }
  });

  if (!song) {
    console.log('Song not found');
    return;
  }

  console.log('🎵 Song: ' + song.title + ' by ' + song.artist);
  console.log('================================');
  console.log('Has Lyrics:', song.hasLyrics ? '✅' : '❌');
  console.log('Provider:', song.lyricsProvider || 'None');
  console.log('Has Translations:', song.hasTranslations ? '✅' : '❌');
  console.log('Synced:', song.synced ? '✅' : '❌');

  if (song.lyricsRaw) {
    try {
      const data = JSON.parse(song.lyricsRaw);
      console.log('Lines:', data.lines?.length || 0);
      console.log('Has Sync:', !!data.synchronized);
    } catch(e) {
      console.log('Lyrics format: Plain text');
    }
  }

  console.log('\nTranslations:');
  if (song.translations.length > 0) {
    song.translations.forEach(t => {
      console.log('  -', t.targetLang, '(Provider:', t.provider + ')');
      try {
        const lines = JSON.parse(t.lyricsLines || '[]');
        if (lines[0]) {
          console.log('    First line:', lines[0].substring(0, 50) + (lines[0].length > 50 ? '...' : ''));
          // Check if it's actually translated
          if (lines[0].toLowerCase().includes('despacito')) {
            console.log('    ⚠️ May contain original Spanish');
          }
        }
      } catch(e) {
        console.log('    Error parsing translation');
      }
    });
  } else {
    console.log('  None');
  }
}

const songId = process.argv[2] || 'cmfm3ztz2002p8mv3wl6awxi5';
checkSong(songId).then(() => prisma.$disconnect());