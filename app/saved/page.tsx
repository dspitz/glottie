import React from 'react'
import { Bookmark } from 'lucide-react'

export default function SavedPage() {
  return (
    <div className="container py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6 p-4 rounded-full bg-muted/20">
          <Bookmark className="h-16 w-16 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Saved Songs</h1>
        <p className="text-lg text-muted-foreground mb-2">
          Your favorite songs for quick access
        </p>
        <p className="text-sm text-muted-foreground">
          Coming soon
        </p>
      </div>
    </div>
  )
}