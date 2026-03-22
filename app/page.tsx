'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────
interface APODData {
  title:       string
  explanation: string
  url:         string
  hdurl?:      string
  media_type:  string
  copyright?:  string
  date:        string
}

interface ISSData {
  latitude:  number
  longitude: number
  altitude:  number
  velocity:  number
}

interface Article {
  slug:      string
  title:     string
  excerpt:   string
  category:  string
  catColor:  string
  bgColor:   string
  author:    string
  date:      string
  readTime:  number
  featured:  boolean
  imageUrl?: string
}

// ── Fallback articles ──────────────────────────────────────────────────────
const FALLBACK_ARTICLES: Article[] = [
  { slug: 'james-webb-k2-18b-biosignatuur', title: 'James Webb vindt mogelijke sporen van leven op K2-18b', excerpt: 'De JWST heeft dimethylsulfide gedetecteerd in de atmosfeer van K2-18b — een molecuul dat op Aarde uitsluitend door levende organismen wordt gemaakt.', category: 'James Webb', catColor: '#7aadff', bgColor: 'linear-gradient(135deg,#0a1030,#1a2860)', author: 'Redactie', date: '11 mrt 2026', readTime: 6, featured: true },
  { slug: 'desi-donkere-energie', title: 'DESI: donkere energie verzwakt al 4,5 miljard jaar', excerpt: 'De grootste 3D kaart van het heelal toont dat de kracht van donkere energie niet constant is — een potentiële revolutie in de kosmologie.', category: 'Kosmologie', catColor: '#c080ff', bgColor: 'linear-gradient(135deg,#0f0520,#1a0a35)', author: 'Redactie', date: '9 mrt 2026', readTime: 5, featured: false },
  { slug: 'starship-mechazilla', title: 'Starship IFT-7: booster gevangen door Mechazilla', excerpt: 'SpaceX\' mechanische arm ving opnieuw de Super Heavy booster op — een mijlpaal voor volledig herbruikbare ruimtevaart.', category: 'Missies', catColor: '#3dcfdf', bgColor: 'linear-gradient(135deg,#051a20,#0a3040)', author: 'Redactie', date: '7 mrt 2026', readTime: 4, featured: false },
  { slug: 'perseverance-mars', title: 'Perseverance vindt \'luipaardvlekken\' in Jezero krater', excerpt: 'Vreemde geologische patronen op Mars verbazen wetenschappers wereldwijd.', category: 'Mars', catColor: '#ff8a60', bgColor: 'linear-gradient(135deg,#1a0a05,#3a1510)', author: 'Redactie', date: '5 mrt 2026', readTime: 3, featured: false },
  { slug: 'komeet-c2026-a1', title: 'Komeet C/2026 A1 mogelijk zichtbaar met blote oog', excerpt: 'Astronomen zijn enthousiast over een heldere komeet die in april zichtbaar wordt.', category: 'Sterrenkijken', catColor: '#378ADD', bgColor: 'linear-gradient(135deg,#1a1505,#2a2010)', author: 'Redactie', date: '3 mrt 2026', readTime: 3, featured: false },
  { slug: 'neutronenster-uitgelegd', title: 'Wat is een neutronenster? Uitleg in 3 niveaus', excerpt: 'Van makkelijk naar technisch — ons AI-systeem legt het uit op jouw niveau.', category: 'Educatie', catColor: '#3ddf90', bgColor: 'linear-gradient(135deg,#051a10,#0a2a1a)', author: 'Redactie', date: '1 mrt 2026', readTime: 5, featured: false },
]

// ── Reading level ──────────────────────────────────────────────────────────
function getLevel(category: string): 'beg' | 'ama' | 'pro' {
  const c = category.toLowerCase()
  if (c.includes('educatie') || c.includes('sterrenkijken')) return 'beg'
  if (c.includes('kosmologie') || c.includes('theoret'))    return 'pro'
  return 'ama'
}
const LEVEL_LABEL = { beg: 'Beginner', ama: 'Amateur', pro: 'Pro' }
const LEVEL_COLOR = {
  beg: { bg: 'rgba(224,80,64,0.12)',  color: '#e05040', border: '#e05040' },
  ama: { bg: 'rgba(61,223,144,0.12)', color: '#3ddf90', border: '#3ddf90' },
  pro: { bg: 'rgba(61,207,223,0.12)', color: '#3dcfdf', border: '#3dcfdf' },
}

// ── Per-article unique visual fingerprint ──────────────────────────────────
// Deterministic hash so every article always gets the same visual
function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

// Dark background color pairs — visually distinct across categories
const DARK_PAIRS = [
  ['#04060f', '#0b1226'],
  ['#08040e', '#140820'],
  ['#04090a', '#0c1c1e'],
  ['#0e0804', '#201408'],
  ['#04080f', '#081524'],
  ['#0a0408', '#1c0810'],
  ['#060a04', '#101e08'],
  ['#0b060e', '#1a0c22'],
] as const

function articleVisual(article: Article) {
  const h = slugHash(article.slug)
  const angle = 108 + (h % 144)                   // 108°–252°, unique angle
  const pair  = DARK_PAIRS[h % DARK_PAIRS.length]  // unique dark bg pair
  const cx    = 10 + (h % 75)                      // glow circle x: 10–85%
  const cy    = 5  + ((h >> 8) % 70)               // glow circle y: 5–75%
  return {
    gradient: `linear-gradient(${angle}deg, ${pair[0]} 0%, ${pair[1]} 100%)`,
    cx, cy,
  }
}

// ── Ticker items ───────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'James Webb detecteert DMS op K2-18b',
  'SpaceX Starship IFT-8 gepland Q2 2026',
  'Vera Rubin Observatory start eerste survey',
  'ESA Hera nadert asteroïde Dimorphos',
  'DESI kaart onthult dynamische donkere energie',
  'Komeet C/2026 A1 verwacht in april',
]

// ── Topic filters ──────────────────────────────────────────────────────────
const TOPICS = ['Alles', 'James Webb', 'Mars', 'Missies', 'Zwarte Gaten', 'Maan', 'Sterrenkijken', 'Zonnestelsel', 'Kosmologie']

function topicMatches(category: string, topic: string): boolean {
  if (topic === 'Alles') return true
  return category.toLowerCase().includes(topic.toLowerCase())
}

const PAGE_SIZE = 9 // articles per page

// ── Starfield canvas ───────────────────────────────────────────────────────
function Starfield() {
  useEffect(() => {
    const canvas = document.getElementById('cosmosnl-starfield') as HTMLCanvasElement
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
  return <canvas id="cosmosnl-starfield" suppressHydrationWarning aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
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
        <Link href="/" style={{ color: '#FFFFFF' }} aria-current="true">NL</Link>
        <Link href="/en" style={{ color: '#4A5A8A' }}>EN</Link>
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
  const navLinks = [
    { href: '/nieuws',        label: 'Nieuws' },
    { href: '/sterrenkijken', label: 'Sterrenkijken' },
    { href: '/missies',       label: 'Missies' },
    { href: '/educatie',      label: 'Educatie' },
  ]
  return (
    <>
      <nav aria-label="Hoofdnavigatie" style={{ position: 'sticky', top: 0, zIndex: 20, height: 'var(--nav-h)', background: 'rgba(26,26,46,0.96)', borderBottom: '1px solid #252858', backdropFilter: 'blur(16px)' }}>
        <div className="nav-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 40 }}>
          <Link href="/" aria-label="NightGazer — naar de startpagina" style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 46, width: 'auto', display: 'block' }} />
          </Link>
          <ul className="nav-links" role="list" style={{ gap: 32, flex: 1, justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', textDecoration: 'none', transition: 'color 0.15s', padding: '8px 0' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4A5A8A')}
                >{label}</Link>
              </li>
            ))}
            <li><Link href="/tools/herschrijver" style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none' }}>AI Tools</Link></li>
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Link href="/nieuwsbrief" className="btn-clip-sm" style={{ background: '#378ADD', color: '#1A1A2E', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '9px 20px', textDecoration: 'none', display: 'inline-block', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
            >Nieuwsbrief</Link>
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
          {[...navLinks, { href: '/tools/herschrijver', label: 'AI Tools' }, { href: '/nieuwsbrief', label: 'Nieuwsbrief' }].map(({ href, label }) => (
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

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ apod, featuredSlug }: { apod: APODData | null; featuredSlug: string }) {
  const heroHref   = apod ? 'https://apod.nasa.gov/apod/astropix.html' : `/nieuws/${featuredSlug}`
  const heroTarget = apod ? '_blank' : '_self'
  const heroLabel  = apod ? 'Bekijk op NASA' : 'Lees het artikel'
  return (
    <section aria-labelledby="hero-title" style={{ position: 'relative', zIndex: 1, minHeight: '88vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#12132A' }}>
        {apod?.media_type === 'image' && (
          <img src={`https://images.weserv.nl/?url=${encodeURIComponent(apod.hdurl || apod.url)}`} alt={apod.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, filter: 'brightness(0.85) saturate(1.15)' }} />
        )}
        {!apod && <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#12132A 0%,#1A2A4A 50%,#0a1020 100%)' }} />}
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0.75) 35%, rgba(26,26,46,0.1) 75%, transparent 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,26,46,0.55) 0%, transparent 60%)' }} />
      <div className="hero-content-pad animate-fadeUp" style={{ position: 'relative', zIndex: 2, maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div aria-hidden="true" style={{ width: 32, height: 1, background: '#378ADD' }} />
          <span role="status" aria-live="polite" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(224,80,64,0.15)', border: '1px solid rgba(224,80,64,0.4)', color: '#ff7060', fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 2 }}>
            <span className="animate-pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05040', flexShrink: 0 }} aria-hidden="true" />
            NASA APOD
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', color: '#378ADD', textTransform: 'uppercase' }}>Foto van de dag</span>
        </div>
        <h1 id="hero-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem,5.5vw,4.4rem)', fontWeight: 700, lineHeight: 1.06, color: '#FFFFFF', marginBottom: 20, letterSpacing: '-0.01em' }}>
          {apod?.title || 'Elke dag een nieuw venster op het heelal'}
        </h1>
        <p style={{ fontSize: '1rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520, marginBottom: 32 }}>
          {apod?.explanation ? apod.explanation.slice(0, 200) + '…' : 'NASA publiceert dagelijks de mooiste astronomische foto — wij leggen het uit op jouw niveau, van beginner tot professional.'}
        </p>
        <div className="hero-ctas" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={heroHref} target={heroTarget} rel="noopener noreferrer" className="btn-clip" style={{ background: '#FFFFFF', color: '#1A1A2E', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
          >
            {heroLabel}
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <a href="#nieuws" style={{ fontSize: '0.72rem', color: '#8A9BC4', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
          >
            Alle nieuws
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </div>
      {apod?.copyright && <div style={{ position: 'absolute', bottom: 16, right: 24, zIndex: 3, fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'rgba(120,130,160,0.5)' }}>© {apod.copyright}</div>}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 24, right: 40, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, #4A5A8A, transparent)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4A5A8A', writingMode: 'vertical-rl' }}>Scroll</span>
      </div>
    </section>
  )
}

// ── Topics filter strip (controlled) ──────────────────────────────────────
function TopicsStrip({ active, onFilter, counts }: { active: string; onFilter: (t: string) => void; counts: Record<string, number> }) {
  return (
    <div role="navigation" aria-label="Onderwerp filter" style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid #252858', background: '#1A1A2E' }}>
      <div className="topics-pad" role="tablist" aria-label="Filter op onderwerp" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TOPICS.map(t => {
          const count = counts[t] ?? 0
          const isActive = active === t
          return (
            <button
              key={t}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilter(t)}
              style={{
                flexShrink: 0,
                padding: '13px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive ? '#FFFFFF' : '#4A5A8A',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid #378ADD' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#8A9BC4' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#4A5A8A' }}
            >
              {t}
              {/* Article count badge */}
              {t !== 'Alles' && count > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 16, padding: '0 5px', background: isActive ? 'rgba(55,138,221,0.2)' : 'rgba(74,82,120,0.3)', color: isActive ? '#378ADD' : '#4A5A8A', fontFamily: 'var(--font-mono)', fontSize: '0.48rem', borderRadius: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {count}
                </span>
              )}
              {isActive && <span aria-hidden="true" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#378ADD', marginLeft: 2 }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Bento card ─────────────────────────────────────────────────────────────
function BentoCard({ article, size }: { article: Article; size: 'hero' | 'md' | 'sm' }) {
  const thumbH   = size === 'hero' ? 320 : size === 'md' ? 180 : 130
  const { gradient, cx, cy } = articleVisual(article)
  const lvl  = getLevel(article.category)
  const lvlC = LEVEL_COLOR[lvl]

  return (
    <article className={`card-wrap bento-${size}`} style={{ background: '#12132A', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'background 0.25s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#16173A')}
      onMouseLeave={e => (e.currentTarget.style.background = '#12132A')}
    >
      <Link href={`/nieuws/${article.slug}`} aria-label={article.title} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: thumbH, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {/* Category top accent */}
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: article.catColor, zIndex: 2 }} />
          {/* Unique gradient background */}
          <div className="card-thumb-inner" style={{ width: '100%', height: '100%', background: gradient, position: 'relative' }}>
            {/* Glow circle — unique position per article */}
            <div aria-hidden="true" style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, width: 120, height: 120, borderRadius: '50%', background: article.catColor, opacity: 0.18, filter: 'blur(28px)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
            {/* Category badge */}
            <span style={{ position: 'absolute', bottom: 12, left: 14, fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.catColor, background: 'rgba(26,26,46,0.75)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: 2, border: `1px solid ${article.catColor}30`, zIndex: 2 }}>
              {article.category}
            </span>
          </div>
        </div>
        <div style={{ padding: size === 'hero' ? 32 : size === 'md' ? 20 : 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.18, color: '#FFFFFF', fontSize: size === 'hero' ? '2rem' : size === 'md' ? '1.15rem' : '0.95rem', marginBottom: size === 'sm' ? 0 : 10 }}>
            {article.title}
          </h2>
          {size !== 'sm' && (
            <p style={{ fontSize: '0.82rem', color: '#8A9BC4', lineHeight: 1.65, flex: 1, display: '-webkit-box', WebkitLineClamp: size === 'hero' ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: size === 'hero' ? 20 : 16 }}>
              {article.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: '#4A5A8A', letterSpacing: '0.05em', marginTop: 'auto', paddingTop: size === 'sm' ? 8 : 12 }}>
            {size === 'hero' && <><span>{article.author}</span><span style={{ opacity: 0.4 }}>·</span></>}
            <span>{article.date}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{article.readTime} min</span>
            <span className="card-read-more" aria-hidden="true">Lees meer →</span>
          </div>
        </div>
      </Link>
    </article>
  )
}

// ── Article grid card ──────────────────────────────────────────────────────
// Replaces the old list row — richer card with unique visual + full excerpt
function ArticleGridCard({ article }: { article: Article }) {
  const { gradient, cx, cy } = articleVisual(article)
  const lvl  = getLevel(article.category)
  const lvlC = LEVEL_COLOR[lvl]
  const [hovered, setHovered] = useState(false)

  return (
    <article
      style={{ background: hovered ? '#16173A' : '#12132A', border: '1px solid #252858', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s', borderColor: hovered ? article.catColor + '40' : '#252858', boxShadow: hovered ? `0 4px 32px ${article.catColor}18` : 'none', borderRadius: 2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/nieuws/${article.slug}`} aria-label={article.title} style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}>

        {/* Thumbnail — unique gradient per article */}
        <div style={{ height: 140, position: 'relative', overflow: 'hidden', flexShrink: 0, background: gradient }}>
          {/* Unique glow circle */}
          <div aria-hidden="true" style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, width: 100, height: 100, borderRadius: '50%', background: article.catColor, opacity: 0.2, filter: 'blur(24px)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
          {/* Bottom fade into card */}
          <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, transparent, rgba(12,14,24,0.9))' }} />
          {/* Hover zoom effect */}
          <div style={{ position: 'absolute', inset: 0, background: article.catColor, opacity: hovered ? 0.04 : 0, transition: 'opacity 0.25s' }} />
          {/* Category badge overlay */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.catColor, background: 'rgba(26,26,46,0.8)', backdropFilter: 'blur(6px)', padding: '3px 8px', borderRadius: 2, border: `1px solid ${article.catColor}35` }}>
              {article.category}
            </span>
          </div>
          {/* Read time badge */}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#8A9BC4', background: 'rgba(26,26,46,0.7)', backdropFilter: 'blur(6px)', padding: '3px 7px', borderRadius: 2 }}>
              {article.readTime} min
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Title — the hero element */}
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.22, color: hovered ? '#fff' : '#FFFFFF', margin: 0, transition: 'color 0.15s', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h3>

          {/* Excerpt — gives the "why I should click" context */}
          <p style={{ fontSize: '0.78rem', color: '#8A9BC4', lineHeight: 1.65, margin: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.excerpt}
          </p>

          {/* Footer: level + date + hover arrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 10, borderTop: '1px solid #252858' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.48rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 6px', background: lvlC.bg, color: lvlC.color, borderLeft: `2px solid ${lvlC.border}`, borderRadius: 2 }}>
              {LEVEL_LABEL[lvl]}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#4A5A8A', marginLeft: 'auto' }}>
              {article.date}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: article.catColor, opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(-6px)', transition: 'opacity 0.15s, transform 0.15s' }} aria-hidden="true">
              → Lees
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

// ── ISS Widget ─────────────────────────────────────────────────────────────
function ISSWidget({ iss }: { iss: ISSData | null }) {
  const px = iss ? ((iss.longitude + 180) / 360 * 100) : 50
  const py = iss ? ((90 - iss.latitude)  / 180 * 100) : 50
  return (
    <div role="region" aria-labelledby="iss-title" style={{ border: '1px solid #252858', background: '#16173A', overflow: 'hidden', borderRadius: 2 }}>
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span id="iss-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ position: 'relative', width: 7, height: 7, flexShrink: 0 }} aria-hidden="true">
            <span className="animate-pulse-dot" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3ddf90' }} />
            <span className="animate-live-ring" style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid #3ddf90' }} />
          </span>
          ISS Live Tracker
        </span>
        <span aria-live="polite" aria-atomic="true" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#4A5A8A' }}>Realtime</span>
      </div>
      <div role="img" aria-label="ISS positie op wereldkaart" style={{ height: 160, background: '#050810', position: 'relative', overflow: 'hidden' }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, filter: 'brightness(0.5) saturate(0) sepia(1) hue-rotate(190deg)', position: 'absolute', inset: 0 }} />
        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}>
          {[25, 50, 75].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#3dcfdf" strokeWidth="0.5" />)}
          {[16.6, 33.3, 50, 66.6, 83.3].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#3dcfdf" strokeWidth="0.5" />)}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#3dcfdf" strokeWidth="1" opacity="0.4" />
        </svg>
        {iss && (
          <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <ellipse cx={`${px}%`} cy="50%" rx="18%" ry="28%" fill="none" stroke="#3ddf90" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.25" />
          </svg>
        )}
        <div aria-hidden="true" style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, width: 12, height: 12, transform: 'translate(-50%,-50%)', zIndex: 2, transition: 'left 2s linear, top 2s linear' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3ddf90', boxShadow: '0 0 0 3px rgba(61,223,144,0.25), 0 0 14px rgba(61,223,144,0.6)' }} />
          <div className="animate-live-ring" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(61,223,144,0.5)' }} />
        </div>
        {iss && <div aria-hidden="true" style={{ position: 'absolute', left: `${Math.min(px + 2, 83)}%`, top: `${Math.max(py - 14, 4)}%`, fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#3ddf90', letterSpacing: '0.1em', whiteSpace: 'nowrap', zIndex: 3 }}>ISS ↗</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {[
          { val: iss ? `${iss.latitude.toFixed(1)}°`               : '—',          lbl: 'Breedtegraad' },
          { val: iss ? `${iss.longitude.toFixed(1)}°`              : '—',          lbl: 'Lengtegraad' },
          { val: iss ? `${Math.round(iss.altitude)} km`            : '408 km',     lbl: 'Hoogte' },
          { val: iss ? `${(iss.velocity / 1000).toFixed(1)}k km/h` : '27.6k km/h', lbl: 'Snelheid' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '12px 20px', borderTop: '1px solid #252858', borderRight: i % 2 === 0 ? '1px solid #252858' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── APOD widget ────────────────────────────────────────────────────────────
function APODWidget({ apod }: { apod: APODData | null }) {
  return (
    <div role="region" aria-labelledby="apod-widget-title" style={{ border: '1px solid #252858', background: '#16173A', overflow: 'hidden', borderRadius: 2 }}>
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858' }}>
        <span id="apod-widget-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4' }}>NASA Foto van de Dag</span>
      </div>
      {apod?.media_type === 'image' ? (
        <img src={apod.url} alt={apod.title} loading="lazy" style={{ width: '100%', height: 160, objectFit: 'cover', filter: 'brightness(0.85) saturate(1.1)', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg,#0a1030,#1a2060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="4" fill="rgba(55,138,221,0.6)" /><circle cx="24" cy="24" r="10" fill="none" stroke="rgba(55,138,221,0.2)" strokeWidth="1" /><circle cx="24" cy="24" r="18" fill="none" stroke="rgba(55,138,221,0.08)" strokeWidth="1" /></svg>
        </div>
      )}
      {apod && (
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.53rem', letterSpacing: '0.1em', color: '#378ADD', marginBottom: 6 }}>
            {new Date(apod.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.3, marginBottom: 6 }}>{apod.title}</div>
          <p style={{ fontSize: '0.76rem', color: '#8A9BC4', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{apod.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ── AI promo widget ────────────────────────────────────────────────────────
function AIPromoWidget() {
  const LEVELS_UI = [
    { key: 'beg', label: 'Beginner', color: '#e05040', border: 'rgba(224,80,64,0.4)', bg: 'rgba(224,80,64,0.1)' },
    { key: 'ama', label: 'Amateur',  color: '#3ddf90', border: 'rgba(61,223,144,0.4)', bg: 'rgba(61,223,144,0.1)' },
    { key: 'pro', label: 'Pro',      color: '#3dcfdf', border: 'rgba(61,207,223,0.4)', bg: 'rgba(61,207,223,0.1)' },
  ]
  return (
    <div role="region" aria-label="AI feature" style={{ border: '1px solid rgba(55,138,221,0.3)', background: 'linear-gradient(135deg,rgba(16,17,42,0.95),rgba(20,25,60,0.95))', padding: 24, position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
      <div aria-hidden="true" style={{ position: 'absolute', right: 16, top: 12, fontSize: '4rem', color: '#8a6820', opacity: 0.12, lineHeight: 1, pointerEvents: 'none' }}>✦</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 12 }}>✦ AI Feature</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 10 }}>Lees elk artikel op jouw niveau</div>
      <p style={{ fontSize: '0.76rem', color: '#8A9BC4', lineHeight: 1.65, marginBottom: 16 }}>Kies Beginner, Amateur of Pro — onze AI herschrijft het artikel live voor jou.</p>
      <div role="group" aria-label="Lees niveau keuze" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {LEVELS_UI.map(l => (
          <button key={l.key} aria-label={`${l.label} niveau`} style={{ flex: 1, padding: '6px 0', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', border: `1px solid ${l.border}`, color: l.color, background: 'transparent', borderRadius: 2, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = l.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{l.label}</button>
        ))}
      </div>
      <Link href="/tools/herschrijver" className="btn-clip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#378ADD', color: '#1A1A2E', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 20px', textDecoration: 'none', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
        onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
      >Probeer het nu →</Link>
    </div>
  )
}

// ── Newsletter ─────────────────────────────────────────────────────────────
function Newsletter() {
  return (
    <section aria-labelledby="newsletter-title" style={{ position: 'relative', zIndex: 1, background: '#12132A', borderTop: '1px solid #252858', borderBottom: '1px solid #252858', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 100% 50%, rgba(55,138,221,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="newsletter-grid newsletter-inner" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '64px var(--sp-10)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden="true" style={{ width: 28, height: 1, background: '#378ADD', display: 'inline-block' }} />
            Nieuwsbrief
          </div>
          <h2 id="newsletter-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 16 }}>Het heelal<br />in je inbox</h2>
          <p style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 440 }}>Wekelijks de belangrijkste ontdekkingen, komende lanceringen en sterrenkijk-tips — uitgelegd op jouw niveau. Geen spam, altijd uitschrijfbaar.</p>
          <div style={{ display: 'flex', gap: 32, marginTop: 24, flexWrap: 'wrap' }}>
            {[['Wekelijks', 'Frequentie'], ['Gratis', 'Altijd']].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: '#378ADD', lineHeight: 1 }}>{val}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <form action="#" method="post" aria-label="Nieuwsbrief aanmelden" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="nl-input-wrap" style={{ display: 'flex', gap: 2, background: '#252858' }}>
            <label htmlFor="nl-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>E-mailadres</label>
            <input id="nl-email" type="email" name="email" placeholder="jouw@email.nl" required autoComplete="email" inputMode="email" style={{ flex: 1, background: '#0F1028', border: 'none', padding: '14px 18px', color: '#FFFFFF', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', outline: 'none' }}
              onFocus={e => (e.currentTarget.style.background = '#141530')}
              onBlur={e => (e.currentTarget.style.background = '#0F1028')}
            />
            <button type="submit" aria-label="Aanmelden voor nieuwsbrief" style={{ background: '#378ADD', color: '#1A1A2E', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 22px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
            >Aanmelden</button>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: '#4A5A8A', lineHeight: 1.6 }}>
            Door aan te melden ga je akkoord met onze <Link href="/privacy" style={{ color: '#8A9BC4', textDecoration: 'underline', textUnderlineOffset: 3 }}>privacyverklaring</Link>. Je kunt je altijd uitschrijven.
          </p>
        </form>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────
function SiteFooter() {
  const cols = [
    { title: 'Onderwerpen', links: [['James Webb', '/nieuws'], ['Mars Exploratie', '/nieuws'], ['Zwarte Gaten', '/nieuws'], ['Sterrenkijken', '/sterrenkijken'], ['Exoplaneten', '/nieuws']] },
    { title: 'Tools',       links: [['AI Herschrijver', '/tools/herschrijver'], ['ISS Tracker', '/'], ['Sterrenkaart', '/sterrenkijken'], ['Lanceringskalender', '/missies']] },
    { title: 'Over ons',    links: [['Redactie', '/over'], ['Nieuwsbrief', '/nieuwsbrief'], ['Contact', '/contact'], ['Privacy', '/privacy']] },
  ]
  return (
    <footer role="contentinfo" style={{ position: 'relative', zIndex: 1, background: '#12132A', borderTop: '1px solid #252858' }}>
      <div className="footer-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div className="footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}>
              <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 42, width: 'auto', display: 'block' }} />
            </div>
            <p style={{ fontSize: '0.82rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 280, marginBottom: 24 }}>Nederlandstalig astronomie-platform met AI-aangedreven uitleg op jouw niveau. Van beginners tot professionals.</p>
            <div style={{ display: 'flex', gap: 10 }} aria-label="Sociale media">
              {[
                { href: '#', label: 'NightGazer op X', icon: <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M12.6 1h2.4l-5.2 6 6.2 8H12l-3.7-4.9L3.8 15H1.4l5.5-6.3L.8 1H5l3.4 4.5L12.6 1z" /></svg> },
                { href: '#', label: 'NightGazer op Instagram', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" width="13" height="13"><rect x="1.5" y="1.5" width="13" height="13" rx="3.5" /><circle cx="8" cy="8" r="3" /><circle cx="11.5" cy="4.5" r="0.7" fill="currentColor" stroke="none" /></svg> },
                { href: '#', label: 'NightGazer op YouTube', icon: <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M14.5 4.5s-.2-1.2-.7-1.7c-.7-.7-1.4-.7-1.8-.8C10.5 2 8 2 8 2s-2.5 0-4 .1c-.4 0-1.1.1-1.8.8-.5.5-.7 1.7-.7 1.7S1.3 5.9 1.3 7.3v1.3c0 1.4.2 2.8.2 2.8s.2 1.2.7 1.7c.7.7 1.6.7 2 .7C5.5 14 8 14 8 14s2.5 0 4-.1c.4-.1 1.1-.1 1.8-.8.5-.5.7-1.7.7-1.7s.2-1.4.2-2.8V7.3C14.7 5.9 14.5 4.5 14.5 4.5zM6.5 10.2V5.8l4.5 2.2-4.5 2.2z" /></svg> },
              ].map(({ href, label, icon }) => (
                <a key={label} href={href} aria-label={label} style={{ width: 32, height: 32, border: '1px solid #2A2E62', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5A8A', transition: 'border-color 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4A5A8A'; e.currentTarget.style.color = '#8A9BC4' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2E62'; e.currentTarget.style.color = '#4A5A8A' }}
                >{icon}</a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 16 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontSize: '0.82rem', color: '#8A9BC4', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="footer-bottom-row" style={{ borderTop: '1px solid #252858', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', letterSpacing: '0.06em', color: '#2A3060' }}>© 2026 NightGazer — Astronomie voor iedereen</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#2A3060' }}>
            {[['Claude AI', '⬡'], ['NASA Open APIs', '★']].map(([label, icon]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', border: '1px solid #252858', borderRadius: 2 }}>
                <span aria-hidden="true">{icon}</span>{label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [apod,         setApod]         = useState<APODData | null>(null)
  const [iss,          setIss]          = useState<ISSData | null>(null)
  const [articles,     setArticles]     = useState<Article[]>(FALLBACK_ARTICLES)
  const [activeFilter, setActiveFilter] = useState('Alles')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset pagination when filter changes
  const handleFilter = useCallback((topic: string) => {
    setActiveFilter(topic)
    setVisibleCount(PAGE_SIZE)
  }, [])

  // Load articles from articles-index.json
  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => { if (Array.isArray(data) && data.length > 0) setArticles(data) })
      .catch(() => {})
  }, [])

  // Fetch APOD
  useEffect(() => {
    fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.NEXT_PUBLIC_NASA_API_KEY || 'DEMO_KEY'}`)
      .then(r => r.json()).then(setApod).catch(() => {})
  }, [])

  // Fetch ISS every 5s
  useEffect(() => {
    const fetchISS = () => fetch('https://api.wheretheiss.at/v1/satellites/25544').then(r => r.json()).then(setIss).catch(() => {})
    fetchISS()
    const id = setInterval(fetchISS, 5000)
    return () => clearInterval(id)
  }, [])

  // Derived state
  const featuredArticle = articles.find(a => a.featured) ?? articles[0]
  const gridArticles    = articles.slice(0, 6) // bento always shows latest 6

  // Filtered articles for the card grid (all articles, filtered by topic)
  const filtered  = articles.filter(a => topicMatches(a.category, activeFilter))
  const visible   = filtered.slice(0, visibleCount)
  const hasMore   = visibleCount < filtered.length

  // Topic counts for the filter badges
  const counts = TOPICS.reduce((acc, t) => {
    acc[t] = t === 'Alles' ? articles.length : articles.filter(a => topicMatches(a.category, t)).length
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      <a href="#main-content" className="skip-link">Ga naar hoofdinhoud</a>
      <Starfield />
      <Topbar />
      <SiteNav />
      <Hero apod={apod} featuredSlug={featuredArticle.slug} />

      {/* Topics — now functional filter */}
      <TopicsStrip active={activeFilter} onFilter={handleFilter} counts={counts} />

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="main-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--max-w)', margin: '0 auto' }}>

        {/* Bento: latest 6 articles (always unfiltered — quick overview) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16 }} id="nieuws">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>Uitgelicht</span>
            <div aria-hidden="true" style={{ width: 48, height: 1, background: '#2A2E62' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#4A5A8A' }}>Laatste nieuws</span>
        </div>
        <div className="bento-grid" role="list" aria-label="Uitgelichte artikelen">
          {gridArticles[0] && <BentoCard article={gridArticles[0]} size="hero" />}
          {gridArticles[1] && <BentoCard article={gridArticles[1]} size="md" />}
          {gridArticles[2] && <BentoCard article={gridArticles[2]} size="md" />}
          {gridArticles[3] && <BentoCard article={gridArticles[3]} size="sm" />}
          {gridArticles[4] && <BentoCard article={gridArticles[4]} size="sm" />}
          {gridArticles[5] && <BentoCard article={gridArticles[5]} size="sm" />}
        </div>

        {/* ── Article grid + sidebar ────────────────────────────────────── */}
        <div className="content-split">

          {/* Left: filtered card grid */}
          <section aria-labelledby="grid-label" aria-live="polite" aria-atomic="false">
            {/* Section header with filter status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span id="grid-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>
                  {activeFilter === 'Alles' ? 'Alle artikelen' : activeFilter}
                </span>
                <div aria-hidden="true" style={{ width: 32, height: 1, background: '#252858' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: '#4A5A8A' }}>
                {filtered.length} {filtered.length === 1 ? 'artikel' : 'artikelen'}
              </span>
            </div>

            {/* Empty state when filter has no results */}
            {filtered.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px solid #252858', borderRadius: 2 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#4A5A8A', marginBottom: 8 }}>Geen artikelen gevonden</div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#2A3060' }}>Probeer een ander onderwerp of bekijk alle artikelen.</p>
                <button onClick={() => handleFilter('Alles')} style={{ marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#378ADD', background: 'none', border: '1px solid rgba(55,138,221,0.3)', padding: '8px 20px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Toon alle artikelen
                </button>
              </div>
            )}

            {/* Article card grid — 2 cols desktop, 1 col mobile */}
            {visible.length > 0 && (
              <div className="article-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
                {visible.map(a => <ArticleGridCard key={a.slug} article={a} />)}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 8 }}>
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', background: 'none', border: '1px solid rgba(55,138,221,0.35)', padding: '11px 28px', cursor: 'pointer', borderRadius: 2, transition: 'background 0.15s, border-color 0.15s' }}
                  aria-label={`Laad meer artikelen — ${filtered.length - visibleCount} resterend`}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(55,138,221,0.08)'; e.currentTarget.style.borderColor = 'rgba(55,138,221,0.6)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(55,138,221,0.35)' }}
                >
                  Laad meer
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', color: '#4A5A8A' }}>
                  {visible.length} van {filtered.length}
                </span>
                {/* Progress bar */}
                <div style={{ flex: 1, height: 2, background: '#252858', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#378ADD', width: `${(visible.length / filtered.length) * 100}%`, borderRadius: 1, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            {/* All loaded indicator */}
            {!hasMore && filtered.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#2A3060', flexShrink: 0 }}>Alle {filtered.length} artikelen geladen</span>
                <div style={{ flex: 1, height: 1, background: '#252858' }} />
              </div>
            )}
          </section>

          {/* Right: sticky sidebar */}
          <aside aria-label="Widgets" className="sidebar-grid" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)', alignSelf: 'start' }}>
            <ISSWidget iss={iss} />
            <APODWidget apod={apod} />
            <AIPromoWidget />
          </aside>
        </div>

      </main>

      <Newsletter />
      <SiteFooter />
    </>
  )
}
