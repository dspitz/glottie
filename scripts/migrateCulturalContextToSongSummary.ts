#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function migrate() {
  console.log('🔄 Migrating culturalContext to songSummary...')

  try {
    // First, add the songSummary column without dropping culturalContext
    // This is handled by Prisma schema change

    // Get all songs with culturalContext
    const songs = await prisma.$queryRaw`
      SELECT id, culturalContext
      FROM Song
      WHERE culturalContext IS NOT NULL
    ` as any[]

    console.log(`Found ${songs.length} songs with culturalContext`)

    // Update each song to copy culturalContext to songSummary
    for (const song of songs) {
      await prisma.$executeRaw`
        UPDATE Song
        SET songSummary = ${song.culturalContext}
        WHERE id = ${song.id}
      `
    }

    console.log('✅ Migration completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrate()