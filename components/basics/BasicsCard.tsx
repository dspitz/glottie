import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'
import { getSecondaryColor } from '@/lib/languageUtils'

interface BasicsCardProps {
  icon: string | React.ReactNode
  title: string
  subtitle?: string
  description: string
  onClick: () => void
  variant?: 'list' | 'grid'
  language?: string
}

interface ExamplePhrase {
  spanish?: string
  french?: string
  english: string
}

export function BasicsCard({ icon, title, subtitle, description, onClick, examplePhrase, variant = 'list', language = 'es' }: BasicsCardProps & { examplePhrase?: ExamplePhrase }) {
  // Get the target language text (Spanish or French)
  const targetText = examplePhrase?.spanish || examplePhrase?.french

  if (variant === 'grid') {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] overflow-hidden border-0"
        onClick={onClick}
        style={{ borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', height: '220px' }}
      >
        <CardContent className="px-5 pt-8 pb-5 h-full flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-white/70">
            <div className="text-2xl">
              {typeof icon === 'string' ? icon : icon}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-black" style={{ fontSize: '18px', lineHeight: '24px' }}>{title}</h3>
            {subtitle && (
              <p className="text-sm text-black/70 mt-1">{subtitle}</p>
            )}
            <p className="text-sm text-black/70 mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01] overflow-hidden border-0"
      onClick={onClick}
      style={{ borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.12)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }}
    >
      <CardContent style={{ padding: '40px 20px 0 20px' }}>
        <div className="text-center">
          <h3 className="text-sm font-normal" style={{ color: getSecondaryColor(language) }}>{title}</h3>
          {subtitle && (
            <p className="text-sm text-black/70" style={{ marginTop: '4px' }}>{subtitle}</p>
          )}
          <p className="text-[30px] leading-[36px] font-light text-black/[0.85]" style={{ marginTop: '4px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '12px' }}>{description}</p>
        </div>
      </CardContent>
      {examplePhrase && targetText && (
        <div style={{ margin: '20px', padding: '16px', border: `2px solid ${getSecondaryColor(language, 0.5)}`, backgroundColor: getSecondaryColor(language, 0.04), borderRadius: '12px' }}>
          <p className="text-sm font-medium text-center" style={{ color: getSecondaryColor(language) }}>{targetText}</p>
          <p className="text-sm text-center" style={{ marginTop: '2px', color: getSecondaryColor(language, 0.7) }}>{examplePhrase.english}</p>
        </div>
      )}
    </Card>
  )
}
