import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'

interface BasicsCardProps {
  icon: string | React.ReactNode
  title: string
  subtitle?: string
  description: string
  onClick: () => void
}

interface ExamplePhrase {
  spanish?: string
  french?: string
  english: string
}

export function BasicsCard({ icon, title, subtitle, description, onClick, examplePhrase }: BasicsCardProps & { examplePhrase?: ExamplePhrase }) {
  // Get the target language text (Spanish or French)
  const targetText = examplePhrase?.spanish || examplePhrase?.french

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] overflow-hidden"
      onClick={onClick}
      style={{ borderRadius: '24px' }}
    >
      <CardContent className="pb-0" style={{ padding: '20px 20px 0 20px' }}>
        <div className="relative pb-3">
          <div className="absolute top-0 right-0 text-3xl">
            {typeof icon === 'string' ? icon : icon}
          </div>
          <div className="pr-12">
            <h3 className="font-semibold text-lg">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground" style={{ marginTop: '4px' }}>{subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground" style={{ marginTop: '4px' }}>{description}</p>
          </div>
        </div>
      </CardContent>
      {examplePhrase && targetText && (
        <div style={{ padding: '12px 20px', backgroundColor: '#F7F7F7' }}>
          <p className="text-sm font-medium">{targetText}</p>
          <p className="text-sm text-muted-foreground" style={{ marginTop: '2px' }}>{examplePhrase.english}</p>
        </div>
      )}
    </Card>
  )
}
