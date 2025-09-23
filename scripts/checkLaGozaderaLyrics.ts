#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function checkLyrics() {
  const songId = 'cmfm3ztx200098mv3dmuhrsx0';

  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: {
      id: true,
      title: true,
      artist: true,
      lyricsRaw: true,
      lyricsProvider: true,
      songSummary: true,
      translations: {
        where: { targetLang: 'en' },
        select: {
          id: true,
          lyricsLines: true
        }
      }
    }
  });

  console.log('='.repeat(50));
  console.log('Song:', song?.title, 'by', song?.artist);
  console.log('='.repeat(50));

  console.log('\n📝 LYRICS STATUS:');
  console.log('Provider:', song?.lyricsProvider || 'NONE');
  console.log('Has lyrics field:', !!song?.lyricsRaw);

  if (song?.lyricsRaw) {
    console.log('Raw lyrics length:', song.lyricsRaw.length, 'characters');

    try {
      const parsed = JSON.parse(song.lyricsRaw);
      if (parsed.lines && Array.isArray(parsed.lines)) {
        console.log('Parsed lines count:', parsed.lines.length);
        console.log('\nFirst 5 lines:');
        parsed.lines.slice(0, 5).forEach((line: string, i: number) => {
          console.log(`  ${i + 1}. "${line}"`);
        });

        // Check if it's actually placeholder content
        if (parsed.lines.length === 1 && parsed.lines[0].includes('educational')) {
          console.log('\n⚠️ WARNING: This appears to be PLACEHOLDER content, not actual lyrics!');
        }
      }
    } catch (e) {
      // Try as plain text
      const lines = song.lyricsRaw.split('\n').filter(l => l.trim());
      console.log('Plain text lines:', lines.length);
      if (lines.length > 0) {
        console.log('First line:', lines[0]);
      }
    }
  } else {
    console.log('❌ NO LYRICS DATA');
  }

  console.log('\n🌐 TRANSLATION STATUS:');
  if (song?.translations && song.translations.length > 0) {
    const trans = song.translations[0];
    console.log('Has translation:', !!trans.lyricsLines);

    if (trans.lyricsLines) {
      try {
        const lines = JSON.parse(trans.lyricsLines);
        console.log('Translation lines:', lines.length);
        if (lines.length > 0 && lines[0].includes('educational')) {
          console.log('⚠️ WARNING: Translation is also PLACEHOLDER content!');
        }
      } catch (e) {
        console.log('Could not parse translation');
      }
    }
  } else {
    console.log('❌ NO TRANSLATIONS');
  }

  console.log('\n📖 SUMMARY:');
  console.log(song?.songSummary || 'NO SUMMARY');

  console.log('\n' + '='.repeat(50));
  console.log('VERDICT: This song needs proper hydration with real lyrics!');
  console.log('The current "lyrics" appear to be placeholder text.');

  await prisma.$disconnect();
}

checkLyrics();