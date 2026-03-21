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

// ── Fallback articles (shown while articles-index.json loads) ──────────────
const FALLBACK_ARTICLES: Article[] = [
  {
    slug:     'james-webb-k2-18b-biosignatuur',
    title:    'James Webb vindt mogelijke sporen van leven op K2-18b',
    excerpt:  'De JWST heeft dimethylsulfide gedetecteerd in de atmosfeer van K2-18b — een molecuul dat op Aarde uitsluitend door levende organismen wordt gemaakt.',
    category: 'James Webb',
    catColor: '#7aadff',
    bgColor:  'linear-gradient(135deg,#0a1030,#1a2860)',
    author:   'Dr. Mara Visser',
    date:     '11 mrt 2026',
    readTime: 6,
    featured: true,
  },
  {
    slug:     'desi-donkere-energie',
    title:    'DESI: donkere energie verzwakt al 4,5 miljard jaar',
    excerpt:  'De grootste 3D kaart van het heelal toont dat de kracht van donkere energie niet constant is — een potentiële revolutie in de kosmologie.',
    category: 'Kosmologie',
    catColor: '#c080ff',
    bgColor:  'linear-gradient(135deg,#0f0520,#1a0a35)',
    author:   'Redactie',
    date:     '9 mrt 2026',
    readTime: 5,
    featured: false,
  },
  {
    slug:     'starship-mechazilla',
    title:    'Starship IFT-7: booster gevangen door Mechazilla',
    excerpt:  'SpaceX\' mechanische arm ving opnieuw de Super Heavy booster op — een mijlpaal voor volledig herbruikbare ruimtevaart.',
    category: 'Missies',
    catColor: '#3dcfdf',
    bgColor:  'linear-gradient(135deg,#051a20,#0a3040)',
    author:   'Redactie',
    date:     '7 mrt 2026',
    readTime: 4,
    featured: false,
  },
  {
    slug:     'perseverance-mars',
    title:    'Perseverance vindt \'luipaardvlekken\' in Jezero krater',
    excerpt:  'Vreemde geologische patronen op Mars verbazen wetenschappers wereldwijd.',
    category: 'Mars',
    catColor: '#ff8a60',
    bgColor:  'linear-gradient(135deg,#1a0a05,#3a1510)',
    author:   'Redactie',
    date:     '5 mrt 2026',
    readTime: 3,
    featured: false,
  },
  {
    slug:     'komeet-c2026-a1',
    title:    'Komeet C/2026 A1 mogelijk zichtbaar met blote oog',
    excerpt:  'Astronomen zijn enthousiast over een heldere komeet die in april zichtbaar wordt.',
    category: 'Sterrenkijken',
    catColor: '#d4a84b',
    bgColor:  'linear-gradient(135deg,#1a1505,#2a2010)',
    author:   'Redactie',
    date:     '3 mrt 2026',
    readTime: 3,
    featured: false,
  },
  {
    slug:     'neutronenster-uitgelegd',
    title:    'Wat is een neutronenster? Uitleg in 3 niveaus',
    excerpt:  'Van makkelijk naar technisch — ons AI-systeem legt het uit op jouw niveau.',
    category: 'Educatie',
    catColor: '#3ddf90',
    bgColor:  'linear-gradient(135deg,#051a10,#0a2a1a)',
    author:   'Redactie',
    date:     '1 mrt 2026',
    readTime: 5,
    featured: false,
  },
]

// ── Reading level per category ─────────────────────────────────────────────
function getLevel(category: string): 'beg' | 'ama' | 'pro' {
  const c = category.toLowerCase()
  if (c.includes('educatie') || c.includes('sterrenkijken')) return 'beg'
  if (c.includes('kosmologie') || c.includes('theoret'))    return 'pro'
  return 'ama'
}
const LEVEL_LABEL = { beg: 'Beginner', ama: 'Amateur', pro: 'Pro' }
const LEVEL_COLOR = {
  beg: { bg: 'rgba(224,80,64,0.1)',  color: '#e05040', border: '#e05040' },
  ama: { bg: 'rgba(61,223,144,0.1)', color: '#3ddf90', border: '#3ddf90' },
  pro: { bg: 'rgba(61,207,223,0.1)', color: '#3dcfdf', border: '#3dcfdf' },
}

// ── SVG category icons (replaces emojis) ──────────────────────────────────
function CategoryIcon({ category, color, size = 40 }: { category: string; color: string; size?: number }) {
  const c = category.toLowerCase()
  const s = size
  const common = { width: s, height: s, viewBox: '0 0 40 40', fill: 'none', 'aria-hidden': true } as const

  if (c.includes('james') || c.includes('webb') || c.includes('jwst')) return (
    <svg {...common}>
      <circle cx="20" cy="20" r="8" stroke={color} strokeWidth="1.5" opacity="0.7" />
      <path d="M20 4v4M20 32v4M4 20h4M32 20h4M8.3 8.3l2.8 2.8M28.9 28.9l2.8 2.8M8.3 31.7l2.8-2.8M28.9 11.1l2.8-2.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="20" cy="20" r="3" fill={color} opacity="0.8" />
    </svg>
  )
  if (c.includes('kosmologie') || c.includes('cosmology')) return (
    <svg {...common}>
      <ellipse cx="20" cy="20" rx="16" ry="7" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="20" cy="20" rx="16" ry="7" stroke={color} strokeWidth="1.5" opacity="0.4" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="16" ry="7" stroke={color} strokeWidth="1.5" opacity="0.4" transform="rotate(120 20 20)" />
      <circle cx="20" cy="20" r="3" fill={color} opacity="0.9" />
    </svg>
  )
  if (c.includes('missie') || c.includes('launch') || c.includes('spacex') || c.includes('raket')) return (
    <svg {...common}>
      <path d="M20 6L24 20H20V34L16 20H20V6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
      <path d="M14 16s-4 2-4 8M26 16s4 2 4 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="20" cy="32" r="2" fill={color} opacity="0.5" />
    </svg>
  )
  if (c.includes('mars')) return (
    <svg {...common}>
      <circle cx="20" cy="20" r="13" stroke={color} strokeWidth="1.5" opacity="0.7" />
      <path d="M10 16c3-2 7-1 10 2s7 3 10 0" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="15" cy="18" r="2.5" stroke={color} strokeWidth="1" opacity="0.5" />
      <circle cx="25" cy="23" r="1.5" stroke={color} strokeWidth="1" opacity="0.4" />
    </svg>
  )
  if (c.includes('sterren') || c.includes('observ') || c.includes('komeet')) return (
    <svg {...common}>
      <path d="M20 6l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
      <circle cx="10" cy="28" r="2" fill={color} opacity="0.4" />
      <circle cx="30" cy="30" r="1.5" fill={color} opacity="0.3" />
      <circle cx="8" cy="16" r="1" fill={color} opacity="0.5" />
    </svg>
  )
  if (c.includes('educatie') || c.includes('uitleg')) return (
    <svg {...common}>
      <path d="M20 8L34 16l-14 8L6 16 20 8z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
      <path d="M10 19v8c0 2 4 5 10 5s10-3 10-5v-8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M34 16v8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
  // Default: generic space/star
  return (
    <svg {...common}>
      <circle cx="20" cy="20" r="12" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="20" cy="20" r="4" fill={color} opacity="0.8" />
      <path d="M20 4v4M20 32v4M4 20h4M32 20h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
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
      x: Math.random(),
      y: Math.random(),
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

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <canvas
      id="cosmosnl-starfield"
      suppressHydrationWarning
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

// ── Topbar ─────────────────────────────────────────────────────────────────
function Topbar() {
  const [date, setDate] = useState('')
  useEffect(() => {
    setDate(new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [])

  return (
    <div
      role="banner"
      style={{
        position: 'relative', zIndex: 30, height: 'var(--topbar-h)',
        background: 'rgba(7,8,13,0.97)', borderBottom: '1px solid #1c2035',
        display: 'flex', alignItems: 'center', gap: 20,
        backdropFilter: 'blur(12px)',
      }}
      className="topbar-pad"
    >
      {/* Date */}
      <span
        suppressHydrationWarning
        className="topbar-date"
        style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', color: '#4a5278', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}
      >{date}</span>

      {/* Ticker */}
      <div
        aria-hidden="true"
        style={{ flex: 1, overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' }}
      >
        <div className="ticker-scroll" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 48, fontFamily: 'var(--font-dm-mono)', fontSize: '0.57rem', color: '#4a5278', letterSpacing: '0.06em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3dcfdf', flexShrink: 0, display: 'inline-block' }} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Language */}
      <nav role="navigation" aria-label="Taal selectie" style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-dm-mono)', fontSize: '0.58rem', flexShrink: 0 }}>
        <Link href="/" style={{ color: '#dde2f0' }} aria-current="true">NL</Link>
        <Link href="/en" style={{ color: '#4a5278' }}>EN</Link>
      </nav>
    </div>
  )
}

// ── Navigation ─────────────────────────────────────────────────────────────
function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const close = useCallback(() => setMobileOpen(false), [])

  // Close on Escape
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
      <nav
        aria-label="Hoofdnavigatie"
        style={{
          position: 'sticky', top: 0, zIndex: 20, height: 'var(--nav-h)',
          background: 'rgba(7,8,13,0.96)', borderBottom: '1px solid #1c2035',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          className="nav-pad"
          style={{ maxWidth: 'var(--max-w)', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 40 }}
        >
          {/* Logo */}
          <Link
            href="/"
            aria-label="CosmosNL — naar de startpagina"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.9rem', fontWeight: 700, color: '#f4f6ff', flexShrink: 0, letterSpacing: '-0.01em', textDecoration: 'none' }}
          >
            Cosmos<em style={{ fontStyle: 'italic', color: '#d4a84b' }}>NL</em>
          </Link>

          {/* Desktop links */}
          <ul className="nav-links" role="list" style={{ gap: 32, flex: 1, justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278', textDecoration: 'none', transition: 'color 0.15s', padding: '8px 0' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#dde2f0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a5278')}
                >{label}</Link>
              </li>
            ))}
            <li>
              <Link
                href="/tools/herschrijver"
                style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4a84b', textDecoration: 'none' }}
              >AI Tools</Link>
            </li>
          </ul>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Link
              href="/nieuwsbrief"
              className="btn-clip-sm"
              style={{ background: '#d4a84b', color: '#07080d', fontFamily: 'var(--font-dm-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '9px 20px', textDecoration: 'none', display: 'inline-block', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e8be60')}
              onMouseLeave={e => (e.currentTarget.style.background = '#d4a84b')}
            >Nieuwsbrief</Link>

            {/* Hamburger */}
            <button
              className="nav-hamburger"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'}
              onClick={() => setMobileOpen(o => !o)}
              style={{ flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  display: 'block', width: 22, height: 2, background: '#7a86a8', borderRadius: 1,
                  transition: 'transform 0.25s, opacity 0.25s',
                  transform: mobileOpen
                    ? i === 0 ? 'rotate(45deg) translate(5px,5px)'
                    : i === 1 ? 'none'
                    : 'rotate(-45deg) translate(5px,-5px)'
                    : 'none',
                  opacity: mobileOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          role="navigation"
          aria-label="Mobiele navigatie"
          style={{
            position: 'fixed',
            top: 'calc(var(--topbar-h) + var(--nav-h))',
            left: 0, right: 0,
            background: 'rgba(7,8,13,0.98)',
            borderBottom: '1px solid #1c2035',
            backdropFilter: 'blur(20px)',
            padding: '24px',
            zIndex: 19,
            display: 'flex', flexDirection: 'column', gap: 4,
            animation: 'fadeIn 0.2s ease both',
          }}
        >
          {[...navLinks, { href: '/tools/herschrijver', label: 'AI Tools' }, { href: '/nieuwsbrief', label: 'Nieuwsbrief' }].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              style={{ display: 'block', padding: '12px 0', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a86a8', borderBottom: '1px solid #1c2035', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#dde2f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7a86a8')}
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
    <section
      aria-labelledby="hero-title"
      style={{ position: 'relative', zIndex: 1, minHeight: '88vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}
    >
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: '#0c0e18' }}>
        {apod?.media_type === 'image' && (
          <img
            src={`https://images.weserv.nl/?url=${encodeURIComponent(apod.hdurl || apod.url)}`}
            alt={apod.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, filter: 'brightness(0.85) saturate(1.15)' }}
          />
        )}
        {!apod && (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0c0e18 0%,#111a2a 50%,#0a1020 100%)' }} />
        )}
      </div>

      {/* Overlay */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,8,13,1) 0%, rgba(7,8,13,0.75) 35%, rgba(7,8,13,0.1) 75%, transparent 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(7,8,13,0.55) 0%, transparent 60%)' }} />

      {/* Content */}
      <div
        className="hero-content-pad animate-fadeUp"
        style={{ position: 'relative', zIndex: 2, maxWidth: 860 }}
      >
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div aria-hidden="true" style={{ width: 32, height: 1, background: '#d4a84b' }} />
          <span
            role="status"
            aria-live="polite"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(224,80,64,0.15)', border: '1px solid rgba(224,80,64,0.4)', color: '#ff7060', fontFamily: 'var(--font-dm-mono)', fontSize: '0.52rem', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 2 }}
          >
            <span className="animate-pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#e05040', flexShrink: 0 }} aria-hidden="true" />
            NASA APOD
          </span>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', color: '#d4a84b', textTransform: 'uppercase' }}>Foto van de dag</span>
        </div>

        <h1
          id="hero-title"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(2.4rem,5.5vw,4.4rem)', fontWeight: 700, lineHeight: 1.06, color: '#f4f6ff', marginBottom: 20, letterSpacing: '-0.01em' }}
        >
          {apod?.title || 'Elke dag een nieuw venster op het heelal'}
        </h1>

        <p style={{ fontSize: '1rem', color: '#7a86a8', lineHeight: 1.75, maxWidth: 520, marginBottom: 32 }}>
          {apod?.explanation ? apod.explanation.slice(0, 200) + '…' : 'NASA publiceert dagelijks de mooiste astronomische foto — wij leggen het uit op jouw niveau, van beginner tot professional.'}
        </p>

        <div className="hero-ctas" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href={heroHref}
            target={heroTarget}
            rel="noopener noreferrer"
            className="btn-clip"
            style={{ background: '#f4f6ff', color: '#07080d', fontFamily: 'var(--font-dm-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f4f6ff')}
          >
            {heroLabel}
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="#nieuws"
            style={{ fontSize: '0.72rem', color: '#7a86a8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#dde2f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7a86a8')}
          >
            Alle nieuws
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* Copyright */}
      {apod?.copyright && (
        <div style={{ position: 'absolute', bottom: 16, right: 24, zIndex: 3, fontFamily: 'var(--font-dm-mono)', fontSize: '0.5rem', color: 'rgba(120,130,160,0.5)' }}>
          © {apod.copyright}
        </div>
      )}

      {/* Scroll hint */}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 24, right: 40, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, #4a5278, transparent)' }} />
        <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4a5278', writingMode: 'vertical-rl' }}>Scroll</span>
      </div>
    </section>
  )
}

// ── Topics filter ──────────────────────────────────────────────────────────
function TopicsStrip() {
  const [active, setActive] = useState('Alles')

  return (
    <div
      role="navigation"
      aria-label="Onderwerp filter"
      style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid #1c2035', background: '#07080d' }}
    >
      <div
        className="topics-pad"
        role="tablist"
        aria-label="Filter op onderwerp"
        style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        {TOPICS.map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={active === t}
            onClick={() => setActive(t)}
            style={{
              flexShrink: 0, padding: '14px 22px',
              fontFamily: 'var(--font-dm-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: active === t ? '#dde2f0' : '#4a5278',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: active === t ? '2px solid #d4a84b' : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (active !== t) e.currentTarget.style.color = '#7a86a8' }}
            onMouseLeave={e => { if (active !== t) e.currentTarget.style.color = '#4a5278' }}
          >
            {t}
            {active === t && <span aria-hidden="true" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#d4a84b', marginLeft: 6, verticalAlign: 'middle' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Bento card ─────────────────────────────────────────────────────────────
function BentoCard({ article, size }: { article: Article; size: 'hero' | 'md' | 'sm' }) {
  const thumbH = size === 'hero' ? 320 : size === 'md' ? 180 : 130
  const iconSz = size === 'hero' ? 52 : size === 'md' ? 40 : 32
  const lvl    = getLevel(article.category)
  const lvlC   = LEVEL_COLOR[lvl]

  return (
    <article
      className={`card-wrap bento-${size}`}
      style={{ background: '#0c0e18', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'background 0.25s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#111420')}
      onMouseLeave={e => (e.currentTarget.style.background = '#0c0e18')}
    >
      <Link
        href={`/nieuws/${article.slug}`}
        aria-label={article.title}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, textDecoration: 'none', color: 'inherit' }}
      >
        {/* Thumbnail */}
        <div style={{ height: thumbH, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          {/* Category color top accent */}
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: article.catColor, zIndex: 2 }} />
          <div
            className="card-thumb-inner"
            style={{ width: '100%', height: '100%', background: article.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CategoryIcon category={article.category} color={article.catColor} size={iconSz} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: size === 'hero' ? 32 : size === 'md' ? 20 : 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.57rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.catColor, marginBottom: 8 }}>
            {article.category}
          </div>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 700, lineHeight: 1.18, color: '#f4f6ff', fontSize: size === 'hero' ? '2rem' : size === 'md' ? '1.1rem' : '0.9rem', marginBottom: size === 'sm' ? 0 : 10 }}>
            {article.title}
          </h2>
          {size !== 'sm' && (
            <p style={{ fontSize: '0.82rem', color: '#7a86a8', lineHeight: 1.65, flex: 1, display: '-webkit-box', WebkitLineClamp: size === 'hero' ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: size === 'hero' ? 20 : 16 }}>
              {article.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-dm-mono)', fontSize: '0.54rem', color: '#4a5278', letterSpacing: '0.05em', marginTop: 'auto', paddingTop: size === 'sm' ? 8 : 12 }}>
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

// ── Article row ────────────────────────────────────────────────────────────
function ArticleRow({ article }: { article: Article }) {
  const lvl  = getLevel(article.category)
  const lvlC = LEVEL_COLOR[lvl]

  return (
    <div style={{ position: 'relative', borderBottom: '1px solid #1c2035', transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      <Link
        href={`/nieuws/${article.slug}`}
        aria-label={article.title}
        style={{ display: 'grid', gridTemplateColumns: '84px 1fr', gap: 20, padding: '20px 0', textDecoration: 'none', color: 'inherit' }}
      >
        <div style={{ width: 84, height: 84, background: article.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
          <CategoryIcon category={article.category} color={article.catColor} size={30} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.53rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.catColor, marginBottom: 4 }}>
            {article.category}
          </div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem', fontWeight: 600, color: '#f4f6ff', lineHeight: 1.3, marginBottom: 4 }}>
            {article.title}
          </div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.52rem', color: '#4a5278', marginBottom: 6 }}>
            {article.date} · {article.readTime} min lezen
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-dm-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', background: lvlC.bg, color: lvlC.color, borderLeft: `2px solid ${lvlC.border}`, borderRadius: 2 }}>
            {LEVEL_LABEL[lvl]}
          </span>
        </div>
      </Link>
    </div>
  )
}

// ── ISS Widget ─────────────────────────────────────────────────────────────
function ISSWidget({ iss }: { iss: ISSData | null }) {
  const px = iss ? ((iss.longitude + 180) / 360 * 100) : 50
  const py = iss ? ((90 - iss.latitude)  / 180 * 100) : 50

  return (
    <div
      role="region"
      aria-labelledby="iss-title"
      style={{ border: '1px solid #1c2035', background: '#111420', overflow: 'hidden', borderRadius: 2 }}
    >
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #1c2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span id="iss-title" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7a86a8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ position: 'relative', width: 7, height: 7, flexShrink: 0 }} aria-hidden="true">
            <span className="animate-pulse-dot" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3ddf90' }} />
            <span className="animate-live-ring" style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1px solid #3ddf90' }} />
          </span>
          ISS Live Tracker
        </span>
        <span aria-live="polite" aria-atomic="true" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.5rem', color: '#4a5278' }}>Realtime</span>
      </div>

      {/* Map */}
      <div
        role="img"
        aria-label="Kaart met de huidige positie van het ISS"
        style={{ height: 160, background: '#050810', position: 'relative', overflow: 'hidden' }}
      >
        {/* World map */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png"
          alt=""
          aria-hidden="true"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, filter: 'brightness(0.5) saturate(0) sepia(1) hue-rotate(190deg)', position: 'absolute', inset: 0 }}
        />
        {/* Grid lines */}
        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}>
          {[25, 50, 75].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#3dcfdf" strokeWidth="0.5" />)}
          {[16.6, 33.3, 50, 66.6, 83.3].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#3dcfdf" strokeWidth="0.5" />)}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#3dcfdf" strokeWidth="1" opacity="0.4" />
        </svg>
        {/* Orbit trail */}
        {iss && (
          <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <ellipse cx={`${px}%`} cy="50%" rx="18%" ry="28%" fill="none" stroke="#3ddf90" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.25" />
          </svg>
        )}
        {/* ISS dot */}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, width: 12, height: 12, transform: 'translate(-50%,-50%)', zIndex: 2, transition: 'left 2s linear, top 2s linear' }}
        >
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3ddf90', boxShadow: '0 0 0 3px rgba(61,223,144,0.25), 0 0 14px rgba(61,223,144,0.6)' }} />
          <div className="animate-live-ring" style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(61,223,144,0.5)' }} />
        </div>
        {/* ISS label */}
        {iss && (
          <div aria-hidden="true" style={{ position: 'absolute', left: `${Math.min(px + 2, 83)}%`, top: `${Math.max(py - 14, 4)}%`, fontFamily: 'var(--font-dm-mono)', fontSize: '0.48rem', color: '#3ddf90', letterSpacing: '0.1em', whiteSpace: 'nowrap', zIndex: 3 }}>ISS ↗</div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {[
          { val: iss ? `${iss.latitude.toFixed(1)}°`               : '—',        lbl: 'Breedtegraad' },
          { val: iss ? `${iss.longitude.toFixed(1)}°`              : '—',        lbl: 'Lengtegraad' },
          { val: iss ? `${Math.round(iss.altitude)} km`            : '408 km',   lbl: 'Hoogte' },
          { val: iss ? `${(iss.velocity / 1000).toFixed(1)}k km/h` : '27.6k km/h', lbl: 'Snelheid' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '12px 20px', borderTop: '1px solid #1c2035', borderRight: i % 2 === 0 ? '1px solid #1c2035' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem', fontWeight: 700, color: '#f4f6ff', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278', marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── APOD widget ────────────────────────────────────────────────────────────
function APODWidget({ apod }: { apod: APODData | null }) {
  return (
    <div
      role="region"
      aria-labelledby="apod-widget-title"
      style={{ border: '1px solid #1c2035', background: '#111420', overflow: 'hidden', borderRadius: 2 }}
    >
      <div style={{ padding: '11px 20px', borderBottom: '1px solid #1c2035' }}>
        <span id="apod-widget-title" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7a86a8' }}>
          NASA Foto van de Dag
        </span>
      </div>
      {apod?.media_type === 'image' ? (
        <img
          src={apod.url}
          alt={apod.title}
          loading="lazy"
          style={{ width: '100%', height: 160, objectFit: 'cover', filter: 'brightness(0.85) saturate(1.1)', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg,#0a1030,#1a2060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="4" fill="rgba(212,168,75,0.6)" />
            <circle cx="24" cy="24" r="10" fill="none" stroke="rgba(212,168,75,0.2)" strokeWidth="1" />
            <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(212,168,75,0.08)" strokeWidth="1" />
          </svg>
        </div>
      )}
      {apod && (
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.53rem', letterSpacing: '0.1em', color: '#d4a84b', marginBottom: 6 }}>
            {new Date(apod.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', fontWeight: 600, color: '#f4f6ff', lineHeight: 1.3, marginBottom: 6 }}>{apod.title}</div>
          <p style={{ fontSize: '0.76rem', color: '#7a86a8', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {apod.explanation}
          </p>
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
    <div
      role="region"
      aria-label="AI feature"
      style={{ border: '1px solid rgba(138,104,32,0.5)', background: 'linear-gradient(135deg,rgba(16,14,5,0.9),rgba(26,21,8,0.9))', padding: 24, position: 'relative', overflow: 'hidden', borderRadius: 2 }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', right: 16, top: 12, fontSize: '4rem', color: '#8a6820', opacity: 0.12, lineHeight: 1, pointerEvents: 'none' }}>✦</div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d4a84b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1l1.5 3H11l-2.5 2 1 3L6 7.5 2.5 9l1-3L1 4h3.5L6 1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
        AI Feature
      </div>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem', fontWeight: 700, color: '#f4f6ff', lineHeight: 1.2, marginBottom: 10 }}>
        Lees elk artikel op jouw niveau
      </div>
      <p style={{ fontSize: '0.76rem', color: '#7a86a8', lineHeight: 1.65, marginBottom: 16 }}>
        Kies Beginner, Amateur of Pro — onze AI herschrijft het artikel live voor jou.
      </p>
      <div role="group" aria-label="Lees niveau keuze" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {LEVELS_UI.map(l => (
          <button
            key={l.key}
            aria-label={`${l.label} niveau`}
            style={{ flex: 1, padding: '6px 0', fontFamily: 'var(--font-dm-mono)', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', border: `1px solid ${l.border}`, color: l.color, background: 'transparent', borderRadius: 2, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = l.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{l.label}</button>
        ))}
      </div>
      <Link
        href="/tools/herschrijver"
        className="btn-clip"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d4a84b', color: '#07080d', fontFamily: 'var(--font-dm-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 20px', textDecoration: 'none', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#e8be60')}
        onMouseLeave={e => (e.currentTarget.style.background = '#d4a84b')}
      >
        Probeer het nu →
      </Link>
    </div>
  )
}

// ── Newsletter ─────────────────────────────────────────────────────────────
function Newsletter() {
  return (
    <section
      aria-labelledby="newsletter-title"
      style={{ position: 'relative', zIndex: 1, background: '#0c0e18', borderTop: '1px solid #1c2035', borderBottom: '1px solid #1c2035', overflow: 'hidden' }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 100% 50%, rgba(212,168,75,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div
        className="newsletter-grid newsletter-inner"
        style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '64px var(--sp-10)' }}
      >
        {/* Left */}
        <div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4a84b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden="true" style={{ width: 28, height: 1, background: '#d4a84b', display: 'inline-block' }} />
            Nieuwsbrief
          </div>
          <h2 id="newsletter-title" style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.8rem,3vw,2.8rem)', fontWeight: 700, color: '#f4f6ff', lineHeight: 1.1, marginBottom: 16 }}>
            Het heelal<br />in je inbox
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#7a86a8', lineHeight: 1.75, maxWidth: 440 }}>
            Wekelijks de belangrijkste ontdekkingen, komende lanceringen en sterrenkijk-tips — uitgelegd op jouw niveau. Geen spam, altijd uitschrijfbaar.
          </p>
          <div style={{ display: 'flex', gap: 32, marginTop: 24, flexWrap: 'wrap' }}>
            {[['4.200+', 'Abonnees'], ['Wekelijks', 'Frequentie'], ['Gratis', 'Altijd']].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', fontWeight: 700, color: '#d4a84b', lineHeight: 1 }}>{val}</div>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278', marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <form
          action="#"
          method="post"
          aria-label="Nieuwsbrief aanmelden"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div className="nl-input-wrap" style={{ display: 'flex', gap: 2, background: '#1c2035' }}>
            <label htmlFor="nl-email" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>E-mailadres</label>
            <input
              id="nl-email"
              type="email"
              name="email"
              placeholder="jouw@email.nl"
              required
              autoComplete="email"
              inputMode="email"
              style={{ flex: 1, background: '#0a0c14', border: 'none', padding: '14px 18px', color: '#dde2f0', fontFamily: 'var(--font-dm-mono)', fontSize: '0.7rem', outline: 'none' }}
              onFocus={e => (e.currentTarget.style.background = '#0f1120')}
              onBlur={e => (e.currentTarget.style.background = '#0a0c14')}
            />
            <button
              type="submit"
              style={{ background: '#d4a84b', color: '#07080d', fontFamily: 'var(--font-dm-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px 22px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              aria-label="Aanmelden voor nieuwsbrief"
              onMouseEnter={e => (e.currentTarget.style.background = '#e8be60')}
              onMouseLeave={e => (e.currentTarget.style.background = '#d4a84b')}
            >Aanmelden</button>
          </div>
          <p style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.54rem', color: '#4a5278', lineHeight: 1.6 }}>
            Door aan te melden ga je akkoord met onze{' '}
            <Link href="/privacy" style={{ color: '#7a86a8', textDecoration: 'underline', textUnderlineOffset: 3 }}>privacyverklaring</Link>.
            Je kunt je altijd uitschrijven.
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
    <footer role="contentinfo" style={{ position: 'relative', zIndex: 1, background: '#0c0e18', borderTop: '1px solid #1c2035' }}>
      <div className="footer-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.7rem', fontWeight: 700, color: '#f4f6ff', marginBottom: 16 }}>
              Cosmos<em style={{ fontStyle: 'italic', color: '#d4a84b' }}>NL</em>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#7a86a8', lineHeight: 1.75, maxWidth: 280, marginBottom: 24 }}>
              Het Nederlandse astronomie-platform met AI-aangedreven uitleg op jouw niveau. Van beginners tot professionals.
            </p>
            {/* Social links */}
            <div style={{ display: 'flex', gap: 10 }} aria-label="Sociale media">
              {[
                { href: '#', label: 'CosmosNL op X (Twitter)', icon: <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13" aria-hidden="true"><path d="M12.6 1h2.4l-5.2 6 6.2 8H12l-3.7-4.9L3.8 15H1.4l5.5-6.3L.8 1H5l3.4 4.5L12.6 1z" /></svg> },
                { href: '#', label: 'CosmosNL op Instagram', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" width="13" height="13" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="3.5" /><circle cx="8" cy="8" r="3" /><circle cx="11.5" cy="4.5" r="0.7" fill="currentColor" stroke="none" /></svg> },
                { href: '#', label: 'CosmosNL op YouTube', icon: <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13" aria-hidden="true"><path d="M14.5 4.5s-.2-1.2-.7-1.7c-.7-.7-1.4-.7-1.8-.8C10.5 2 8 2 8 2s-2.5 0-4 .1c-.4 0-1.1.1-1.8.8-.5.5-.7 1.7-.7 1.7S1.3 5.9 1.3 7.3v1.3c0 1.4.2 2.8.2 2.8s.2 1.2.7 1.7c.7.7 1.6.7 2 .7C5.5 14 8 14 8 14s2.5 0 4-.1c.4-.1 1.1-.1 1.8-.8.5-.5.7-1.7.7-1.7s.2-1.4.2-2.8V7.3C14.7 5.9 14.5 4.5 14.5 4.5zM6.5 10.2V5.8l4.5 2.2-4.5 2.2z" /></svg> },
              ].map(({ href, label, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{ width: 32, height: 32, border: '1px solid #252840', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5278', transition: 'border-color 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a5278'; e.currentTarget.style.color = '#7a86a8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#252840'; e.currentTarget.style.color = '#4a5278' }}
                >{icon}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.57rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a5278', marginBottom: 16 }}>
                {col.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    style={{ fontSize: '0.82rem', color: '#7a86a8', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#dde2f0')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#7a86a8')}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="footer-bottom-row"
          style={{ borderTop: '1px solid #1c2035', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
        >
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.54rem', letterSpacing: '0.06em', color: '#2a3050' }}>
            © 2026 CosmosNL — Astronomie voor iedereen
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-dm-mono)', fontSize: '0.52rem', color: '#2a3050' }}>
            {[['Claude AI', '⬡'], ['NASA Open APIs', '★']].map(([label, icon]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', border: '1px solid #1c2035', borderRadius: 2 }}>
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
  const [apod,     setApod]     = useState<APODData | null>(null)
  const [iss,      setIss]      = useState<ISSData | null>(null)
  const [articles, setArticles] = useState<Article[]>(FALLBACK_ARTICLES)

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
      .then(r => r.json())
      .then(setApod)
      .catch(() => {})
  }, [])

  // Fetch ISS every 5s
  useEffect(() => {
    const fetchISS = () =>
      fetch('https://api.wheretheiss.at/v1/satellites/25544')
        .then(r => r.json())
        .then(setIss)
        .catch(() => {})
    fetchISS()
    const id = setInterval(fetchISS, 5000)
    return () => clearInterval(id)
  }, [])

  const featuredArticle = articles.find(a => a.featured) ?? articles[0]
  const gridArticles    = articles.slice(0, 6)

  return (
    <>
      {/* Skip to content */}
      <a href="#main-content" className="skip-link">Ga naar hoofdinhoud</a>

      <Starfield />
      <Topbar />
      <SiteNav />
      <Hero apod={apod} featuredSlug={featuredArticle.slug} />
      <TopicsStrip />

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="main-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--max-w)', margin: '0 auto' }}>

        {/* Section header */}
        <div id="nieuws" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4a5278' }}>Laatste nieuws</span>
            <div aria-hidden="true" style={{ width: 48, height: 1, background: '#252840' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.55rem', color: '#4a5278' }} aria-label={`${gridArticles.length} artikelen`}>{gridArticles.length} artikelen</span>
        </div>

        {/* Bento grid */}
        <div className="bento-grid" role="list" aria-label="Nieuws artikelen">
          {gridArticles[0] && <BentoCard article={gridArticles[0]} size="hero" />}
          {gridArticles[1] && <BentoCard article={gridArticles[1]} size="md" />}
          {gridArticles[2] && <BentoCard article={gridArticles[2]} size="md" />}
          {gridArticles[3] && <BentoCard article={gridArticles[3]} size="sm" />}
          {gridArticles[4] && <BentoCard article={gridArticles[4]} size="sm" />}
          {gridArticles[5] && <BentoCard article={gridArticles[5]} size="sm" />}
        </div>

        {/* Content split: article list + sidebar */}
        <div className="content-split">

          {/* Recent articles */}
          <section aria-labelledby="recent-label">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
              <span id="recent-label" style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4a5278' }}>Recent</span>
              <div aria-hidden="true" style={{ flex: 1, height: 1, background: '#1c2035' }} />
            </div>
            <div role="list" aria-label="Recente artikelen">
              {articles.map((a, i) => <ArticleRow key={a.slug + i} article={a} />)}
            </div>
          </section>

          {/* Sidebar */}
          <aside aria-label="Widgets" className="sidebar-grid">
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
