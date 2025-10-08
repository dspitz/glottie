import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const imageUrl = request.nextUrl.searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing image URL parameter' },
        { status: 400 }
      )
    }

    // Validate that the URL is from an allowed domain
    const allowedDomains = [
      'fbcdn.net',
      'xx.fbcdn.net',
      'scdn.co',
      'spotifycdn.com',
      'googleusercontent.com',
      'fbsbx.com'
    ]

    const url = new URL(imageUrl)
    const isAllowed = allowedDomains.some(domain =>
      url.hostname.includes(domain)
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Image domain not allowed' },
        { status: 403 }
      )
    }

    // Fetch the image from the external source with browser-like headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.facebook.com/',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    })

    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', {
        url: imageUrl,
        status: imageResponse.status,
        statusText: imageResponse.statusText
      })
      return NextResponse.json(
        { error: 'Failed to fetch image', details: imageResponse.statusText },
        { status: imageResponse.status }
      )
    }

    // Get the image data and content type
    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    )
  }
}
