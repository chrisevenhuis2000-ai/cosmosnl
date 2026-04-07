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

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', paddingTop: 48, paddingBottom: 80 }}>
        {/* Breadcrumb */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: '#378ADD', textDecoration: 'none' }}>Home</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>Privacy</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 8 }}>
          Privacyverklaring
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 40 }}>
          Bijgewerkt: april 2026
        </p>

        <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Welke gegevens verzamelen we?</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              NightGazer verzamelt geen persoonlijke gegevens. Er is geen account- of registratiesysteem. De enige lokale opslag die we gebruiken is <code style={{ background: '#1a1b3a', padding: '1px 6px', borderRadius: 2, fontSize: '0.82rem', color: '#3dcfdf' }}>localStorage</code> in je browser — uitsluitend om je quizantwoorden van de dag te onthouden. Deze gegevens verlaten nooit je apparaat.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Serverlogboeken</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Onze hostingprovider (Plesk) slaat standaard serverlogboeken op, zoals IP-adressen en bezochte pagina&apos;s. Deze gegevens zijn anoniem en worden niet door ons gebruikt voor profilering. Ze worden automatisch verwijderd na de bewaartermijn van de provider.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Derde partijen</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75, marginBottom: 16 }}>
              NightGazer maakt gebruik van de volgende externe diensten:
            </p>
            <ul style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 2, paddingLeft: 20 }}>
              <li><strong style={{ color: '#c8d0e0' }}>NASA Open APIs</strong> — voor dagelijkse astronomie-foto&apos;s en afbeeldingen (geen tracking)</li>
              <li><strong style={{ color: '#c8d0e0' }}>Cloudflare</strong> — voor beeldproxy en CDN-diensten; eigen privacybeleid van toepassing</li>
              <li><strong style={{ color: '#c8d0e0' }}>wheretheiss.at</strong> — voor live ISS-positiedata (geen tracking)</li>
              <li><strong style={{ color: '#c8d0e0' }}>Pexels</strong> — voor aanvullende ruimtebeelden (via onze server, niet direct vanuit je browser)</li>
            </ul>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Cookies</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              NightGazer gebruikt geen tracking-cookies of analytische cookies. Er worden geen advertentiecookies geplaatst.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Vragen?</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Vragen over deze privacyverklaring? Neem contact op via{' '}
              <a href="mailto:contact@nightgazer.space" style={{ color: '#378ADD', textDecoration: 'none' }}>contact@nightgazer.space</a>.
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
