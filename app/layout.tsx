import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ErrorBoundary from './ErrorBoundary'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://nightgazer.space'),
  title:       { default: 'NightGazer — Astronomie voor Iedereen', template: '%s | NightGazer' },
  description: 'Nederlandstalig astronomie-platform met AI-aangedreven uitleg op jouw niveau. Van beginners tot professionals.',
  keywords:    ['astronomie', 'ruimtevaart', 'NASA', 'sterrenkijken', 'JWST', 'ruimte nieuws', 'nightgazer'],
  openGraph: {
    siteName: 'NightGazer',
    locale:   'nl_NL',
    type:     'website',
    images:   [{ url: '/og-image.png', width: 1200, height: 630, alt: 'NightGazer — Astronomie voor Iedereen' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} bg-void text-star antialiased`} style={{ fontFamily: 'var(--font-sans)' }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
