'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MISSIONS, type MissionDetail as Mission, type MissionStatus } from '@/lib/missions-data'

const SolarSystemMap = dynamic(() => import('./SolarSystemMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 560, background: '#12132A', border: '1px solid #252858', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A' }}>Kaart laden...</span>
    </div>
  ),
})

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

// ── Types ──────────────────────────────────────────────────────────────────
interface Article {
  slug:      string
  title:     string
  excerpt:   string
  category:  string
  catColor:  string
  author:    string
  date:      string
  readTime:  number
  featured:  boolean
  imageUrl?: string
}

// MISSIONS and MissionStatus are imported from @/lib/missions-data

const STATUS_STYLE: Record<MissionStatus, { bg: string; color: string; label: string }> = {
  actief:   { bg: 'rgba(61,223,144,0.15)',  color: '#3ddf90', label: 'Actief' },
  gepland:  { bg: 'rgba(55,138,221,0.15)',  color: '#378ADD', label: 'Gepland' },
  voltooid: { bg: 'rgba(74,90,138,0.15)',   color: '#8A9BC4', label: 'Voltooid' },
}

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

function slugHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return Math.abs(h)
}

// ── Starfield ──────────────────────────────────────────────────────────────
function Starfield() {
  useEffect(() => {
    const canvas = document.getElementById('missies-starfield') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stars = Array.from({ length: 320 }, () => ({
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
  return <canvas id="missies-starfield" suppressHydrationWarning aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
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
  return (
    <>
      <nav aria-label="Hoofdnavigatie" style={{ position: 'sticky', top: 0, zIndex: 20, height: 'var(--nav-h)', background: 'rgba(26,26,46,0.96)', borderBottom: '1px solid #252858', backdropFilter: 'blur(16px)' }}>
        <div className="nav-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 40 }}>
          <Link href="/" aria-label="NightGazer — naar de startpagina" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 46, width: 'auto', display: 'block' }} />
          </Link>
          <ul className="nav-links" role="list" style={{ gap: 32, flex: 1, justifyContent: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = href === '/missies'
              return (
                <li key={href}>
                  <Link href={href} style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: isActive ? '#FFFFFF' : '#4A5A8A', textDecoration: 'none', transition: 'color 0.15s', padding: '8px 0', borderBottom: isActive ? '1px solid #378ADD' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = isActive ? '#FFFFFF' : '#4A5A8A')}
                  >{label}</Link>
                </li>
              )
            })}
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
          {[...NAV_LINKS, { href: '/tools/herschrijver', label: 'AI Tools' }, { href: '/nieuwsbrief', label: 'Nieuwsbrief' }].map(({ href, label }) => (
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
function MissiesHero() {
  const activeCount  = MISSIONS.filter(m => m.status === 'actief').length
  const plannedCount = MISSIONS.filter(m => m.status === 'gepland').length
  return (
    <section aria-labelledby="hero-title" style={{ position: 'relative', zIndex: 1, minHeight: '75vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #04060f 0%, #0a0e1e 40%, #060c18 70%, #04080e 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,40,88,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(37,40,88,0.35) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.5) 70%, transparent 100%)' }} />
      {/* Decorative orbit rings */}
      <div aria-hidden="true" style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', width: 540, height: 540, borderRadius: '50%', border: '1px solid rgba(55,138,221,0.1)', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', width: 370, height: 370, borderRadius: '50%', border: '1px solid rgba(61,207,223,0.09)', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', right: '13%', top: '50%', transform: 'translateY(-50%)', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(55,138,221,0.14)', background: 'radial-gradient(circle, rgba(55,138,221,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {/* Gradients */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0.65) 30%, rgba(26,26,46,0.1) 70%, transparent 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,26,46,0.7) 0%, transparent 55%)' }} />

      <div className="hero-content-pad animate-fadeUp" style={{ position: 'relative', zIndex: 2, maxWidth: 780 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div aria-hidden="true" style={{ width: 32, height: 1, background: '#378ADD' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', color: '#378ADD', textTransform: 'uppercase' }}>Overzicht</span>
        </div>
        <h1 id="hero-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem,6vw,5rem)', fontWeight: 700, lineHeight: 1.04, color: '#FFFFFF', marginBottom: 20, letterSpacing: '-0.015em' }}>
          Ruimte&shy;missies
        </h1>
        <p style={{ fontSize: '1rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520, marginBottom: 36 }}>
          Van Mars-rovers tot telescopen op 1,5 miljoen kilometer afstand — volg de meest ambitieuze expedities die de mensheid ooit heeft uitgevoerd.
        </p>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            { value: String(activeCount),  label: 'Actieve missies',      color: '#3ddf90' },
            { value: String(plannedCount), label: 'Geplande missies',     color: '#378ADD' },
            { value: '4',                  label: 'Agentschappen',        color: '#c080ff' },
            { value: '4',                  label: 'Bestemmingen',         color: '#3dcfdf' },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5A8A', marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#alle-missies" className="btn-clip" style={{ background: '#378ADD', color: '#1A1A2E', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
            onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
          >
            Alle missies
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
          <a href="#nieuws" style={{ fontSize: '0.72rem', color: '#8A9BC4', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
          >
            Missie nieuws
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </div>
      </div>

      <div aria-hidden="true" style={{ position: 'absolute', bottom: 24, right: 40, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, #4A5A8A, transparent)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4A5A8A', writingMode: 'vertical-rl' }}>Scroll</span>
      </div>
    </section>
  )
}

// ── Agencies strip ─────────────────────────────────────────────────────────
const AGENCIES = [
  { name: 'NASA',   color: '#378ADD', missions: MISSIONS.filter(m => m.agency.includes('NASA')).length },
  { name: 'ESA',    color: '#ffa040', missions: MISSIONS.filter(m => m.agency.includes('ESA')).length },
  { name: 'SpaceX', color: '#3dcfdf', missions: MISSIONS.filter(m => m.agency.includes('SpaceX')).length },
  { name: 'JAXA',   color: '#c080ff', missions: 0 },
  { name: 'ISRO',   color: '#3ddf90', missions: 0 },
  { name: 'CSA',    color: '#ff7060', missions: MISSIONS.filter(m => m.agency.includes('CSA')).length },
]

function AgenciesStrip() {
  return (
    <div style={{ borderBottom: '1px solid #252858', borderTop: '1px solid #252858', background: 'rgba(18,19,42,0.8)', backdropFilter: 'blur(8px)', overflowX: 'auto', scrollbarWidth: 'none' }}>
      <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', alignItems: 'stretch' }} className="topics-pad">
        {AGENCIES.map((ag, i) => (
          <div key={ag.name} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRight: i < AGENCIES.length - 1 ? '1px solid #252858' : 'none' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ag.color }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: '#FFFFFF' }}>{ag.name}</span>
            {ag.missions > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#4A5A8A' }}>{ag.missions} missie{ag.missions !== 1 ? 's' : ''}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mission card ───────────────────────────────────────────────────────────
function MissionCard({ mission }: { mission: Mission }) {
  const [hovered, setHovered] = useState(false)
  const st = STATUS_STYLE[mission.status]
  return (
    <Link href={`/missies/${mission.id}`} style={{ textDecoration: 'none', display: 'block' }}>
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(145deg, ${mission.bgFrom} 0%, ${mission.bgTo} 100%)`
          : '#12132A',
        border: `1px solid ${hovered ? 'rgba(55,138,221,0.28)' : 'transparent'}`,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'background 0.4s, border-color 0.25s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hovered && (
        <div aria-hidden="true" style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${mission.agencyColor}14 0%, transparent 70%)`, pointerEvents: 'none' }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>{mission.icon}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 4 }}>{mission.name}</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: mission.agencyColor }}>{mission.agency}</span>
          </div>
        </div>
        <span style={{ flexShrink: 0, background: st.bg, color: st.color, fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 2, border: `1px solid ${st.color}40`, display: 'flex', alignItems: 'center', gap: 5 }}>
          {mission.status === 'actief' && <span className="animate-pulse-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: st.color, flexShrink: 0 }} aria-hidden="true" />}
          {st.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.46rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 2 }}>Lancering</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8A9BC4' }}>{mission.launched}</div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.46rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 2 }}>Bestemming</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8A9BC4' }}>{mission.body}</div>
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', color: '#8A9BC4', lineHeight: 1.65, margin: 0 }}>{mission.objective}</p>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'rgba(55,138,221,0.06)', borderLeft: `2px solid ${mission.agencyColor}55` }}>
        <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M6 1l1.5 3 3.5.5-2.5 2.4.6 3.5L6 8.9l-3.1 1.5.6-3.5L1 4.5 4.5 4z" stroke={mission.agencyColor} strokeWidth="1" fill="none" />
        </svg>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.57rem', color: '#8A9BC4', lineHeight: 1.55 }}>{mission.highlight}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: mission.agencyColor, opacity: 0.7 }}>
        Lees meer
        <svg width="10" height="10" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </article>
    </Link>
  )
}

// ── Mission filter strip ───────────────────────────────────────────────────
type MissionFilter = 'Alles' | 'Actief' | 'Gepland' | 'Voltooid'
const MISSION_FILTERS: MissionFilter[] = ['Alles', 'Actief', 'Gepland', 'Voltooid']

function MissionFilterStrip({ active, onFilter, counts }: { active: MissionFilter; onFilter: (f: MissionFilter) => void; counts: Record<string, number> }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
      {MISSION_FILTERS.map(f => {
        const isActive = active === f
        return (
          <button key={f} onClick={() => onFilter(f)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 18px', border: `1px solid ${isActive ? '#378ADD' : '#252858'}`, background: isActive ? 'rgba(55,138,221,0.12)' : 'transparent', color: isActive ? '#FFFFFF' : '#4A5A8A', cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(55,138,221,0.4)'; e.currentTarget.style.color = '#8A9BC4' } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#4A5A8A' } }}
          >
            {f}
            <span style={{ background: isActive ? 'rgba(55,138,221,0.2)' : '#252858', color: isActive ? '#378ADD' : '#4A5A8A', padding: '1px 6px', borderRadius: 2, fontSize: '0.5rem' }}>{counts[f]}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Article card ───────────────────────────────────────────────────────────
function ArticleCard({ article }: { article: Article }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={`/nieuws/${article.slug}`} className="card-wrap" style={{ textDecoration: 'none', display: 'block', border: `1px solid ${hovered ? 'rgba(55,138,221,0.3)' : 'transparent'}`, transition: 'border-color 0.2s', background: '#12132A', overflow: 'hidden' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {article.imageUrl ? (
        <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
          <img src={`https://images.weserv.nl/?url=${encodeURIComponent(article.imageUrl)}&w=640&h=320&fit=cover`} alt="" loading="lazy" className="card-thumb-inner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.75 }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,19,42,0.9) 0%, transparent 60%)' }} />
        </div>
      ) : (
        <div style={{ height: 120, background: 'linear-gradient(135deg, #080c1a, #101828)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span aria-hidden="true" style={{ fontSize: '1.8rem', opacity: 0.3 }}>🚀</span>
        </div>
      )}
      <div style={{ padding: '16px 18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: article.catColor || '#378ADD' }}>{article.category}</span>
          <span style={{ color: '#252858' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: '#4A5A8A' }}>{article.readTime} min</span>
          <span className="card-read-more">Lees →</span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.35, marginBottom: 8 }}>{article.title}</h3>
        <p style={{ fontSize: '0.75rem', color: '#8A9BC4', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.excerpt}</p>
      </div>
    </Link>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer style={{ position: 'relative', zIndex: 1, background: '#0F1028', borderTop: '1px solid #252858' }}>
      <div className="footer-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div className="footer-grid">
          <div>
            <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 42, width: 'auto', display: 'block', marginBottom: 16 }} />
            <p style={{ fontSize: '0.78rem', color: '#4A5A8A', lineHeight: 1.7, maxWidth: 260, margin: '0 0 20px' }}>
              Nederlandstalig ruimtevaartnieuws — van Mars-rovers tot telescopen aan de rand van het heelal.
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 16 }}>Pagina&apos;s</div>
            {[['/', 'Home'], ['/nieuws', 'Nieuws'], ['/missies', 'Missies'], ['/sterrenkijken', 'Sterrenkijken'], ['/educatie', 'Educatie']].map(([href, label]) => (
              <Link key={href} href={href} style={{ display: 'block', fontSize: '0.78rem', color: '#8A9BC4', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
              >{label}</Link>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 16 }}>Tools</div>
            {[['/tools/herschrijver', 'AI Herschrijver'], ['/nieuwsbrief', 'Nieuwsbrief']].map(([href, label]) => (
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
        <div className="footer-bottom-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid #252858' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#2A3060' }}>© {new Date().getFullYear()} NightGazer · nightgazer.space</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#2A3060' }}>Afbeeldingen: NASA · ESA · SpaceX</span>
        </div>
      </div>
    </footer>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function MissiesPage() {
  const [missionFilter, setMissionFilter] = useState<MissionFilter>('Alles')
  const [articles, setArticles]           = useState<Article[]>([])
  const nasaFetchedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: Article[]) => {
        if (!Array.isArray(data)) return
        const filtered = data.filter(a =>
          a.category?.toLowerCase().includes('missies') ||
          a.category?.toLowerCase().includes('missions') ||
          a.category?.toLowerCase().includes('spacex') ||
          a.category?.toLowerCase().includes('nasa')
        )
        setArticles(filtered.length > 0 ? filtered : data.slice(0, 6))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const toFetch = articles.filter(a => !a.imageUrl && !nasaFetchedRef.current.has(a.slug)).slice(0, 6)
    if (!toFetch.length) return
    toFetch.forEach(a => nasaFetchedRef.current.add(a.slug))
    toFetch.forEach(async (a) => {
      const hash = slugHash(a.slug) & 0xffff
      const page = (hash % 3) + 1
      const keywords = (a.title || a.slug.replace(/-/g, ' ')).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5).join(' ')
      for (const q of [keywords, 'rocket launch spacecraft mission']) {
        try {
          const res = await fetch(`${PROXY}/image-search?q=${encodeURIComponent(q)}&page=${page}&hash=${hash}`)
          if (!res.ok) continue
          const data = await res.json()
          if (!data?.url) continue
          setArticles(prev => prev.map(p => p.slug === a.slug ? { ...p, imageUrl: data.url } : p))
          return
        } catch { /* no image */ }
      }
    })
  }, [articles])

  const filteredMissions = missionFilter === 'Alles'
    ? MISSIONS
    : MISSIONS.filter(m => m.status === (missionFilter.toLowerCase() as MissionStatus))

  const missionCounts: Record<string, number> = {
    Alles:    MISSIONS.length,
    Actief:   MISSIONS.filter(m => m.status === 'actief').length,
    Gepland:  MISSIONS.filter(m => m.status === 'gepland').length,
    Voltooid: MISSIONS.filter(m => m.status === 'voltooid').length,
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Ga naar hoofdinhoud</a>
      <Starfield />
      <Topbar />
      <SiteNav />
      <MissiesHero />
      <AgenciesStrip />

      <main id="main-content" tabIndex={-1} className="main-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--max-w)', margin: '0 auto' }}>

        {/* ── Solar system map ──────────────────────────────────────── */}
        <section aria-labelledby="map-label" style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <span id="map-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>Positiekaart</span>
            <div aria-hidden="true" style={{ flex: 1, height: 1, background: '#252858' }} />
          </div>
          <SolarSystemMap />
        </section>

        {/* ── All missions ─────────────────────────────────────────── */}
        <section aria-labelledby="missies-label" id="alle-missies" style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <span id="missies-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>Alle missies</span>
            <div aria-hidden="true" style={{ flex: 1, height: 1, background: '#252858' }} />
          </div>
          <MissionFilterStrip active={missionFilter} onFilter={setMissionFilter} counts={missionCounts} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2, background: '#252858', border: '1px solid #252858' }}>
            {filteredMissions.map(m => <MissionCard key={m.id} mission={m} />)}
          </div>
        </section>

        {/* ── Destinations ─────────────────────────────────────────── */}
        <section aria-labelledby="dest-label" style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <span id="dest-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>Bestemmingen</span>
            <div aria-hidden="true" style={{ flex: 1, height: 1, background: '#252858' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, background: '#252858', border: '1px solid #252858' }}>
            {[
              { name: 'Mars',        icon: '🔴', count: 2, color: '#ff8a60', desc: 'Curiosity & Perseverance actief' },
              { name: 'Maan',        icon: '🌕', count: 1, color: '#8A9BC4', desc: 'Artemis II gepland voor 2026' },
              { name: 'L2-punt',     icon: '🔭', count: 1, color: '#c080ff', desc: 'James Webb operationeel' },
              { name: 'Diep heelal', icon: '🌌', count: 1, color: '#3dcfdf', desc: 'Voyager 1 interstellair' },
            ].map(dest => (
              <div key={dest.name} style={{ background: '#12132A', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: '2rem' }}>{dest.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>{dest.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: dest.color, letterSpacing: '0.1em' }}>{dest.count} missie{dest.count !== 1 ? 's' : ''}</div>
                <p style={{ fontSize: '0.72rem', color: '#4A5A8A', margin: 0, lineHeight: 1.6 }}>{dest.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mission news ─────────────────────────────────────────── */}
        {articles.length > 0 && (
          <section aria-labelledby="nieuws-label" id="nieuws" style={{ marginBottom: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span id="nieuws-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>Missie nieuws</span>
                <div aria-hidden="true" style={{ width: 48, height: 1, background: '#252858' }} />
              </div>
              <Link href="/?topic=Missies" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#378ADD', textDecoration: 'none', letterSpacing: '0.08em', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
              >Alle missie-artikelen →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, background: '#252858', border: '1px solid #252858' }}>
              {articles.slice(0, 6).map(a => <ArticleCard key={a.slug} article={a} />)}
            </div>
          </section>
        )}

      </main>

      <SiteFooter />
    </>
  )
}
