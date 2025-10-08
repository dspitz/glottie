import { prisma } from '../lib/prisma'
import { downloadAndSaveImage } from '../lib/download-image'

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: npx tsx scripts/downloadUserAvatar.ts <email>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  if (!user.image) {
    console.error(`User has no image: ${email}`)
    process.exit(1)
  }

  console.log(`Current image URL: ${user.image}`)

  if (!user.image.includes('fbcdn.net') && !user.image.includes('facebook.com')) {
    console.log('Image is not from Facebook CDN, no need to download')
    process.exit(0)
  }

  console.log('Downloading image...')
  const localPath = await downloadAndSaveImage(user.image)

  if (!localPath) {
    console.error('Failed to download image')
    process.exit(1)
  }

  console.log(`Downloaded to: ${localPath}`)

  await prisma.user.update({
    where: { email },
    data: { image: localPath }
  })

  console.log('Database updated successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
