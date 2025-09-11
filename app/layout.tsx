import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Header } from '@/components/Header'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Recanta - Learn Spanish Through Music',
  description: 'Interactive Spanish learning platform using music lyrics with difficulty levels, translations, and word definitions.',
  keywords: 'Spanish learning, music, lyrics, language learning, interactive education',
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
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                  <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built with ❤️ for Spanish learners. Demo content included for testing.
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <p className="text-sm text-muted-foreground">
                    Powered by Next.js, Tailwind & Prisma
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}