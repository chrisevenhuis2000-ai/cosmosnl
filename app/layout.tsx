import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       { default: 'NightGazer — Astronomie voor Iedereen', template: '%s | NightGazer' },
  description: 'Nederlandstalig astronomie-platform met AI-aangedreven uitleg op jouw niveau. Van beginners tot professionals.',
  keywords:    ['astronomie', 'ruimtevaart', 'NASA', 'sterrenkijken', 'JWST', 'ruimte nieuws', 'nightgazer'],
  openGraph: {
    siteName: 'NightGazer',
    locale:   'nl_NL',
    type:     'website',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-void text-star antialiased">
        {children}
      </body>
    </html>
  )
}
