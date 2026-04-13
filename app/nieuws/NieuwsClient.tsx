'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

const CAT_QUERIES: Record<string, string> = {
  'missies':       'rocket launch spacecraft',
  'missions':      'rocket launch spacecraft',
  'james-webb':    'james webb space telescope infrared',
  'kosmologie':    'galaxy nebula deep space cosmos',
  'cosmology':     'galaxy nebula cosmos',
  'mars':          'mars red planet surface',
  'sterrenkijken': 'night sky stars milky way',
  'observing':     'telescope observatory night sky',
  'educatie':      'astronaut earth orbit space station',
  'education':     'astronaut earth orbit space station',
  'maan':          'moon lunar surface craters',
  'kometen':       'comet astronomy solar system',
  'komeet':        'comet astronomy solar system',
  'zon':           'sun solar flare corona',
  'planeten':      'planet solar system',
}

const SPACE_NOUNS = [
  'starship','falcon','artemis','starlink','spacex','hubble','webb','jwst',
  'perseverance','curiosity','ingenuity','voyager','cassini','landsat',
  'starliner','dragon','orion','sls','iss','juice','clipper','ariel',
  'saturn','jupiter','venus','mercury','neptune','uranus','pluto',
  'mars','moon','lunar','comet','asteroid','nebula','galaxy','aurora',
  'rocket','launch','orbit','astronaut','satellite','telescope','solar',
]

const NL_EN: Record<string, string> = {
  'lancering':'launch', 'lanceert':'launch', 'gelanceerd':'launch',
  'raket':'rocket', 'satelliet':'satellite', 'ruimtestation':'space station',
  'maan':'moon', 'maansverduistering':'lunar eclipse',
  'zon':'sun', 'zonsverduistering':'solar eclipse',
  'sterrenstelsel':'galaxy', 'melkweg':'milky way',
  'komeet':'comet', 'meteorenregen':'meteor shower',
  'astronaut':'astronaut', 'telescoop':'telescope',
  'nevel':'nebula', 'planeet':'planet', 'missie':'mission',
  'booster':'booster', 'vlucht':'flight', 'baan':'orbit',
  'oppervlak':'surface', 'dampkring':'atmosphere', 'heelal':'cosmos',
}

function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function buildQuery(title: string, category: string): string {
  const lower = title.toLowerCase()
  const nouns = SPACE_NOUNS.filter(n => lower.includes(n))
  if (nouns.length >= 1) return nouns.slice(0, 3).join(' ')
  const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/)
  const translated = words.map(w => NL_EN[w]).filter(Boolean) as string[]
  if (translated.length >= 1) return [...new Set(translated)].slice(0, 3).join(' ')
  return CAT_QUERIES[category?.toLowerCase() || ''] || 'space astronomy cosmos'
}

// Deterministic read-time estimate (2–4 min) based on slug
function articleReadTime(slug: string): number {
  return (slugHash(slug) % 3) + 2
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Article {
  slug:        string
  title:       string
  excerpt:     string
  category:    string
  catColor:    string
  emoji:       string
  date:        string
  imageUrl:    string
  publishedAt: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '/nieuws',        label: 'Nieuws' },
  { href: '/sterrenkijken', label: 'Sterrenkijken' },
  { href: '/missies',       label: 'Missies' },
  { href: '/educatie',      label: 'Educatie' },
]

const TICKER_ITEMS = [
  'Starship IFT-8 gepland voor Q2 2026',
  'Artemis II bemand naar de Maan — Q4 2026',
  'ESA SMILE-lancering 9 april 2026',
  'JUICE op weg naar Jupiter — aankomst 2031',
  'Perseverance verzamelt record 23 rotsmonsters',
  'James Webb: mogelijke biosignaturen op K2-18b',
]

const CATEGORIES = ['Alles', 'missies', 'maan', 'kometen', 'james-webb', 'mars', 'kosmologie', 'sterrenkijken', 'educatie']

// ── Starfield ──────────────────────────────────────────────────────────────
function Starfield() {
  useEffect(() => {
    const canvas = document.getElementById('nieuws-starfield') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.9 + 0.15,
      o: Math.random() * 0.45 + 0.08,
      s: (Math.random() - 0.5) * (prefersReducedMotion ? 0 : 0.012),
    }))
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      for (const s of stars) {
        s.o += s.s
        if (s.o > 0.58 || s.o < 0.06) s.s *= -1
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(210,220,255,${s.o.toFixed(2)})`
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas id="nieuws-starfield" suppressHydrationWarning aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ── Topbar ─────────────────────────────────────────────────────────────────
function Topbar() {
  const [date, setDate] = useState('')
  useEffect(() => {
    setDate(new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])
  return (
    <div role="banner" style={{ position: 'relative', zIndex: 30, height: 'var(--topbar-h)', background: 'rgba(26,26,46,0.97)', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', gap: 20, backdropFilter: 'blur(12px)' }} className="topbar-pad">
      <span suppressHydrationWarning className="topbar-date" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', color: '#4A5A8A', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>
      <div aria-hidden="true" style={{ flex: 1, overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}>
        <div className="ticker-scroll" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 48, fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: '#4A5A8A', letterSpacing: '0.06em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3dcfdf', flexShrink: 0, display: 'inline-block' }} />
              {item}
            </span>
          ))}
        </div>
      </div>
      <nav role="navigation" aria-label="Taal selectie" style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: '0.58rem', flexShrink: 0 }}>
        <Link href="/" style={{ color: '#FFFFFF' }}>NL</Link>
      </nav>
    </div>
  )
}

// ── Navigation ─────────────────────────────────────────────────────────────
function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = useCallback(() => setMobileOpen(false), [])
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, close])
  return (
    <>
      <nav aria-label="Hoofdnavigatie" style={{ position: 'sticky', top: 0, zIndex: 20, height: 'var(--nav-h)', background: 'rgba(26,26,46,0.96)', borderBottom: '1px solid #252858', backdropFilter: 'blur(16px)' }}>
        <div className="nav-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 40 }}>
          <Link href="/" aria-label="NightGazer — naar de startpagina" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 46, width: 'auto', display: 'block' }} />
          </Link>
          <ul className="nav-links" role="list" style={{ gap: 32, flex: 1, justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === '/nieuws'
              return (
                <li key={href}>
                  <Link href={href} style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: isActive ? '#FFFFFF' : '#4A5A8A', textDecoration: 'none', transition: 'color 0.15s', padding: '8px 0', borderBottom: isActive ? '1px solid #378ADD' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = isActive ? '#FFFFFF' : '#4A5A8A')}
                  >{label}</Link>
                </li>
              )
            })}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
              aria-label="Zoeken (Ctrl+K)"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(42,48,96,0.5)', border: '1px solid #252858', borderRadius: 6, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#378ADD')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#252858')}
            >
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>🔍</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#4A5A8A', letterSpacing: '0.08em' }}>Zoek…</span>
              <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '0.42rem', color: '#2A3060', background: '#1a1c42', border: '1px solid #252858', borderRadius: 3, padding: '1px 5px' }}>⌘K</kbd>
            </button>
            <button className="nav-hamburger" aria-expanded={mobileOpen} aria-controls="mobile-nav" aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'} onClick={() => setMobileOpen(o => !o)} style={{ flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ display: 'block', width: 22, height: 2, background: '#8A9BC4', borderRadius: 1, transition: 'transform 0.25s, opacity 0.25s', transform: mobileOpen ? i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : 'none' : 'none', opacity: mobileOpen && i === 1 ? 0 : 1 }} />
              ))}
            </button>
          </div>
        </div>
      </nav>
      {mobileOpen && (
        <div id="mobile-nav" role="navigation" aria-label="Mobiele navigatie" style={{ position: 'fixed', top: 'calc(var(--topbar-h) + var(--nav-h))', left: 0, right: 0, background: 'rgba(26,26,46,0.98)', borderBottom: '1px solid #252858', backdropFilter: 'blur(20px)', padding: '24px', zIndex: 19, display: 'flex', flexDirection: 'column', gap: 4, animation: 'fadeIn 0.2s ease both' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={close} style={{ display: 'block', padding: '12px 0', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BC4', borderBottom: '1px solid #252858', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
            >{label}</Link>
          ))}
        </div>
      )}
    </>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid #252858', background: '#12132A', padding: '40px clamp(16px,4vw,60px)' }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 16 }}>Navigatie</div>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} style={{ display: 'block', fontSize: '0.78rem', color: '#8A9BC4', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
              >{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 16 }}>Bronnen</div>
            {[['NASA', 'https://nasa.gov'], ['ESA', 'https://esa.int'], ['SpaceX', 'https://spacex.com']].map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.78rem', color: '#8A9BC4', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
              >{label} ↗</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid #252858' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#2A3060' }}>© {new Date().getFullYear()} NightGazer · nightgazer.space</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#2A3060' }}>Afbeeldingen: NASA · ESA · Pexels</span>
        </div>
      </div>
    </footer>
  )
}

// ── Skeleton card ──────────────────────────────────────────────────────────
function ArticleSkeleton() {
  return (
    <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
      <div className="shimmer" style={{ height: 180, background: '#1a1d40' }} />
      <div style={{ padding: 20 }}>
        <div className="shimmer" style={{ height: 9, width: '38%', marginBottom: 14, borderRadius: 2, background: '#1a1d40' }} />
        <div className="shimmer" style={{ height: 13, marginBottom: 8, borderRadius: 2, background: '#1a1d40' }} />
        <div className="shimmer" style={{ height: 13, width: '85%', marginBottom: 16, borderRadius: 2, background: '#1a1d40' }} />
        <div className="shimmer" style={{ height: 9, width: '28%', borderRadius: 2, background: '#1a1d40' }} />
      </div>
    </div>
  )
}

// ── Featured hero card ─────────────────────────────────────────────────────
function FeaturedCard({ article }: { article: Article }) {
  const mins = articleReadTime(article.slug)
  const imgSrc = article.imageUrl
    ? `${PROXY}/image-proxy?url=${encodeURIComponent(article.imageUrl)}&w=1400`
    : null

  return (
    <Link href={`/nieuws/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 32 }}>
      <article
        className="news-hero-card article-card"
        style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden', display: 'grid', gridTemplateColumns: '45% 1fr' }}
      >
        {/* Left: image */}
        <div style={{ position: 'relative', minHeight: 320, overflow: 'hidden' }}>
          {imgSrc ? (
            <img src={imgSrc} alt="" loading="eager" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.75)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', minHeight: 320, background: 'linear-gradient(135deg, #0a1030, #1a2860)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
              {article.emoji || '🌌'}
            </div>
          )}
          {/* Bottom gradient */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(transparent, rgba(10,16,48,0.9))' }} />
        </div>

        {/* Right: content */}
        <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '3px solid #378ADD' }}>
          {article.category && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: article.catColor || '#7aadff', marginBottom: 16, display: 'block' }}>
              ★ Uitgelicht · {article.category}
            </span>
          )}
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 2.5vw, 1.85rem)', fontWeight: 700, color: '#fff', lineHeight: 1.25, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h2>
          {article.excerpt && (
            <p style={{ fontSize: '0.9rem', color: '#8A9CC0', lineHeight: 1.65, marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            {article.date && (
              <time style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#4A5A8A' }}>{article.date}</time>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#4A5A8A' }}>· {mins} min leestijd</span>
          </div>
          <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', borderBottom: '1px solid rgba(55,138,221,0.4)', paddingBottom: 2 }}>
            Lees artikel →
          </span>
        </div>
      </article>
    </Link>
  )
}

// ── Article card ───────────────────────────────────────────────────────────
function ArticleCard({ article }: { article: Article }) {
  const mins = articleReadTime(article.slug)
  const imgSrc = article.imageUrl
    ? `${PROXY}/image-proxy?url=${encodeURIComponent(article.imageUrl)}&w=800`
    : null

  return (
    <Link href={`/nieuws/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <article className="article-card" style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Image with overlays */}
        <div style={{ position: 'relative', height: 180, overflow: 'hidden', flexShrink: 0 }}>
          {imgSrc ? (
            <img src={imgSrc} alt="" loading="lazy" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.75)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a1030, #1a2860)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              {article.emoji || '🌌'}
            </div>
          )}
          {/* Bottom gradient overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, rgba(10,16,48,0.85))' }} />
          {/* Category badge — top left */}
          {article.category && (
            <span style={{ position: 'absolute', top: 10, left: 10, fontFamily: 'var(--font-mono)', fontSize: '0.48rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: article.catColor || '#7aadff', background: 'rgba(10,16,48,0.78)', padding: '3px 8px', borderRadius: 2 }}>
              {article.category}
            </span>
          )}
          {/* Read time — top right */}
          <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: 'var(--font-mono)', fontSize: '0.46rem', color: '#8A9CC0', background: 'rgba(10,16,48,0.78)', padding: '3px 8px', borderRadius: 2 }}>
            {mins} min
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>
            {article.title}
          </h2>
          {article.excerpt && (
            <p style={{ fontSize: '0.82rem', color: '#8A9CC0', lineHeight: 1.5, flex: 1, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
              {article.excerpt}
            </p>
          )}
          {article.date && (
            <time style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#4A5A8A', display: 'block' }}>
              {article.date}
            </time>
          )}
        </div>
      </article>
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function NieuwsClient() {
  const [articles,     setArticles]     = useState<Article[]>([])
  const [filter,       setFilter]       = useState('Alles')
  const [visibleCount, setVisibleCount] = useState(18)
  const [showTop,      setShowTop]      = useState(false)
  const fetchedRef  = useRef<Set<string>>(new Set())
  const usedUrls    = useRef<Set<string>>(new Set())

  // Load article index
  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => {
        if (Array.isArray(data)) {
          setArticles(data)
          data.forEach(a => { if (a.imageUrl) usedUrls.current.add(a.imageUrl) })
        }
      })
      .catch(() => {})
  }, [])

  // Back-to-top visibility
  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 600)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Fetch missing images
  useEffect(() => {
    const toFetch = articles.filter(a => !a.imageUrl && !fetchedRef.current.has(a.slug)).slice(0, 20)
    if (!toFetch.length) return
    toFetch.forEach(a => fetchedRef.current.add(a.slug))

    toFetch.forEach(async (a, idx) => {
      await new Promise(r => setTimeout(r, idx * 150))
      const hash = slugHash(a.slug)
      const page = (hash % 8) + 1
      const q    = buildQuery(a.title, a.category)

      for (const pg of [page, ((page % 8) + 1)]) {
        try {
          const excludeParam = [...usedUrls.current].slice(0, 10).join(',')
          const res = await fetch(`${PROXY}/image-search?q=${encodeURIComponent(q)}&page=${pg}&hash=${hash}&exclude=${encodeURIComponent(excludeParam)}`)
          if (!res.ok) continue
          const data = await res.json()
          if (!data?.url) continue
          if (usedUrls.current.has(data.url)) continue
          usedUrls.current.add(data.url)
          setArticles(prev => prev.map(p => p.slug === a.slug ? { ...p, imageUrl: data.url } : p))
          return
        } catch {}
      }
    })
  }, [articles])

  // Category counts
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      counts[cat] = cat === 'Alles'
        ? articles.length
        : articles.filter(a => a.category?.toLowerCase() === cat).length
    }
    return counts
  }, [articles])

  const filtered = filter === 'Alles'
    ? articles
    : articles.filter(a => a.category?.toLowerCase() === filter)

  const isFiltered  = filter !== 'Alles'
  const featured    = !isFiltered && filtered.length > 0 ? filtered[0] : null
  const gridArticles = featured ? filtered.slice(1, visibleCount + 1) : filtered.slice(0, visibleCount)
  const hasMore     = filtered.length > (featured ? visibleCount + 1 : visibleCount)
  const loading     = articles.length === 0

  return (
    <>
      <Starfield />
      <Topbar />
      <SiteNav />

      <main id="main-content" style={{ position: 'relative', zIndex: 1, minHeight: '80vh' }}>
        {/* Page header */}
        <div style={{ borderBottom: '1px solid #252858', background: 'linear-gradient(180deg, rgba(26,26,46,0.9) 0%, transparent 100%)', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,60px) 40px' }}>
          <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 12 }}>
              Astronomie &amp; Ruimtevaart
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Nieuws
            </h1>
            <p style={{ color: '#8A9CC0', fontSize: '0.95rem' }}>
              {articles.length > 0 ? `${articles.length} artikelen — dagelijks bijgewerkt` : 'Artikelen laden…'}
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div style={{ borderBottom: '1px solid #252858', padding: '0 clamp(16px,4vw,60px)', overflowX: 'auto' }}>
          <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', gap: 0 }}>
            {CATEGORIES.map(cat => {
              const count = catCounts[cat] ?? 0
              const active = filter === cat
              return (
                <button key={cat} onClick={() => { setFilter(cat); setVisibleCount(18) }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 20px', background: 'none', border: 'none', borderBottom: active ? '2px solid #378ADD' : '2px solid transparent', color: active ? '#fff' : '#4A5A8A', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#8A9CC0' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#4A5A8A' }}
                >
                  {cat}{loading ? '' : ` (${count})`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Article section */}
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '40px clamp(16px,4vw,60px) 64px' }}>

          {/* Skeleton loading */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
              {Array.from({ length: 9 }).map((_, i) => <ArticleSkeleton key={i} />)}
            </div>
          )}

          {/* Featured hero card */}
          {featured && <FeaturedCard article={featured} />}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔭</div>
              <p style={{ color: '#8A9CC0', fontSize: '0.9rem', marginBottom: 8 }}>
                Geen artikelen gevonden
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#4A5A8A', marginBottom: 28 }}>
                in categorie &ldquo;{filter}&rdquo;
              </p>
              <button
                onClick={() => { setFilter('Alles'); setVisibleCount(18) }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', background: 'none', border: '1px solid rgba(55,138,221,0.4)', padding: '10px 24px', borderRadius: 2, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(55,138,221,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                Toon alle artikelen
              </button>
            </div>
          )}

          {/* Article grid */}
          {!loading && gridArticles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
              {gridArticles.map(a => <ArticleCard key={a.slug} article={a} />)}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <button onClick={() => setVisibleCount(c => c + 18)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', background: 'none', border: '1px solid rgba(55,138,221,0.35)', padding: '11px 28px', cursor: 'pointer', borderRadius: 2, transition: 'background 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(55,138,221,0.08)'; e.currentTarget.style.borderColor = 'rgba(55,138,221,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(55,138,221,0.35)' }}
              >
                Laad meer
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: '#4A5A8A' }}>
                {(featured ? gridArticles.length + 1 : gridArticles.length)} van {filtered.length}
              </span>
              <div style={{ flex: 1, height: 2, background: '#252858', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#378ADD', width: `${((featured ? gridArticles.length + 1 : gridArticles.length) / filtered.length) * 100}%`, borderRadius: 1, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />

      {/* Back-to-top button */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Terug naar boven"
          style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 50, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#12132A', border: '1px solid #378ADD', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#378ADD', boxShadow: '0 4px 20px rgba(55,138,221,0.2)', transition: 'transform 0.15s, box-shadow 0.15s', animation: 'fadeIn 0.2s ease both' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(55,138,221,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(55,138,221,0.2)' }}
        >
          ↑
        </button>
      )}
    </>
  )
}
