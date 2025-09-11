'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container py-8">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold mb-2">Song Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The requested song could not be loaded.
        </p>
        <div className="flex gap-3">
          <Button onClick={reset}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Levels
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}