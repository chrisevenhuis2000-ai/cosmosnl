'use client'

import Link from 'next/link'
import { SiteNav } from '@/app/components/SiteNav'

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <main className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: '#378ADD', textDecoration: 'none' }}>Home</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span>Contact</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 8 }}>
          Contact
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 40 }}>
          We horen graag van je
        </p>

        <div style={{ display: 'grid', gap: 24, maxWidth: 720 }}>
          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Vragen of feedback?</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75, marginBottom: 20 }}>
              Heb je een vraag over de site, ontdekte je een fout in een artikel, of wil je iets melden? We staan open voor suggesties, verbeterpunten en samenwerking.
            </p>
            <a
              href="mailto:contact@nightgazer.space"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(55,138,221,0.1)', border: '1px solid rgba(55,138,221,0.35)', borderRadius: 4, color: '#378ADD', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.background = 'rgba(55,138,221,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(55,138,221,0.35)'; e.currentTarget.style.background = 'rgba(55,138,221,0.1)' }}
            >
              contact@nightgazer.space
            </a>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Bugs &amp; verbeteringen</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              Technische problemen of ideeën voor nieuwe functies kun je melden via GitHub. We reviewen alle meldingen zo snel mogelijk.
            </p>
          </section>

          <section style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '28px 32px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 12 }}>Reactietijd</h2>
            <p style={{ fontSize: '0.88rem', color: '#8A9BC4', lineHeight: 1.75 }}>
              NightGazer is een hobbyproject. We doen ons best om binnen een week te reageren.
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
