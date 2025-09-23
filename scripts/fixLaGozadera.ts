#!/usr/bin/env tsx

import { prisma } from '../lib/prisma';

async function fixLaGozadera() {
  const songId = 'cmfm3ztx200098mv3dmuhrsx0';

  const summary = 'Infectious party anthem celebrating Latin American unity and joy. Features a roll call of countries from Cuba to Venezuela, inviting everyone to dance. The fusion of reggaeton and salsa creates an irresistible celebration of Latin culture.';

  await prisma.song.update({
    where: { id: songId },
    data: { songSummary: summary }
  });

  console.log('✅ Updated La Gozadera with proper summary');
  console.log('Word count:', summary.split(/\s+/).length);

  await prisma.$disconnect();
}

fixLaGozadera();