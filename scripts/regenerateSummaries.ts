#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';
import { generateSongSummary } from '../packages/adapters/translate';

async function regenerateSummaries() {
  console.log('🔄 Regenerating summaries for songs with placeholder text...\n');

  try {
    // Get all songs that have the old format "From album:" or very short summaries
    const songs = await prisma.song.findMany({
      where: {
        OR: [
          { songSummary: { contains: 'From album:' } },
          { songSummary: null }
        ]
      },
      include: {
        translations: {
          where: { targetLang: 'en' }
        }
      }
    });

    console.log(`Found ${songs.length} songs needing proper summaries\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const song of songs) {
      console.log(`\n📄 ${song.title} by ${song.artist}`);
      console.log(`   Current summary: ${song.songSummary || 'null'}`);

      // Check if we have translations
      if (!song.translations || song.translations.length === 0) {
        console.log(`   ⚠️ No translations available, skipping`);
        skippedCount++;
        continue;
      }

      try {
        // Parse the translation
        const translation = song.translations[0];
        const translatedLines = JSON.parse(translation.lyricsLines || '[]');

        if (translatedLines.length === 0) {
          console.log(`   ⚠️ Empty translations, skipping`);
          skippedCount++;
          continue;
        }

        // Generate new concise summary
        console.log(`   🔄 Generating concise summary...`);
        const newSummary = await generateSongSummary(translatedLines, song.title, song.artist);

        if (newSummary && newSummary !== "Problem fetching translations") {
          const newWordCount = newSummary.split(/\s+/).length;
          console.log(`   ✅ New summary: ${newWordCount} words`);
          console.log(`   "${newSummary}"`);

          // Update the song
          await prisma.song.update({
            where: { id: song.id },
            data: { songSummary: newSummary }
          });

          updatedCount++;
        } else {
          console.log(`   ❌ Failed to generate summary`);
          errorCount++;
        }
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n==============================================');
    console.log(`✅ Summary Regeneration Complete!`);
    console.log(`   Updated: ${updatedCount} songs`);
    console.log(`   Skipped: ${skippedCount} songs`);
    console.log(`   Errors: ${errorCount} songs`);
    console.log('==============================================\n');

  } catch (error) {
    console.error('❌ Error regenerating summaries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateSummaries();