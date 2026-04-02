import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Nieuws',
  description: 'Het laatste astronomie- en ruimtevaartnieuws in het Nederlands. Dagelijks bijgewerkt met artikelen over NASA, ESA, JWST en meer.',
  openGraph: {
    title:       'Nieuws — NightGazer',
    description: 'Dagelijks astronomie- en ruimtevaartnieuws in het Nederlands.',
  },
}

interface Article {
  slug:        string
  title:       string
  excerpt:     string
  category:    string
  publishedAt: string
  imageUrl:    string
}

function getArticles(): Article[] {
  const dir = path.join(process.cwd(), 'content', 'articles')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const { data } = matter(fs.readFileSync(path.join(dir, f), 'utf8'))
      return {
        slug:        f.replace(/\.md$/, ''),
        title:       data.title || f.replace(/\.md$/, '').replace(/-/g, ' '),
        excerpt:     data.excerpt || '',
        category:    data.category || '',
        publishedAt: data.publishedAt || '',
        imageUrl:    data.imageUrl || '',
      }
    })
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
}

const CAT_COLORS: Record<string, string> = {
  'james-webb': '#7aadff', 'kosmologie': '#c080ff', 'missies': '#3dcfdf',
  'mars': '#ff8a60', 'sterrenkijken': '#d4a84b', 'educatie': '#3ddf90',
}

export default function NieuwsPage() {
  const articles = getArticles()

  return (
    <main style={{ minHeight: '100vh', background: '#0a0b1a' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #252858', padding: '20px 24px' }}>
        <nav style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
            NightGazer
          </Link>
          <div style={{ display: 'flex', gap: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {[['/', 'Home'], ['/nieuws', 'Nieuws'], ['/missies', 'Missies'], ['/sterrenkijken', 'Sterrenkijken'], ['/educatie', 'Educatie']].map(([href, label]) => (
              <Link key={href} href={href} style={{ color: href === '/nieuws' ? '#378ADD' : '#8A9CC0', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Title */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 32px' }}>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 12 }}>
          Astronomie &amp; Ruimtevaart
        </p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Nieuws
        </h1>
        <p style={{ color: '#8A9CC0', fontSize: '0.95rem', maxWidth: 560 }}>
          {articles.length} artikelen — dagelijks bijgewerkt
        </p>
      </div>

      {/* Article grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {articles.map(a => (
          <Link key={a.slug} href={`/nieuws/${a.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <article style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {a.imageUrl && (
                <div style={{ height: 180, overflow: 'hidden' }}>
                  <img src={a.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
              )}
              <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {a.category && (
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.16em',
                    textTransform: 'uppercase', color: CAT_COLORS[a.category] || '#7aadff', marginBottom: 8,
                  }}>
                    {a.category}
                  </span>
                )}
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>
                  {a.title}
                </h2>
                {a.excerpt && (
                  <p style={{ fontSize: '0.82rem', color: '#8A9CC0', lineHeight: 1.5, flex: 1 }}>
                    {a.excerpt.length > 140 ? a.excerpt.slice(0, 140) + '…' : a.excerpt}
                  </p>
                )}
                {a.publishedAt && (
                  <time style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', color: '#4A5A8A', marginTop: 12 }}>
                    {new Date(a.publishedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  )
}
