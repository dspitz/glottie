import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/Header'
import { TabNavigation } from '@/components/TabNavigation'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'diddydum - Learn Language Through Music',
  description: 'Interactive language learning platform using music lyrics with difficulty levels, translations, and word definitions.',
  keywords: 'language learning, music, lyrics, Spanish, French, Italian, German, Mandarin, interactive education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pb-16">
              {children}
            </main>
            <TabNavigation />
          </div>
        </Providers>
      </body>
    </html>
  )
}