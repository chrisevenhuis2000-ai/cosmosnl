'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

const NAV_LINKS = [
  { href: '/nieuws',        label: 'Nieuws' },
  { href: '/sterrenkijken', label: 'Sterrenkijken' },
  { href: '/missies',       label: 'Missies' },
  { href: '/educatie',      label: 'Educatie' },
]

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
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', textDecoration: 'none', transition: 'color 0.15s', padding: '8px 0' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4A5A8A')}
                >{label}</Link>
              </li>
            ))}
          </ul>
          <button className="nav-hamburger" aria-expanded={mobileOpen} aria-controls="mobile-nav" aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'} onClick={() => setMobileOpen(o => !o)} style={{ flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ display: 'block', width: 22, height: 2, background: '#8A9BC4', borderRadius: 1, transition: 'transform 0.25s, opacity 0.25s', transform: mobileOpen ? i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : 'none' : 'none', opacity: mobileOpen && i === 1 ? 0 : 1 }} />
            ))}
          </button>
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

export default function OverPage() {
  return (
    <>
      <SiteNav />
      <main className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', paddingTop: 48, paddingBottom: 80 }}>
        {/* Breadcrumb */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: '#378ADD', textDecoration: 'none' }}>Home</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>Over ons</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 8 }}>
          Over NightGazer
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 40 }}>
          Astronomie voor iedereen
        </p>

        <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Wat is NightGazer?</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              NightGazer is een Nederlandstalig astronomie-platform dat dagelijks het laatste ruimtenieuws brengt van NASA, ESA en SpaceflightNow — vertaald en uitgelegd in het Nederlands. Van de nieuwste ontdekkingen van de James Webb Telescoop tot live updates over ruimtemissies.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>AI-aangedreven uitleg</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Elk artikel is beschikbaar op drie niveaus: <strong style={{ color: '#e05040' }}>Beginner</strong> (geen vakjargon, heldere analogieën), <strong style={{ color: '#3ddf90' }}>Amateur</strong> (technische termen met uitleg) en <strong style={{ color: '#3dcfdf' }}>Pro</strong> (volledige wetenschappelijke precisie). Zo is er voor elke lezer iets geschikt — of je nu voor het eerst naar de sterren kijkt of al jaren sterrenwacht bezoekt.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Wat bieden we?</h2>
            <ul style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 2, paddingLeft: 20 }}>
              <li>Dagelijks automatisch vertaald ruimtenieuws</li>
              <li>Live ISS-tracker en NASA APOD (Astronomie Foto van de Dag)</li>
              <li>Interactieve sterrenkijkgids met donkere-hemelkaarten voor Nederland</li>
              <li>Missie-overzichten: Starship, Artemis II, JWST, Perseverance en meer</li>
              <li>Dagelijkse astronomie-quiz op drie niveaus</li>
            </ul>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Technologie</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              NightGazer is gebouwd met Next.js en gebruikt de Claude AI van Anthropic voor vertalingen en niveauaanpassingen. Nieuwsartikelen worden dagelijks opgehaald uit openbare RSS-feeds van NASA, ESA en SpaceflightNow. Beelden zijn afkomstig van de NASA Images API en Pexels.
            </p>
          </section>
        </div>

        <div style={{ marginTop: 48 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none' }}>
            ← Terug naar home
          </Link>
        </div>
      </main>
    </>
  )
}
