import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading song...</span>
      </div>
    </div>
  )
}