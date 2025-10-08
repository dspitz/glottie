import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/bookmarks/lines/[lineId] - Delete a specific bookmarked line
export async function DELETE(
  request: NextRequest,
  { params }: { params: { lineId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      // Return success but don't delete from database
      // User will use localStorage instead
      return NextResponse.json({ success: true })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    const { lineId } = params

    if (!lineId) {
      return NextResponse.json(
        { error: 'Line ID is required' },
        { status: 400 }
      )
    }

    // Delete the bookmarked line (only if it belongs to the user)
    await prisma.bookmarkedLine.deleteMany({
      where: {
        id: lineId,
        userId: user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // console.error('Error deleting bookmarked line:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmarked line' },
      { status: 500 }
    )
  }
}
