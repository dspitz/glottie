import React from 'react'
import { Brain } from 'lucide-react'

export default function LearningsPage() {
  return (
    <div className="container py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6 p-4 rounded-full bg-muted/20">
          <Brain className="h-16 w-16 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Learnings</h1>
        <p className="text-lg text-muted-foreground mb-2">
          Track your progress and review what you've learned
        </p>
        <p className="text-sm text-muted-foreground">
          Coming soon
        </p>
      </div>
    </div>
  )
}