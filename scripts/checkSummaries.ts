#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function checkSummaries() {
  const songs = await prisma.song.findMany({
    where: { level: 1 },
    select: {
      id: true,
      title: true,
      artist: true,
      songSummary: true
    },
    take: 5
  });

  console.log('Sample Level 1 Songs with Summaries:');
  console.log('=' .repeat(50));

  songs.forEach(song => {
    console.log(`\n${song.title} by ${song.artist}`);
    console.log('ID:', song.id);
    if (song.songSummary) {
      console.log('Summary:', song.songSummary);
      console.log('Word count:', song.songSummary.split(/\s+/).length);
    } else {
      console.log('Summary: NO SUMMARY FOUND');
    }
  });

  await prisma.$disconnect();
}

checkSummaries();