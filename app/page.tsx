'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MISSIONS } from '@/lib/missions-data'

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

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

const PAGE_SIZE = 12 // articles per page

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
          {[...navLinks].map(({ href, label }) => (
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
            {/* Actual image when available */}
            {article.imageUrl && (
              <img src={`${PROXY}/image-proxy?url=${encodeURIComponent(article.imageUrl)}`} alt="" aria-hidden="true" loading="lazy"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7) saturate(1.1)' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            {/* Glow circle — unique position per article */}
            {!article.imageUrl && <div aria-hidden="true" style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, width: 120, height: 120, borderRadius: '50%', background: article.catColor, opacity: 0.18, filter: 'blur(28px)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />}
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
// ── Missies strip ──────────────────────────────────────────────────────────
function MissiesStrip() {
  const active = MISSIONS.filter(m => m.status === 'actief').slice(0, 5)
  return (
    <section aria-labelledby="missies-strip-label" style={{ margin: '32px 0 8px', borderTop: '1px solid #252858', paddingTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span id="missies-strip-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>Actieve Missies</span>
          <div aria-hidden="true" style={{ width: 48, height: 1, background: '#2A2E62' }} />
        </div>
        <Link href="/missies" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none' }}>
          Alle missies →
        </Link>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {active.map(m => (
          <Link key={m.id} href={`/missies/${m.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ background: `linear-gradient(135deg, ${m.bgFrom}, ${m.bgTo})`, border: '1px solid #252858', borderRadius: 6, padding: '14px 18px', minWidth: 160, maxWidth: 200, transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 130 }}
                 onMouseEnter={e => (e.currentTarget.style.borderColor = m.agencyColor)}
                 onMouseLeave={e => (e.currentTarget.style.borderColor = '#252858')}>
              <div>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: m.agencyColor, marginBottom: 4 }}>{m.agency}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>{m.name}</div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(61,207,111,0.12)', border: '1px solid rgba(61,207,111,0.25)', borderRadius: 20, padding: '2px 8px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3ddf90' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.46rem', color: '#3ddf90', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actief</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

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
          {/* Actual image when available */}
          {article.imageUrl && (
            <img src={`${PROXY}/image-proxy?url=${encodeURIComponent(article.imageUrl)}`} alt="" aria-hidden="true" loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65) saturate(1.1)' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          )}
          {/* Unique glow circle (only when no image) */}
          {!article.imageUrl && <div aria-hidden="true" style={{ position: 'absolute', left: `${cx}%`, top: `${cy}%`, width: 100, height: 100, borderRadius: '50%', background: article.catColor, opacity: 0.2, filter: 'blur(24px)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />}
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

// ── Stargazing mini-widget ──────────────────────────────────────────────────
const SK_DARK_SPOTS = [
  { name: 'Terschelling',    lat: 53.43, lon: 5.35 },
  { name: 'Spiekeroog (DE)', lat: 53.77, lon: 7.69 },
  { name: 'Lauwersmeer',     lat: 53.36, lon: 6.20 },
  { name: 'Bargerveen',      lat: 52.68, lon: 7.03 },
  { name: 'Bourtangermoor',  lat: 53.01, lon: 7.20 },
  { name: 'Fochteloërveen',  lat: 52.96, lon: 6.38 },
]
const SK_OBJECTS = [
  { obj: 'Jupiter',          icon: '♃' },
  { obj: 'Venus',            icon: '♀' },
  { obj: 'Mars',             icon: '♂' },
  { obj: 'Orionnevel (M42)', icon: '⭐' },
]

// ── Daily quiz data ─────────────────────────────────────────────────────────
type QuizLevel = { q: string; options: string[]; correct: number; explain: string }
const DAILY_QUESTIONS: { id: number; topic: string; beg: QuizLevel; ama: QuizLevel; pro: QuizLevel }[] = [
  {
    id: 0, topic: 'Zwarte gaten',
    beg: { q: 'Wat is een eventhorizon?', options: ['De baan van een planeet om een zwart gat', 'De grens waarbinnen niets — ook licht niet — kan ontsnappen', 'Het middelpunt van een zwart gat', 'Een kosmische schokgolf'], correct: 1, explain: 'De eventhorizon is de "point of no return" rond een zwart gat. De zwaartekracht is daar zo sterk dat de ontsnappingssnelheid groter is dan de lichtsnelheid — alles wat erover gaat, is voorgoed verdwenen voor de buitenwereld.' },
    ama: { q: 'De Schwarzschild-straal Rs = 2GM/c². Wat beschrijft Rs?', options: ['De straal van de accretieschijf', 'De straal van de eventhorizon van een niet-roterend zwart gat', 'De gemiddelde afstand tot het centrum van een neutronenster', 'De Hawking-temperatuur-straal'], correct: 1, explain: 'Rs = 2GM/c² geeft de eventhorizon van een niet-roterend (Schwarzschild-)zwart gat. Voor de zon zou Rs ≈ 3 km zijn. Sgr A* (4×10⁶ M☉) heeft Rs ≈ 12 miljoen km — kleiner dan de baan van Mercurius.' },
    pro: { q: 'Welk proces onttrekt energie aan een Kerr-zwart gat via de ergosphere?', options: ['Bondi-accretie', 'Penrose-proces via frame-dragging', 'Hawking-verdamping', 'Magnetorotatieve instabiliteit'], correct: 1, explain: 'In het Penrose-proces valt een deeltje in de ergosphere uiteen: één fragment belandt in een negatieve energiebaan (valt in het zwarte gat) en het andere ontsnapt met méér energie dan de inkomende deeltje had — ten koste van het rotatie-impulsmoment van het Kerr-zwarte gat.' },
  },
  {
    id: 1, topic: 'Oerknal',
    beg: { q: 'Hoe oud is het heelal?', options: ['4,6 miljard jaar', '13,8 miljard jaar', '100 miljard jaar', '1 biljoen jaar'], correct: 1, explain: 'Het heelal is 13,787 ± 0,020 miljard jaar oud, vastgesteld via de Planck-satelliet (2018). Ter vergelijking: de Aarde is slechts 4,6 miljard jaar oud — het heelal bestond al meer dan 9 miljard jaar vóór onze planeet.' },
    ama: { q: 'Wat geeft de Hubble-constante H₀ aan?', options: ['De ouderdom van het heelal', 'De uitdijingssnelheid van het heelal per afstandseenheid (km/s/Mpc)', 'De dichtheid van donkere materie', 'De temperatuur van de CMB'], correct: 1, explain: 'H₀ beschrijft hoe snel het heelal uitdijt: per Megaparsec extra afstand vliegen objecten ~67–73 km/s sneller van ons weg (Hubble-wet: v = H₀·d). De onzekerheid (67 vs 73) is de bekende "Hubble-spanning" — mogelijk nieuwe fysica.' },
    pro: { q: 'Welke observatie leverde het directe bewijs voor Big Bang Nucleosynthese (BBN)?', options: ['De ontdekking van de CMB in 1965', 'De gemeten H:He-massaverhouding van ~3:1 in oeroude sterrenstelsels', 'De roodverschuiving van verre quasars', 'De ontdekking van donkere energie via Type Ia supernovae'], correct: 1, explain: 'BBN voorspelt dat in de eerste minuten na de oerknal ~75% waterstof en ~25% helium (massaverhouding) werd gevormd. Deze primordiale abundanties, gemeten in metaalarme sterren en intergalactisch gas, bevestigen het standaard kosmologisch model.' },
  },
  {
    id: 2, topic: 'Exoplaneten',
    beg: { q: 'Hoe detecteert de transitmethode planeten?', options: ['De planeet zendt eigen licht uit dat we meten', 'De ster wordt iets donkerder als de planeet ervoor passeert', 'We fotograferen de planeet direct', 'De planeet vervormt de ster'], correct: 1, explain: 'Als een exoplaneet voor zijn ster langsbeweegt, blokkeert hij een klein deel van het sterlicht — de ster wordt even iets donkerder. Die dip in helderheid verraadt de planeet. Hoe groter de planeet, hoe dieper de dip: ΔF/F = (Rplaneet/Rster)².' },
    ama: { q: 'Welke telescoop ontdekte de meeste exoplaneten via de transitmethode?', options: ['Hubble', 'James Webb', 'Kepler/K2', 'Spitzer'], correct: 2, explain: 'De Kepler-ruimtetelescoop (2009–2018) ontdekte meer dan 2.600 bevestigde exoplaneten door 9 jaar lang ~150.000 sterren te monitoren op helderheidsvariaties. Zijn opvolger TESS (2018–heden) zoekt dichter bij huis naar planeten rond heldere sterren.' },
    pro: { q: 'Welke parameter beschrijft de atmosferische schaallengte H in transmissiespectroscopie?', options: ['H = kT/μg — thermische energie gedeeld door moleculaire massa × zwaartekracht', 'H = Rs/2 (halve Schwarzschild-straal)', 'H = Rplaneet/Rster', 'H = GMster/c²'], correct: 0, explain: 'De schaallengte H = kT_eq/(μg) bepaalt hoe snel de atmosfeer qua druk afneemt met hoogte. Een hoge T of lage μ (licht molecuul, bijv. H₂) geeft een grote H en dus een sterker transmissiesignaal — makkelijker te detecteren met JWST.' },
  },
  {
    id: 3, topic: 'Melkweg',
    beg: { q: 'Welk type sterrenstelsel is de Melkweg?', options: ['Elliptisch stelsel', 'Onregelmatig stelsel', 'Spiraalstelsel met een bar (staaf)', 'Bolvormig stelsel'], correct: 2, explain: 'De Melkweg is een balkspiraalsterrenstelsel (SBbc-type) — een spiraalstelsel met een centrale balkstructuur waaruit de spiraalvormige armen ontspringen. We bevinden ons op ~26.000 lichtjaar van het centrum, in de Orion-arm.' },
    ama: { q: 'Hoeveel sterren bevat de Melkweg bij benadering?', options: ['1 miljard', '10 miljard', '100–400 miljard', '1 biljoen'], correct: 2, explain: 'Schattingen lopen uiteen van 100 tot 400 miljard sterren in de Melkweg. Het grote bereik komt doordat we de distributie van zwakkere, moeilijk zichtbare sterren moeten extrapoleren. De meeste massa zit in de bulge en het halo.' },
    pro: { q: 'Wat is de massa van Sgr A* in zonsmassa\'s?', options: ['~4 × 10⁴ M☉', '~4 × 10⁶ M☉', '~4 × 10⁹ M☉', '~4 × 10¹² M☉'], correct: 1, explain: 'Sgr A* heeft een massa van ~4,1 × 10⁶ M☉, vastgesteld via de banen van sterren in de S-cluster (S2 heeft een omlooptijd van ~16 jaar). Dit bewijs leverde Andrea Ghez en Reinhard Genzel de Nobelprijs Natuurkunde 2020 op.' },
  },
  {
    id: 4, topic: 'Planetaire beweging',
    beg: { q: 'In welke vorm bewegen planeten om de zon?', options: ['Cirkels', 'Ellipsen', 'Spiralen', 'Parabolen'], correct: 1, explain: 'Planeten bewegen in elliptische banen met de zon in één van de twee brandpunten — dit is de eerste wet van Kepler (1609). Een cirkel is een speciaal geval van een ellips (excentriciteit = 0), maar echte planetaire banen zijn licht ovaalvormig.' },
    ama: { q: 'Wat stelt de derde wet van Kepler?', options: ['Planeten bewegen in ellipsen', 'Gelijke oppervlakken in gelijke tijden', 'T² ∝ a³ (omlooptijd² ∝ halve grootas³)', 'Alle planeten bewegen even snel'], correct: 2, explain: 'Keplers derde wet: T² ∝ a³. Mars staat op 1,52 AU, dus T_Mars² = 1,52³ ≈ 3,51, T_Mars ≈ 1,87 jaar ≈ 687 dagen. Newton bewees deze relatie later met zijn gravitatiewet F = GMm/r².' },
    pro: { q: 'Welk relativistisch effect verklaart de extra precessie van Mercurius\' perihelion (43 arcsec/eeuw)?', options: ['Speciale relativiteitstheorie (tijddilatatie)', 'Algemene relativiteitstheorie (ruimtetijdkromming)', 'Kwantumgravitatie', 'Poynting-Robertson-effect'], correct: 1, explain: 'De 43 arcsec/eeuw extra precessie van Mercurius (boven de Newtoniaans berekende 532 arcsec/eeuw) werd pas verklaard door Einsteins ART (1915) via de Schwarzschild-metriek. Dit was één van de eerste experimentele bevestigingen van de ART.' },
  },
  {
    id: 5, topic: 'HR-diagram',
    beg: { q: 'Wat laat een HR-diagram zien?', options: ['De afstanden van sterren tot de aarde', 'Het verband tussen stertemperatuur en lichtkracht', 'De rotatiesnelheid van sterrenstelsels', 'De ouderdom van planeten'], correct: 1, explain: 'Het Hertzsprung-Russell-diagram (1911/1913) toont sterren op basis van hun oppervlaktetemperatuur (x-as, van heet naar koel) en lichtkracht (y-as). De meeste sterren liggen op een diagonale band — de "hoofdreeks" — waarbinnen ook de zon staat.' },
    ama: { q: 'In welk gebied van het HR-diagram bevindt de zon zich?', options: ['Reuzentak', 'Witte-dwerg-sequentie', 'Hoofdreeks (spectrale klasse G)', 'Instabiliteitsstrook'], correct: 2, explain: 'De zon is een G2V-ster: spectrale klasse G (T ≈ 5.778 K), op de hoofdreeks (V = luminositeitsklasse). Ze heeft een absolute magnitude van +4,83. Over ~5 miljard jaar verlaat ze de hoofdreeks en wordt ze een rode reus.' },
    pro: { q: 'Wat bepaalt de positie van een ster op de Zero Age Main Sequence (ZAMS)?', options: ['Leeftijd en metalliciteit', 'Uitsluitend de initiële massa', 'Rotatiesnelheid en magnetisch veld', 'Afstand tot het galactisch centrum'], correct: 1, explain: 'De positie op de ZAMS wordt primair bepaald door de initiële massa (hoofdsequentie-massa-lichtsterktecorrelatie L ∝ M³·⁵ voor mid-range sterren). Metalliciteit en rotatie hebben een secondaire invloed maar de massa domineert de structuur volledig via de hydrostatisch evenwichtsvergelijking.' },
  },
  {
    id: 6, topic: 'Donkere materie',
    beg: { q: 'Wat is het sterkste indirecte bewijs voor donkere materie?', options: ['Sterren bewegen te snel aan de rand van sterrenstelsels', 'We zien zwarte gaten bewegen', 'Kometen draaien anders dan verwacht', 'De zon heeft een ongewone baan'], correct: 0, explain: 'De buitenste sterren van spiraalgalaxieën bewegen bijna even snel als de binnenste — terwijl ze, als alleen zichtbare materie de zwaartekracht leverde, veel langzamer zouden moeten zijn (zoals de buitenste planeten in ons zonnestelsel). Dit duidt op een grote hoeveelheid onzichtbare massa: donkere materie.' },
    ama: { q: 'Wat observeerde Vera Rubin in de jaren 70 als bewijs voor donkere materie?', options: ['Dat sterrenstelsels uitdijen', 'Vlakke rotatiesnelheidscurven van spiraalgalaxieën', 'Gravitationele lensing rond galaxiehopen', 'Röntgenstraling van galactische kernen'], correct: 1, explain: 'Rubin mat dat de rotatiesnelheid v(r) buiten de optische schijf van spiraalgalaxieën constant blijft in plaats van te dalen als v ∝ 1/√r. Dit vereist een onzichtbare massa-halo: M(r) ∝ r. Haar werk maakte donkere materie tot mainstream wetenschap.' },
    pro: { q: 'Welke observatie van de Bullet Cluster (1E 0657-558) weerlegt MOND-alternatieven voor donkere materie?', options: ['De röntgenemissie valt samen met de zwaarste gravitationele massa', 'De zwaartekrachtscentra (via lensing) zijn ruimtelijk gescheiden van het röntgengas', 'De roodverschuiving toont een botsingssnelheid van 10.000 km/s', 'De stervormingssnelheid is abnormaal hoog'], correct: 1, explain: 'Na de botsing van twee clusters is het heet röntgengas (baryonen, zichtbaar via Chandra) vertraagd door drukkrachten, terwijl de gravitationele massa (gemeten via zwakke lensing) ongehinderd doorsnelde. Die ruimtelijke scheiding kan alleen verklaard worden met niet-interacterende donkere materie — MOND kan dit niet reproduceren.' },
  },
  {
    id: 7, topic: 'Kosmische achtergrondstraling',
    beg: { q: 'Wat is de kosmische achtergrondstraling (CMB)?', options: ['Röntgenstraling van zwarte gaten', 'Restlicht van de oerknal, nu zichtbaar als microgolven', 'Licht van de verste sterrenstelsels', 'Straling van de zon buiten de atmosfeer'], correct: 1, explain: 'De CMB is het "nagloeden" van de oerknal. Zo\'n 380.000 jaar na de oerknal koelde het heelal genoeg af om waterstof te vormen — het licht dat daarna vrijkwam reist nog steeds door het heelal. Door de uitdijing is het roodverschoven tot microgolffrequenties met T = 2,7 K.' },
    ama: { q: 'Op welke temperatuur bevindt de CMB zich nu?', options: ['0 K (absolute nulpunt)', '2,725 K', '15 K', '1.000 K'], correct: 1, explain: 'De CMB heeft nu een temperatuur van 2,7255 K — bijna het absolute nulpunt. Oorspronkelijk, bij het "last scattering surface" (z ≈ 1100), was de temperatuur ~3.000 K. De uitdijing van het heelal heeft het licht met een factor 1100 roodverschoven.' },
    pro: { q: 'Hoelang na de oerknal werd de CMB uitgezonden (recombinatie-tijdperk)?', options: ['~3 minuten', '~380.000 jaar', '~1 miljoen jaar', '~380 miljoen jaar'], correct: 1, explain: 'Bij z ≈ 1100, ~380.000 jaar na de oerknal, daalde de temperatuur tot ~3.000 K: protonen en elektronen recombineerden tot neutraal waterstof. Het heelal werd transparant en fotonen konden vrij bewegen — de CMB is dat "last scattering surface", gefotografeerd door COBE, WMAP en Planck.' },
  },
  {
    id: 8, topic: 'Ruimtevaart',
    beg: { q: 'Wat is de ontsnappingssnelheid van de Aarde?', options: ['7,9 km/s', '11,2 km/s', '29,8 km/s', '300.000 km/s'], correct: 1, explain: 'Om de Aarde te verlaten zonder verdere aandrijving moet een object minimaal 11,2 km/s bereiken — de ontsnappingssnelheid. Ter vergelijking: een kogel gaat ~1 km/s. Raketten halen dit in meerdere trap-brandingen om de benodigde brandstofmassa te beperken.' },
    ama: { q: 'Wat beschrijft Tsiolkovsky\'s raketformule Δv = ve · ln(m₀/mf)?', options: ['De maximale hoogte van een raket', 'De snelheidswinst als functie van uitstootsnelheid en massaverhouding', 'De benodigde baankracht voor LEO', 'De Hohmann-transfersnelheid'], correct: 1, explain: 'De raketformule geeft de ideale snelheidsverandering Δv die een raket kan bereiken: ve is de uitlaatsnelheid van gassen, m₀ de beginmassa (inclusief brandstof) en mf de eindmassa. Het logaritmische verband betekent dat meer brandstof steeds minder oplevert — vandaar meerdere trappen.' },
    pro: { q: 'Wat is het voordeel van een gravitational assist (slingshot) boven een directe burn?', options: ['Meer Δv per kg brandstof omdat planetaire baanenergie wordt benut', 'De raketmotor kan langer branden', 'Het vermindert de reis-tijd altijd significant', 'Het verhoogt de Isp van het voortstuwingssysteem'], correct: 0, explain: 'Bij een gravitational assist wint de sonde impuls uit de baanenergie van de planeet (in het heliocentrisch stelsel). In het planetaire referentiestelsel is |v∞| behouden, maar de richting verandert — wat zich vertaalt naar een snelheidswinst in het heliocentrisch stelsel zonder brandstofverbruik.' },
  },
  {
    id: 9, topic: 'Bewoonbare zone',
    beg: { q: 'Wat bepaalt de "bewoonbare zone" rond een ster?', options: ['Het gebied waar de ster zichtbaar is', 'Het gebied waar vloeibaar water op een planeetoppervlak mogelijk is', 'Het gebied zonder meteorieten', 'De afstand waar zuurstof aanwezig is'], correct: 1, explain: 'De bewoonbare zone (habitable zone) is het gebied rond een ster waar de temperatuur op een planeetoppervlak vloeibaar water kan laten bestaan — een voorwaarde voor leven zoals wij dat kennen. Niet te heet (water verdampt) en niet te koud (water bevriest): de "Goudlokje-zone".' },
    ama: { q: 'Waarom heet de bewoonbare zone ook wel de "Goudlokje-zone"?', options: ['Naar astronoom Goudlokje (1892)', 'Naar het sprookje: niet te heet, niet te koud, maar precies goed', 'Omdat goud-achtige sterren de meeste bewoonbare planeten hebben', 'Omdat de zone de kleur goud heeft in diagrammen'], correct: 1, explain: 'Net als Goudlokje die pap zocht die "precies goed" was, is de bewoonbare zone het gebied dat "precies goed" is voor vloeibaar water: niet te dicht bij de ster (te heet) en niet te ver (te koud). De term werd populair gemaakt door James Kasting (1993).' },
    pro: { q: 'Welke parameter bepaalt primair de equilibriumtemperatuur T_eq van een exoplaneet?', options: ['T_eq ∝ (L_ster / a²)^(1/4) waarbij a de baanhalve-as is', 'T_eq = T_ster × (R_ster/2a)^(1/2) gecorrigeerd voor albedo', 'T_eq is gelijk aan de oppervlaktetemperatuur van de ster', 'T_eq hangt alleen af van de planeetmassa'], correct: 1, explain: 'T_eq = T_ster × (R_ster/2a)^(1/2) × (1 − A_Bond)^(1/4), waarbij A_Bond het reflectievermogen is. Dit geeft de temperatuur zonder broeikasgaseffect. Venus heeft A ≈ 0,77 (hoge albedo) maar is toch heter dan verwacht door CO₂ — bewijs van een sterk broeikaseffect.' },
  },
  {
    id: 10, topic: 'Kernfusie',
    beg: { q: 'Wat produceert de zon via kernfusie?', options: ['Waterstof uit helium', 'Helium uit waterstof, plus enorme energie', 'Zuurstof en stikstof', 'Zwaar water'], correct: 1, explain: 'In de zonkern smelten 4 waterstofatomen samen tot 1 heliumatoom. Het massaverschil (Δm ≈ 0,7% van de waterstofmassa) wordt omgezet in energie via E = mc². Elke seconde zet de zon 600 miljoen ton waterstof om — en heeft daar al 4,6 miljard jaar brandstof voor gehad.' },
    ama: { q: 'Via welke reactieketen fuseert de zon voornamelijk?', options: ['CNO-cyclus', 'Triple-alpha-reactie', 'Proton-protonketen (pp-I)', 'r-proces'], correct: 2, explain: 'De zon gebruikt voornamelijk de pp-I keten (proton-proton): 4¹H → ⁴He + 2e⁺ + 2νe + 26,7 MeV. De CNO-cyclus domineert pas in sterren zwaarder dan ~1,3 M☉ vanwege de sterkere temperatuurafhankelijkheid (T²⁰ vs T⁴ voor pp).' },
    pro: { q: 'Het zonnige neutrino-probleem was: welke oplossing werd bevestigd door SNO (2002)?', options: ['De zon fuseert minder dan modellen voorspellen', 'Elektroneutrino\'s oscilleren naar mu- en tauneutrino\'s en worden gemist door detectors', 'Het Standaard Model onderschat de neutrino-massa', 'Neutrino\'s bewegen sneller dan licht in de zonkern'], correct: 1, explain: 'Het SNO-experiment toonde aan dat het totale neutrino-flux (alle smaken) overeenkomt met het Standaard Zonnemodel, maar dat ~2/3 van de elektroneutrino\'s onderweg oscilleren naar andere smaken. Dit bewijst dat neutrino\'s massa hebben — een doorbraak buiten het Standaard Deeltjesmodel. Takaaki Kajita en Arthur McDonald kregen hiervoor de Nobelprijs 2015.' },
  },
  {
    id: 11, topic: 'Donkere energie',
    beg: { q: 'Wat doet donkere energie met het heelal?', options: ['Het vertraagt de uitdijing', 'Het versnelt de uitdijing van het heelal', 'Het trekt sterrenstelsels samen', 'Het heeft geen effect op grote schaal'], correct: 1, explain: 'Donkere energie — ontdekt in 1998 via Type Ia supernovae — versnelt de uitdijing van het heelal. In plaats van te vertragen door zwaartekracht, dijt het heelal steeds sneller uit. Donkere energie maakt ~68% van de totale energie-inhoud van het heelal uit.' },
    ama: { q: 'Welk percentage van de totale energie-inhoud van het heelal bestaat uit donkere energie?', options: ['~5%', '~27%', '~68%', '~95%'], correct: 2, explain: 'Volgens het ΛCDM-model bestaat het heelal uit: ~68% donkere energie (Λ), ~27% donkere materie en ~5% gewone (baryonische) materie. Alles wat we kunnen zien — sterren, planeten, gas, mensen — is die 5%. De rest is onbekend.' },
    pro: { q: 'Wat is de "equation of state" parameter w voor de kosmologische constante Λ?', options: ['w = 0', 'w = −1', 'w = +1/3', 'w = −1/3'], correct: 1, explain: 'De kosmologische constante heeft w = −1 (druk p = −ρc²), wat leidt tot constante energiedichtheid tijdens uitdijing. Als w ≠ −1 of tijdvariabel (quintessence), zou dat "dynamische donkere energie" zijn. DESI 2024 zag hints dat w licht afwijkt van −1, maar nog niet significant.' },
  },
  {
    id: 12, topic: 'Dwergplaneten',
    beg: { q: 'Waarom is Pluto in 2006 herklassificeerd als dwergplaneet?', options: ['Pluto is te klein om een planeet te zijn', 'Pluto heeft zijn baan niet vrijgemaakt van andere objecten', 'Pluto heeft geen manen', 'Pluto beweegt te langzaam'], correct: 1, explain: 'De IAU definieerde in 2006 dat een planeet: (1) de zon omcirkelt, (2) voldoende massa heeft voor een bolvorm, én (3) zijn baan heeft "vrijgemaakt" van andere objecten. Pluto voldoet aan 1 en 2 maar niet aan 3 — de Kuipergordel staat vol objecten langs zijn baan.' },
    ama: { q: 'Hoeveel erkende dwergplaneten zijn er in ons zonnestelsel?', options: ['3', '5', '12', '>200 kandidaten, 5 officieel erkend'], correct: 3, explain: 'De IAU heeft officieel 5 dwergplaneten erkend: Pluto, Eris, Makemake, Haumea en Ceres. Maar astronomen schatten dat er meer dan 200 objecten in de buitenste zones zijn die aan de definitie voldoen — ze zijn gewoon nog niet allemaal geclassificeerd.' },
    pro: { q: 'De IAU-definitie vereist "clearing the neighbourhood". Welke parameter kwantificeert dit?', options: ['Tisserand-parameter T_J', 'Planetaire discriminant μ = M/m (planeetmassa / geclearde zonale massa)', 'Hillsphere-ratio', 'Baanresonantieparameter'], correct: 1, explain: 'De planetaire discriminant μ = M_planeet / M_sone (massa planeet gedeeld door de totale massa van objecten in zijn baanom de zon) kwantificeert "clearing the neighbourhood". Aarde: μ ≈ 1,7 × 10⁶. Pluto: μ ≈ 0,077. De grens ligt bij ~100; alles eronder is een dwergplaneet.' },
  },
  {
    id: 13, topic: 'Sterrenkijken',
    beg: { q: 'Wat is de Bortle-schaal?', options: ['Een maat voor telescoopcapaciteit', 'Een schaal (1–9) voor de donkerte van de nachthemel', 'De helderheid van de maan', 'De grootte van een meteoor'], correct: 1, explain: 'De Bortle-schaal loopt van 1 (volkomen donker, Melkweg werpt schaduwen) tot 9 (stadscentrum, alleen de helderste sterren zichtbaar). Bortle 1 vind je op afgelegen eilanden of bergtoppen. Vanuit Amsterdam-centrum zit je op Bortle 8–9.' },
    ama: { q: 'Welke grootheid bepaalt of een hemellichaam met het blote oog zichtbaar is?', options: ['Absolute magnitude (M)', 'Schijnbare magnitude (m) < ~6', 'Afstand in parsec', 'Spectraalklasse'], correct: 1, explain: 'Schijnbare magnitude m beschrijft hoe helder een object er aan de hemel uitziet. Het menselijk oog ziet objecten tot m ≈ +6 onder donkere hemel (Bortle 1–2). Jupiter staat op m ≈ −2,9; Sirius op −1,46. Hoe lager (negatiever), hoe helderder.' },
    pro: { q: 'Wat is het oogscheidingsvermogen (resolutie) van een 200 mm telescoop bij λ = 550 nm?', options: ['~0,28 arcsec (Rayleigh-criterium: 1,22λ/D)', '~1 arcsec', '~5 arcsec', '~0,01 arcsec'], correct: 0, explain: 'Het Rayleigh-criterium θ = 1,22λ/D = 1,22 × 550×10⁻⁹ / 0,2 ≈ 3,35×10⁻⁶ rad ≈ 0,69 arcsec. In de praktijk beperkt "seeing" (atmosferische turbulentie) de resolutie op aarde tot ~1–3 arcsec. Alleen vanuit de ruimte of met adaptieve optiek benut je de volledige apertuur.' },
  },
  {
    id: 14, topic: 'ISS & Ruimtestations',
    beg: { q: 'Op welke hoogte vliegt het Internationaal Ruimtestation (ISS)?', options: ['~50 km', '~400 km', '~36.000 km', '~385.000 km'], correct: 1, explain: 'De ISS cirkelt op ~400 km hoogte in een Low Earth Orbit (LEO) met een snelheid van ~27.600 km/u. Op die hoogte doet het station er slechts ~92 minuten over om de Aarde te omcirkelen — dat is ruim 15 keer per dag! Je kunt het soms met het blote oog zien als een snel bewegend helder punt.' },
    ama: { q: 'Hoe lang duurt één omloop van de ISS om de Aarde?', options: ['~45 minuten', '~92 minuten', '~24 uur', '~7 dagen'], correct: 1, explain: 'Op ~400 km hoogte heeft de ISS een omlooptijd van ~92 minuten (v_c = √(GM/r) ≈ 7,66 km/s). Dit betekent dat astronomen aan boord ruim 15 zonsopgangen en -ondergangen per dag beleven. De ISS moet regelmatig worden opgestuwd omdat de resterende atmosfeer de baan langzaam afbreekt.' },
    pro: { q: 'Welke Δv is ruwweg nodig voor een Hohmann-transfer van LEO (400 km) naar GEO (35.786 km)?', options: ['~1,5 km/s totaal', '~3,9 km/s totaal (twee burns)', '~7,9 km/s (escape velocity)', '~11,2 km/s'], correct: 1, explain: 'Een Hohmann-transfer van LEO naar GEO vereist twee motorbrandingen: Δv₁ ≈ 2,46 km/s (apogee verhogen naar GEO) en Δv₂ ≈ 1,47 km/s (circulariseren in GEO), totaal ~3,93 km/s. Dit is waarom geosynchrone satellieten grote brandstoftanks nodig hebben en chemische voortstuwing gebruiken.' },
  },
]

// ── Daily quiz widget ────────────────────────────────────────────────────────
function DailyQuizWidget() {
  const [level,    setLevel]    = useState<'beg' | 'ama' | 'pro'>('beg')
  const [selected, setSelected] = useState<number | null>(null)
  const [mounted,  setMounted]  = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Restore saved answer from localStorage when level changes
  useEffect(() => {
    if (!mounted) return
    const today = new Date().toISOString().slice(0, 10)
    try {
      const raw = localStorage.getItem(`quiz_${today}`)
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, number>
        setSelected(saved[level] !== undefined ? saved[level] : null)
      } else {
        setSelected(null)
      }
    } catch { /* ignore */ }
  }, [level, mounted])

  if (!mounted) return <div style={{ minHeight: 220, border: '1px solid #252858', background: '#16173A', borderRadius: 2 }} />

  const today  = new Date().toISOString().slice(0, 10)
  const dayIdx = Math.floor(Date.UTC(
    new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()
  ) / 86_400_000) % DAILY_QUESTIONS.length
  const q = DAILY_QUESTIONS[dayIdx]

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    try {
      const raw = localStorage.getItem(`quiz_${today}`)
      const saved = raw ? JSON.parse(raw) as Record<string, number> : {}
      saved[level] = idx
      localStorage.setItem(`quiz_${today}`, JSON.stringify(saved))
    } catch { /* ignore */ }
  }

  function switchLevel(lvl: 'beg' | 'ama' | 'pro') {
    setLevel(lvl)
    setSelected(null)
    try {
      const raw = localStorage.getItem(`quiz_${today}`)
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, number>
        setSelected(saved[lvl] !== undefined ? saved[lvl] : null)
      }
    } catch { /* ignore */ }
  }

  const variant = q[level]
  const answered = selected !== null
  const correct  = answered && selected === variant.correct

  const LVLS = [
    { key: 'beg' as const, label: 'Beginner', color: '#e05040', bg: 'rgba(224,80,64,0.1)',  border: 'rgba(224,80,64,0.4)'  },
    { key: 'ama' as const, label: 'Amateur',  color: '#3ddf90', bg: 'rgba(61,223,144,0.1)', border: 'rgba(61,223,144,0.4)' },
    { key: 'pro' as const, label: 'Pro',      color: '#3dcfdf', bg: 'rgba(61,207,223,0.1)', border: 'rgba(61,207,223,0.4)' },
  ]
  const activeLvl = LVLS.find(l => l.key === level)!

  return (
    <div role="region" aria-labelledby="quiz-widget-title" style={{ border: `1px solid ${answered ? (correct ? 'rgba(61,223,144,0.35)' : 'rgba(224,80,64,0.35)') : '#252858'}`, background: '#16173A', overflow: 'hidden', borderRadius: 2, transition: 'border-color 0.4s' }}>
      {/* Header */}
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span id="quiz-widget-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true">🧠</span>
          Vraag van de dag
        </span>
        {/* Level toggle */}
        <div role="group" aria-label="Kies niveau" style={{ display: 'flex', gap: 3 }}>
          {LVLS.map(l => (
            <button key={l.key} aria-pressed={level === l.key}
              onClick={() => switchLevel(l.key)}
              style={{ padding: '3px 9px', fontFamily: 'var(--font-mono)', fontSize: '0.48rem', letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${level === l.key ? l.color : 'rgba(37,40,88,0.8)'}`, color: level === l.key ? l.color : '#4A5A8A', background: level === l.key ? l.bg : 'transparent', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s' }}
            >{l.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Topic badge */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: activeLvl.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeLvl.color, display: 'inline-block', flexShrink: 0 }} aria-hidden="true" />
          {q.topic}
        </div>

        {/* Question */}
        <p style={{ fontSize: '0.86rem', fontWeight: 500, color: '#FFFFFF', lineHeight: 1.5, marginBottom: 14, margin: '0 0 14px' }}>{variant.q}</p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {variant.options.map((opt, i) => {
            const isSelected = selected === i
            const isCorrect  = i === variant.correct
            let bg = 'transparent', border = '#252858', color = '#8A9BC4'
            if (answered) {
              if (isCorrect)              { bg = 'rgba(61,223,144,0.12)'; border = '#3ddf90'; color = '#3ddf90' }
              else if (isSelected)        { bg = 'rgba(224,80,64,0.12)'; border = '#e05040'; color = '#e05040' }
            } else if (isSelected) {
              bg = activeLvl.bg; border = activeLvl.color; color = activeLvl.color
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                aria-pressed={isSelected}
                style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 2, cursor: answered ? 'default' : 'pointer', color, fontFamily: 'var(--font-sans)', fontSize: '0.78rem', lineHeight: 1.45, transition: 'all 0.2s', display: 'flex', alignItems: 'flex-start', gap: 8 }}
                onMouseEnter={e => { if (!answered) { e.currentTarget.style.borderColor = activeLvl.color; e.currentTarget.style.color = '#FFFFFF' } }}
                onMouseLeave={e => { if (!answered) { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' } }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'inherit', flexShrink: 0, marginTop: 2 }}>{['A','B','C','D'][i]}</span>
                {opt}
                {answered && isCorrect  && <span aria-hidden="true" style={{ marginLeft: 'auto', flexShrink: 0 }}>✓</span>}
                {answered && isSelected && !isCorrect && <span aria-hidden="true" style={{ marginLeft: 'auto', flexShrink: 0 }}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {answered && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: correct ? 'rgba(61,223,144,0.07)' : 'rgba(224,80,64,0.07)', borderLeft: `2px solid ${correct ? '#3ddf90' : '#e05040'}`, animation: 'fadeIn 0.3s ease both' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: correct ? '#3ddf90' : '#e05040', marginBottom: 6 }}>
              {correct ? '✓ Correct!' : `✗ Niet helemaal — het juiste antwoord is ${['A','B','C','D'][variant.correct]}`}
            </div>
            <p style={{ fontSize: '0.76rem', color: '#B5D4F4', lineHeight: 1.7, margin: 0 }}>{variant.explain}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #252858', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#2A3060' }}>Morgen nieuwe vraag</span>
        <Link href="/educatie"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
        >
          Meer leren →
        </Link>
      </div>
    </div>
  )
}

function skDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function StargazingWidget() {
  const [score,    setScore]    = useState<number | null>(null)
  const [label,    setLabel]    = useState('Laden…')
  const [color,    setColor]    = useState('#4A5A8A')
  const [clouds,   setClouds]   = useState<number | null>(null)
  const [darkKm,   setDarkKm]   = useState<number | null>(null)
  const [darkName, setDarkName] = useState('')
  const [locName,  setLocName]  = useState('jouw locatie')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const fetch20h = async (lat: number, lon: number) => {
      try {
        const url = `${PROXY}/weather?lat=${lat}&lon=${lon}`
        const res = await fetch(url)
        const d   = await res.json()
        const idx = 20
        const cc   = d.hourly.cloud_cover[idx]
        const hum  = d.hourly.relative_humidity_2m[idx]
        const wind = d.hourly.wind_speed_10m[idx]
        const temp = d.hourly.temperature_2m[idx]

        let s = 100
        if (cc   > 80) s -= 50; else if (cc   > 60) s -= 35; else if (cc   > 40) s -= 20; else if (cc   > 20) s -= 8
        if (hum  > 90) s -= 15; else if (hum  > 80) s -= 8
        if (wind > 30) s -= 15; else if (wind > 20) s -= 8
        if (temp < -5) s -= 5
        s = Math.max(0, Math.min(100, s))

        const lbl = s >= 80 ? 'Uitstekend' : s >= 60 ? 'Goed' : s >= 40 ? 'Matig' : s >= 20 ? 'Slecht' : 'Bewolkt'
        const clr = s >= 80 ? '#3ddf90'    : s >= 60 ? '#d4a84b' : s >= 40 ? '#ff8a60' : '#e05040'

        setScore(Math.round(s / 10))
        setLabel(lbl)
        setColor(clr)
        setClouds(cc)

        const nearest = SK_DARK_SPOTS.map(sp => ({ ...sp, km: skDist(lat, lon, sp.lat, sp.lon) })).sort((a, b) => a.km - b.km)[0]
        setDarkKm(nearest.km)
        setDarkName(nearest.name)
      } catch { /* silent */ }
      setLoading(false)
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setLocName('jouw locatie'); fetch20h(pos.coords.latitude, pos.coords.longitude) },
        ()  => { setLocName('Amsterdam');    fetch20h(52.3676, 4.9041) },
        { timeout: 5000 }
      )
    } else {
      setLocName('Amsterdam')
      fetch20h(52.3676, 4.9041)
    }
  }, [])

  const topObj = SK_OBJECTS[0]
  const circumference = 2 * Math.PI * 26 // r=26

  return (
    <div role="region" aria-labelledby="sk-widget-title" style={{ border: '1px solid #252858', background: '#16173A', overflow: 'hidden', borderRadius: 2 }}>
      {/* Header */}
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span id="sk-widget-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true">🌠</span>
          Vanavond zichtbaar
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#4A5A8A' }}>{locName}</span>
      </div>

      {/* Score + highlights */}
      <div style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Score ring */}
        <div aria-label={`Sterrenkijk-score: ${score ?? '…'} van 10`} style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#252858" strokeWidth="5" />
            <circle cx="32" cy="32" r="26" fill="none"
              stroke={loading ? '#252858' : color}
              strokeWidth="5"
              strokeDasharray={`${loading ? 0 : ((score ?? 0) / 10) * circumference} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dasharray 0.9s ease, stroke 0.4s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: loading ? '#4A5A8A' : color, lineHeight: 1 }}>
              {loading ? '…' : (score ?? '?')}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.42rem', color: '#4A5A8A', letterSpacing: '0.06em' }}>/10</span>
          </div>
        </div>

        {/* Label + info rows */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: loading ? '#4A5A8A' : color, marginBottom: 6 }}>
            {loading ? 'Ophalen…' : label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#8A9BC4', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span aria-hidden="true" style={{ color: '#ffa040' }}>{topObj.icon}</span>
              {topObj.obj} zichtbaar
            </span>
            {clouds !== null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: clouds < 20 ? '#3ddf90' : clouds < 50 ? '#d4a84b' : '#8A9BC4' }}>
                ☁ {clouds}% bewolking vanavond
              </span>
            )}
            {darkKm !== null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#8A9BC4' }}>
                🌑 Dark sky {darkKm} km · {darkName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid #252858', padding: '10px 20px' }}>
        <Link href="/sterrenkijken"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.54rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
        >
          Volledig rapport
          <svg width="10" height="10" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
      </div>
    </div>
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
      <div role="img" aria-label="ISS positie op wereldkaart" style={{ height: 160, background: '#0d1425', position: 'relative', overflow: 'hidden' }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, filter: 'brightness(1.3) saturate(0.5) sepia(0.4) hue-rotate(190deg)', position: 'absolute', inset: 0 }} />
        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }}>
          {[25, 50, 75].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#3dcfdf" strokeWidth="0.5" />)}
          {[16.6, 33.3, 50, 66.6, 83.3].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#3dcfdf" strokeWidth="0.5" />)}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#3dcfdf" strokeWidth="1" opacity="0.4" />
        </svg>
        {iss && (
          <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <ellipse cx={`${px}%`} cy="50%" rx="18%" ry="28%" fill="none" stroke="#3ddf90" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
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
    </div>
  )
}

// ── Event countdown strip ───────────────────────────────────────────────────
const SPACE_EVENTS = [
  { id: 1,  date: '2026-04-09', title: 'ESA SMILE lancering',          icon: '🛰️', cat: 'Missie',  color: '#378ADD', desc: 'Solar wind Magnetosphere Ionosphere Link Explorer vertrekt vanuit Kourou.' },
  { id: 2,  date: '2026-04-22', title: 'Lyriden meteorenstroom',        icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~18/u. Donkere hemel aanbevolen, beste na middernacht.' },
  { id: 3,  date: '2026-04-28', title: 'Komeet C/2026 A1 piek',        icon: '🌠', cat: 'Komeet',  color: '#3ddf90', desc: 'Piekzichtbaarheid: mogelijk met blote oog in het westen na zonsondergang.' },
  { id: 4,  date: '2026-05-06', title: 'Eta Aquariden',                 icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~50/u. Brokstukken van komeet Halley. Beste voor dageraad.' },
  { id: 5,  date: '2026-06-20', title: 'Jupiter–Mars conjunctie',       icon: '♃', cat: 'Planeet', color: '#d4a84b', desc: 'Jupiter en Mars staan op minder dan 0,5° van elkaar — spectaculair met verrekijker.' },
  { id: 6,  date: '2026-08-12', title: 'Totale zonsverduistering',      icon: '🌑', cat: 'Eclips',  color: '#c080ff', desc: 'Totaliteitspad over Groenland, IJsland, Spanje en Rusland.' },
  { id: 7,  date: '2026-08-13', title: 'Perseïden piek',                icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~100/u. Nieuwe maan = ideale omstandigheden. BESTE KANS 2026.' },
  { id: 8,  date: '2026-09-15', title: 'Artemis II (gepland)',          icon: '🚀', cat: 'Missie',  color: '#378ADD', desc: 'Eerste bemande vlucht om de Maan, vier astronauten, 10 dagen.' },
  { id: 9,  date: '2026-11-17', title: 'Leoniden',                      icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~15/u. Halve maan, redelijke condities.' },
  { id: 10, date: '2026-12-14', title: 'Geminiden piek',                icon: '☄️', cat: 'Meteor',  color: '#ffa040', desc: 'ZHR ~150/u. Grootste meteorenstroom van het jaar. Geen maanlicht.' },
]

const CAT_COLORS: Record<string, string> = {
  Missie: '#378ADD', Meteor: '#ffa040', Komeet: '#3ddf90', Eclips: '#c080ff', Planeet: '#d4a84b',
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00Z')
  const now    = new Date(); now.setUTCHours(0,0,0,0)
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

// ── This week widget ───────────────────────────────────────────────────────
function ThisWeekWidget() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const upcoming = SPACE_EVENTS
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)

  const first = upcoming[0]?.days ?? 999
  const heading =
    first <= 7  ? 'Deze week in de sterrenkunde' :
    first <= 31 ? 'Deze maand in de sterrenkunde' :
                  'Binnenkort in de sterrenkunde'

  if (!upcoming.length) return null

  return (
    <div role="region" aria-labelledby="thisweek-title" style={{ border: '1px solid #252858', background: '#16173A', overflow: 'hidden', borderRadius: 2 }}>
      {/* Header */}
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true">🗓️</span>
        <span id="thisweek-title" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A9BC4' }}>
          {mounted ? heading : 'Binnenkort in de sterrenkunde'}
        </span>
      </div>

      {/* Event rows */}
      {upcoming.map((ev, i) => {
        const clr    = CAT_COLORS[ev.cat] ?? '#8A9BC4'
        const urgent = ev.days <= 7
        const dayBadge =
          ev.days === 0 ? 'VANDAAG' :
          ev.days === 1 ? 'MORGEN'  :
          `${ev.days}d`
        const badgeColor = urgent ? '#e05040' : clr
        const badgeBg    = urgent ? 'rgba(224,80,64,0.10)' : `${clr}14`

        return (
          <div key={ev.id} style={{ padding: '13px 20px', borderBottom: i < upcoming.length - 1 ? '1px solid #1e1f42' : 'none', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,40,88,0.35)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              {/* Icon */}
              <span style={{ fontSize: '1.15rem', lineHeight: 1, flexShrink: 0, marginTop: 1 }} aria-hidden="true">{ev.icon}</span>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title + badge */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2 }}>{ev.title}</span>
                  {mounted && (
                    <span style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.44rem', letterSpacing: '0.08em', color: badgeColor, background: badgeBg, border: `1px solid ${badgeColor}30`, padding: '2px 6px', borderRadius: 2, whiteSpace: 'nowrap' }}>
                      {dayBadge}
                    </span>
                  )}
                </div>

                {/* Category + date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: clr, flexShrink: 0, display: 'block' }} aria-hidden="true" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: clr }}>{ev.cat}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem', color: '#4A5A8A' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem', color: '#4A5A8A' }}>
                    {new Date(ev.date + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.72rem', color: '#6A7BAA', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.desc}</p>
              </div>
            </div>
          </div>
        )
      })}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #252858', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#2A3060' }}>Lanceringen & verschijnselen</span>
        <Link href="/missies"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
        >
          Alle evenementen →
        </Link>
      </div>
    </div>
  )
}

function EventCountdownStrip() {
  const [now, setNow] = useState(0)
  useEffect(() => { setNow(Date.now()) }, [])

  const upcoming = SPACE_EVENTS
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(e => e.days >= 0)
    .sort((a, b) => a.days - b.days)

  if (!upcoming.length) return null

  return (
    <section aria-label="Aankomende ruimte-evenementen" style={{ background: '#0F1028', borderBottom: '1px solid #252858', borderTop: '1px solid #252858', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '0 var(--sp-10)', display: 'flex', alignItems: 'stretch', gap: 0 }}>

        {/* Left label — sticky */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20, borderRight: '1px solid #252858', paddingTop: 14, paddingBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4A5A8A', whiteSpace: 'nowrap' }}>
            🗓️ Aankomend
          </span>
        </div>

        {/* Scrollable cards */}
        <div
          role="list"
          style={{ display: 'flex', gap: 0, overflowX: 'auto', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={(el: any) => { if (el) el.style.setProperty('--webkit-overflow-scrolling', 'touch') }}
        >
          <style>{`.ev-scroll::-webkit-scrollbar{display:none}`}</style>
          {upcoming.map((ev, i) => {
            const clr   = CAT_COLORS[ev.cat] ?? '#8A9BC4'
            const urgent = ev.days <= 7
            const soon   = ev.days <= 30
            const dayClr = urgent ? '#e05040' : soon ? '#d4a84b' : clr

            return (
              <div
                key={ev.id}
                role="listitem"
                title={ev.desc}
                style={{ flexShrink: 0, minWidth: 152, borderRight: '1px solid #252858', padding: '12px 18px', cursor: 'default', transition: 'background 0.2s', position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,40,88,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Category dot + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: clr, flexShrink: 0, display: 'block' }} aria-hidden="true" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.46rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: clr }}>{ev.cat}</span>
                  {urgent && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: '#e05040', marginLeft: 4 }}>SNEL!</span>}
                </div>

                {/* Event name */}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25, marginBottom: 8 }}>
                  {ev.icon} {ev.title}
                </div>

                {/* Countdown + date */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  {now > 0 && (
                    <>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: dayClr, lineHeight: 1 }}>
                        {ev.days === 0 ? 'Vandaag' : ev.days}
                      </span>
                      {ev.days > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#4A5A8A', letterSpacing: '0.06em' }}>
                          {ev.days === 1 ? 'dag' : 'dagen'}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.46rem', color: '#4A5A8A', marginTop: 2 }}>
                  {new Date(ev.date + 'T00:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {/* Bottom accent on hover via border-left */}
                <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: clr, opacity: 0, transition: 'opacity 0.2s' }}
                  ref={(el) => {
                    if (!el) return
                    const parent = el.parentElement
                    if (!parent) return
                    parent.addEventListener('mouseenter', () => { el.style.opacity = '1' })
                    parent.addEventListener('mouseleave', () => { el.style.opacity = '0' })
                  }}
                />
              </div>
            )
          })}

          {/* Missies link */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '12px 20px' }}>
            <Link href="/missies"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
            >
              Alle missies
              <svg width="10" height="10" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────
function SiteFooter() {
  const cols = [
    { title: 'Onderwerpen', links: [['James Webb', '/nieuws'], ['Mars Exploratie', '/nieuws'], ['Zwarte Gaten', '/nieuws'], ['Sterrenkijken', '/sterrenkijken'], ['Exoplaneten', '/nieuws']] },
    { title: 'Tools',       links: [['ISS Tracker', '/'], ['Sterrenkaart', '/sterrenkijken'], ['Lanceringskalender', '/missies']] },
    { title: 'Over ons',    links: [['Redactie', '/over'], ['Contact', '/contact'], ['Privacy', '/privacy']] },
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
  const nasaFetchedRef = useRef<Set<string>>(new Set())

  // Reset pagination when filter changes
  const handleFilter = useCallback((topic: string) => {
    setActiveFilter(topic)
    setVisibleCount(PAGE_SIZE)
  }, [])

  // Read ?topic query param on mount
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('topic')
    if (param) {
      const match = TOPICS.find(t => t.toLowerCase() === param.toLowerCase())
      if (match) setActiveFilter(match)
    }
  }, [])

  // Load articles from articles-index.json
  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => { if (Array.isArray(data) && data.length > 0) setArticles(data) })
      .catch(() => {})
  }, [])

  // Fetch unique, article-specific NASA images for cards without imageUrl.
  useEffect(() => {
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
      'starliner','dragon','orion','sls','iss','juice','clipper',
      'saturn','jupiter','venus','mercury','neptune','uranus','pluto',
      'mars','moon','lunar','comet','asteroid','nebula','galaxy','aurora',
      'rocket','launch','orbit','astronaut','satellite','telescope','solar',
    ]
    const NL_EN: Record<string, string> = {
      'lancering':'launch','lanceert':'launch','gelanceerd':'launch',
      'raket':'rocket','satelliet':'satellite','ruimtestation':'space station',
      'maan':'moon','maansverduistering':'lunar eclipse',
      'zon':'sun','zonsverduistering':'solar eclipse',
      'sterrenstelsel':'galaxy','melkweg':'milky way',
      'komeet':'comet','meteorenregen':'meteor shower',
      'astronaut':'astronaut','telescoop':'telescope',
      'nevel':'nebula','planeet':'planet','missie':'mission',
      'booster':'booster','oppervlak':'surface','heelal':'cosmos',
    }
    const buildQ = (title: string, category: string): string => {
      const lower = title.toLowerCase()
      const nouns = SPACE_NOUNS.filter(n => lower.includes(n))
      if (nouns.length >= 1) return nouns.slice(0, 3).join(' ')
      const words = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/)
      const translated = [...new Set(words.map(w => NL_EN[w]).filter(Boolean) as string[])].slice(0, 3)
      if (translated.length >= 1) return translated.join(' ')
      return CAT_QUERIES[(category || '').toLowerCase()] || 'space astronomy cosmos'
    }

    const toFetch = articles
      .filter(a => !a.imageUrl && !nasaFetchedRef.current.has(a.slug))
      .slice(0, 20)
    if (!toFetch.length) return
    toFetch.forEach(a => nasaFetchedRef.current.add(a.slug))

    toFetch.forEach(async (a, idx) => {
      await new Promise(r => setTimeout(r, idx * 150))

      const hash = a.slug.split('').reduce((acc: number, c: string) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0)
      const page = (hash % 8) + 1
      const q    = buildQ(a.title, a.category)

      for (const pg of [page, ((page % 8) + 1)]) {
        try {
          const res = await fetch(
            `${PROXY}/image-search?q=${encodeURIComponent(q)}&page=${pg}&hash=${hash}`
          )
          if (!res.ok) continue
          const data = await res.json()
          if (!data?.url) continue
          setArticles(prev => prev.map(p => p.slug === a.slug ? { ...p, imageUrl: data.url } : p))
          return
        } catch {}
      }
    })
  }, [articles])

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
      <EventCountdownStrip />

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

        <MissiesStrip />

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
            <StargazingWidget />
            <ThisWeekWidget />
            <DailyQuizWidget />
            <ISSWidget iss={iss} />
            <APODWidget apod={apod} />
            <AIPromoWidget />
          </aside>
        </div>

      </main>

      <SiteFooter />
    </>
  )
}
