import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'

export async function downloadAndSaveImage(imageUrl: string): Promise<string | null> {
  try {
    // Fetch the image with browser-like headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.facebook.com/',
      },
    })

    if (!response.ok) {
      console.error('Failed to download image:', response.status, response.statusText)
      return null
    }

    // Get the image buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate a unique filename based on the URL hash
    const hash = createHash('md5').update(imageUrl).digest('hex')
    const ext = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg'
    const filename = `${hash}.${ext}`

    // Ensure the upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    await mkdir(uploadDir, { recursive: true })

    // Save the file
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return the public URL
    return `/uploads/avatars/${filename}`
  } catch (error) {
    console.error('Error downloading image:', error)
    return null
  }
}
