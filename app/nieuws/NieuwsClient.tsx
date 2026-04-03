'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

// Category fallback queries (English) — used when title yields no specific terms
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

// Recognisable English space proper nouns — extracted directly from Dutch titles
const SPACE_NOUNS = [
  'starship','falcon','artemis','starlink','spacex','hubble','webb','jwst',
  'perseverance','curiosity','ingenuity','voyager','cassini','landsat',
  'starliner','dragon','orion','sls','iss','juice','clipper','ariel',
  'saturn','jupiter','venus','mercury','neptune','uranus','pluto',
  'mars','moon','lunar','comet','asteroid','nebula','galaxy','aurora',
  'rocket','launch','orbit','astronaut','satellite','telescope','solar',
]

// Dutch astronomy words → English equivalents
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

// Build a specific English query from a Dutch article title:
// 1. Pick recognisable English space nouns already present in the title
// 2. Translate common Dutch astronomy words
// 3. Fall back to category query
function buildQuery(title: string, category: string): string {
  const lower = title.toLowerCase()

  // Step 1: English proper nouns / space terms already in the title
  const nouns = SPACE_NOUNS.filter(n => lower.includes(n))
  if (nouns.length >= 1) return nouns.slice(0, 3).join(' ')

  // Step 2: translate Dutch words
  const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/)
  const translated = words.map(w => NL_EN[w]).filter(Boolean) as string[]
  if (translated.length >= 1) return [...new Set(translated)].slice(0, 3).join(' ')

  // Step 3: category fallback
  return CAT_QUERIES[category?.toLowerCase() || ''] || 'space astronomy cosmos'
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

// ── Article card ───────────────────────────────────────────────────────────
function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/nieuws/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <article
        style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#378ADD')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#252858')}
      >
        {article.imageUrl && (
          <div style={{ height: 180, overflow: 'hidden', flexShrink: 0 }}>
            <img src={`https://images.weserv.nl/?url=${encodeURIComponent(article.imageUrl)}&w=600&h=360&fit=cover`} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        {!article.imageUrl && (
          <div style={{ height: 120, background: 'linear-gradient(135deg, #0a1030, #1a2860)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
            {article.emoji || '🌌'}
          </div>
        )}
        <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {article.category && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: article.catColor || '#7aadff', marginBottom: 8, display: 'block' }}>
              {article.category}
            </span>
          )}
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>
            {article.title}
          </h2>
          {article.excerpt && (
            <p style={{ fontSize: '0.82rem', color: '#8A9CC0', lineHeight: 1.5, flex: 1, marginBottom: 12 }}>
              {article.excerpt.length > 140 ? article.excerpt.slice(0, 140) + '…' : article.excerpt}
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
  const [articles,    setArticles]    = useState<Article[]>([])
  const [filter,      setFilter]      = useState('Alles')
  const [visibleCount,setVisibleCount]= useState(18)
  const fetchedRef  = useRef<Set<string>>(new Set())
  const usedUrls    = useRef<Set<string>>(new Set())

  // Load article index
  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => {
        if (Array.isArray(data)) {
          setArticles(data)
          // Pre-populate usedUrls with already-known images to avoid duplicates
          data.forEach(a => { if (a.imageUrl) usedUrls.current.add(a.imageUrl) })
        }
      })
      .catch(() => {})
  }, [])

  // Fetch images for articles without one — staggered to avoid overwhelming the worker
  useEffect(() => {
    const toFetch = articles.filter(a => !a.imageUrl && !fetchedRef.current.has(a.slug)).slice(0, 20)
    if (!toFetch.length) return
    toFetch.forEach(a => fetchedRef.current.add(a.slug))

    toFetch.forEach(async (a, idx) => {
      // Stagger requests: 150ms apart so the worker doesn't get hammered
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

  const filtered = filter === 'Alles'
    ? articles
    : articles.filter(a => a.category?.toLowerCase() === filter)

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

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
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => { setFilter(cat); setVisibleCount(18) }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 20px', background: 'none', border: 'none', borderBottom: filter === cat ? '2px solid #378ADD' : '2px solid transparent', color: filter === cat ? '#fff' : '#4A5A8A', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { if (filter !== cat) e.currentTarget.style.color = '#8A9CC0' }}
                onMouseLeave={e => { if (filter !== cat) e.currentTarget.style.color = '#4A5A8A' }}
              >
                {cat === 'Alles' ? `Alles (${articles.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Article grid */}
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '40px clamp(16px,4vw,60px) 64px' }}>
          {visible.length === 0 && articles.length > 0 && (
            <p style={{ color: '#4A5A8A', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>Geen artikelen in deze categorie.</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
            {visible.map(a => <ArticleCard key={a.slug} article={a} />)}
          </div>

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
                {visible.length} van {filtered.length}
              </span>
              <div style={{ flex: 1, height: 2, background: '#252858', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#378ADD', width: `${(visible.length / filtered.length) * 100}%`, borderRadius: 1, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
