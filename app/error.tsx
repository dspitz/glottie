'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

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
        <h2 className="text-xl font-semibold mb-2">Something went wrong!</h2>
        <p className="text-muted-foreground mb-4">
          An error occurred while loading this page.
        </p>
        <Button onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  )
}