import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSpotifyData() {
  const songs = await prisma.song.findMany({
    where: {
      spotifyUrl: { not: null }
    },
    select: {
      id: true,
      title: true,
      artist: true,
      spotifyId: true,
      spotifyUrl: true
    }
  })

  console.log('Checking Spotify data for', songs.length, 'songs with Spotify URLs:\n')

  let missingCount = 0
  const updates = []

  for (const song of songs) {
    if (song.spotifyUrl && !song.spotifyId) {
      const match = song.spotifyUrl.match(/track\/([a-zA-Z0-9]+)/)
      if (match) {
        missingCount++
        console.log(`${song.artist} - ${song.title}:`)
        console.log(`  Missing spotifyId, extracting from URL: ${match[1]}`)
        updates.push({
          id: song.id,
          spotifyId: match[1]
        })
      }
    }
  }

  console.log(`\nFound ${missingCount} songs with missing spotifyId`)

  if (updates.length > 0) {
    console.log('\nUpdating database...')
    for (const update of updates) {
      await prisma.song.update({
        where: { id: update.id },
        data: { spotifyId: update.spotifyId }
      })
    }
    console.log(`✅ Updated ${updates.length} songs with spotifyId`)
  }

  // Verify the fix
  const verifyCount = await prisma.song.count({
    where: {
      spotifyUrl: { not: null },
      spotifyId: { not: null }
    }
  })

  console.log(`\n✅ Total songs with both spotifyUrl and spotifyId: ${verifyCount}`)

  await prisma.$disconnect()
}

checkSpotifyData().catch(console.error)