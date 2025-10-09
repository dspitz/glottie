'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage()

  const currentLang = languages.find(l => l.code === language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full border-0 pl-[14px] pr-[18px] h-10">
          <span className="text-base">{currentLang.flag}</span>
          <span>{currentLang.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[240px]">
        {languages.map((lang, index) => (
          <div key={lang.code}>
            <DropdownMenuItem
              onClick={() => setLanguage(lang.code)}
              className={`gap-3 px-6 py-4 text-lg cursor-pointer text-black ${lang.code === language ? 'bg-accent' : ''}`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-lg font-medium">{lang.name}</span>
              {lang.code === language && <span className="ml-auto text-xl">✓</span>}
            </DropdownMenuItem>
            {index < languages.length - 1 && (
              <DropdownMenuSeparator className="bg-black/[0.08]" />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
