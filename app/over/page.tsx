'use client'

import Link from 'next/link'
import { SiteNav } from '@/app/components/SiteNav'

export default function OverPage() {
  return (
    <>
      <SiteNav />
      <main className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto', paddingTop: 48, paddingBottom: 80 }}>
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
