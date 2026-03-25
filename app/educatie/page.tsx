'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Nav links ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: '/nieuws',        label: 'Nieuws' },
  { href: '/sterrenkijken', label: 'Sterrenkijken' },
  { href: '/missies',       label: 'Missies' },
  { href: '/educatie',      label: 'Educatie' },
]

// ── Level system ────────────────────────────────────────────────────────────
const LEVELS = [
  { key: 'beg', label: 'Beginner',  color: '#e05040', border: 'rgba(224,80,64,0.4)',  bg: 'rgba(224,80,64,0.1)',  desc: 'Geen voorkennis nodig. Heldere taal, mooie beelden, pakkende vergelijkingen.' },
  { key: 'ama', label: 'Amateur',   color: '#3ddf90', border: 'rgba(61,223,144,0.4)', bg: 'rgba(61,223,144,0.1)', desc: 'Je kent de basisconcepten. We duiken dieper in met getallen en terminologie.' },
  { key: 'pro', label: 'Pro',       color: '#3dcfdf', border: 'rgba(61,207,223,0.4)', bg: 'rgba(61,207,223,0.1)', desc: 'Wetenschappelijk niveau. Formules, peer-reviewed bronnen, vakjargon.' },
]

// ── Demo concept ────────────────────────────────────────────────────────────
const DEMO_CONCEPT = {
  title: 'Wat is een zwart gat?',
  beg: 'Een zwart gat is een plek in de ruimte waar de zwaartekracht zo sterk is dat zelfs licht er niet meer uit kan ontsnappen. Het ontstaat als een enorme ster aan het einde van zijn leven instort. De grens waarbij er geen terugkeer meer mogelijk is heet de "eventhorizon". Alles wat daarin valt, verdwijnt voor altijd.',
  ama: 'Een zwart gat is een regio in de ruimtetijd met een dusdanig sterke zwaartekrachtspotentiaal dat de ontsnappingssnelheid groter is dan c (lichtsnelheid). Stellaire zwarte gaten ontstaan na de gravitationele collaps van sterren > ~20 M☉. De Schwarzschild-straal Rs = 2GM/c² bepaalt de grootte van de eventhorizon. Supermassieve zwarte gaten (10⁶–10¹⁰ M☉) bevinden zich in de kernen van vrijwel alle grote sterrenstelsels.',
  pro: 'Een Kerr–Newman zwart gat wordt volledig beschreven door drie parameters: massa M, impulsmoment J en lading Q. De ergosphere buiten de Kerr-horizont maakt Penrose-processen mogelijk (energieonttrekking via frame-dragging). Hawking-straling (T_H = ℏc³/8πGMk_B) voorspelt zwarte-gatverdam­ping op tijdschalen τ ∝ M³. Bij SGR A* (M ≈ 4×10⁶ M☉) bevestigt het EHT-beeld de schaduwritmiek binnen GR-voorspellingen.',
}

// ── Learning topics ──────────────────────────────────────────────────────────
const TOPICS = [
  {
    id: 'zonnestelsel', icon: '☀️', title: 'Zonnestelsel',
    color: '#ffa040', bg: 'linear-gradient(135deg,#120a00,#201400)',
    desc: 'Van Mercurius tot de Oort-wolk. Leer de planeten, manen en kleine lichamen kennen.',
    concepts: ['Planetaire beweging', 'Planetaire atmosferen', 'Ringen en manen', 'Dwergplaneten', 'Kometen & asteroïden'],
  },
  {
    id: 'sterren', icon: '⭐', title: 'Sterren & Leven',
    color: '#d4a84b', bg: 'linear-gradient(135deg,#120e00,#1e1600)',
    desc: 'Hoe sterren worden geboren, leven en sterven — en wat ze achterlaten.',
    concepts: ['Hoofdreeks & HR-diagram', 'Kernfusie', 'Supernovae', 'Neutronensterren', 'Zwarte gaten'],
  },
  {
    id: 'sterrenstelsels', icon: '🌌', title: 'Sterrenstelsels',
    color: '#c080ff', bg: 'linear-gradient(135deg,#0e0518,#14082a)',
    desc: 'Melkwegstelsels, bolvormige sterrenhopen en de grootschalige structuur van het heelal.',
    concepts: ['Melkweg structuur', 'Galactische kernen', 'Stelseltypes', 'Botsende stelsels', 'Donkere materie'],
  },
  {
    id: 'kosmologie', icon: '🔭', title: 'Kosmologie',
    color: '#378ADD', bg: 'linear-gradient(135deg,#040a14,#081224)',
    desc: 'De oerknal, uitdijend heelal, donkere energie en het lot van alles.',
    concepts: ['Oerknal theorie', 'Kosmische achtergrondstraling', 'Donkere energie', 'Inflatie', 'Multiversum'],
  },
  {
    id: 'exoplaneten', icon: '🪐', title: 'Exoplaneten',
    color: '#3ddf90', bg: 'linear-gradient(135deg,#041208,#081e10)',
    desc: 'Planeten om andere sterren — en de zoektocht naar buitenaards leven.',
    concepts: ['Detectiemethoden', 'Bewoonbare zone', 'Atmosfeer­analyse', 'Super-Aardes', 'Biosignaturen'],
  },
  {
    id: 'ruimtevaart', icon: '🚀', title: 'Ruimtevaart',
    color: '#3dcfdf', bg: 'linear-gradient(135deg,#041214,#08201e)',
    desc: 'Raketten, ruimtestations, en de ambitieuze missies naar de Maan en Mars.',
    concepts: ['Orbitale mechanica', 'Voortstuwing', 'Leven in de ruimte', 'Maanprogramma\'s', 'Mars kolonisatie'],
  },
]

// ── Key concepts ─────────────────────────────────────────────────────────────
const CONCEPTS = [
  { slug: 'neutronenster-uitgelegd',   icon: '💫', title: 'Neutronenster',    category: 'Sterren',        color: '#d4a84b', desc: 'De extreem compacte overblijfselen van massieve sterren.' },
  { slug: 'desi-donkere-energie',       icon: '🌑', title: 'Donkere Energie',  category: 'Kosmologie',     color: '#c080ff', desc: 'De mysterieuze kracht achter de versnelde uitdijing van het heelal.' },
  { slug: 'james-webb-k2-18b-biosignatuur', icon: '🌍', title: 'Exoplaneten',     category: 'Exoplaneten',    color: '#3ddf90', desc: 'Planeten buiten ons zonnestelsel en de zoektocht naar leven.' },
  { slug: 'starship-mechazilla',        icon: '🚀', title: 'Orbitale Mechanica', category: 'Ruimtevaart',  color: '#3dcfdf', desc: 'Hoe raketten de juiste baan bereiken en terugkeren naar Aarde.' },
]

// ── FAQ items ─────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Moet ik een telescoop hebben om te leren?',   a: 'Nee! Veel van de astronomie-concepten zijn puur theoretisch. Voor sterrenkijken helpt een verrekijker al enorm — maar kennis vereist geen instrument.' },
  { q: 'Wat is het verschil tussen de niveaus?',      a: 'Beginner gebruikt alledaagse taal en vergelijkingen. Amateur voegt getallen en terminologie toe. Pro is wetenschappelijk niveau met formules.' },
  { q: 'Kan ik van niveau wisselen in artikelen?',    a: 'Ja — elke artikel pagina heeft een Beginner / Amateur / Pro knop. Onze AI herschrijft het artikel direct voor jouw niveau.' },
  { q: 'Zijn er Nederlandse bronnen voor meer info?', a: 'Wij zijn het grootste Nederlandse astronomie-platform. Daarnaast zijn NOVA Astronomie en Sterrewacht Leiden uitstekende bronnen.' },
]

// ── Nav component ────────────────────────────────────────────────────────────
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
              const isActive = href === '/educatie'
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

// ── Hero ─────────────────────────────────────────────────────────────────────
function EducatieHero() {
  return (
    <section aria-labelledby="hero-title" style={{ position: 'relative', zIndex: 1, minHeight: '72vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #04060f 0%, #080e20 40%, #06101a 70%, #04080e 100%)' }} />
      {/* Grid */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,40,88,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(37,40,88,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.5) 70%, transparent 100%)' }} />
      {/* Decorative level rings */}
      <div aria-hidden="true" style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 520, height: 520, borderRadius: '50%', border: '1px solid rgba(224,80,64,0.08)', position: 'absolute' }} />
        <div style={{ width: 360, height: 360, borderRadius: '50%', border: '1px solid rgba(61,223,144,0.1)', position: 'absolute' }} />
        <div style={{ width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(61,207,223,0.14)', background: 'radial-gradient(circle, rgba(55,138,221,0.06) 0%, transparent 70%)', position: 'absolute' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(138,155,196,0.3)', textAlign: 'center', lineHeight: 2 }}>
          <div style={{ color: 'rgba(224,80,64,0.4)' }}>BEGINNER</div>
          <div style={{ color: 'rgba(61,223,144,0.4)' }}>AMATEUR</div>
          <div style={{ color: 'rgba(61,207,223,0.4)' }}>PRO</div>
        </div>
      </div>
      {/* Gradients */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0.65) 30%, rgba(26,26,46,0.1) 70%, transparent 100%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(26,26,46,0.75) 0%, transparent 55%)' }} />

      <div className="hero-content-pad animate-fadeUp" style={{ position: 'relative', zIndex: 2, maxWidth: 780 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div aria-hidden="true" style={{ width: 32, height: 1, background: '#3ddf90' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', color: '#3ddf90', textTransform: 'uppercase' }}>Leren</span>
        </div>
        <h1 id="hero-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem,6vw,5rem)', fontWeight: 700, lineHeight: 1.04, color: '#FFFFFF', marginBottom: 20, letterSpacing: '-0.015em' }}>
          Astronomie<br />
          <span style={{ background: 'linear-gradient(135deg, #3ddf90, #378ADD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>op jouw niveau</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520, marginBottom: 36 }}>
          Van de eerste planeet tot kwantumzwaartekracht — elke uitleg is beschikbaar in drie niveaus. Onze AI past elk concept live aan voor jou: Beginner, Amateur of Pro.
        </p>
        {/* Level badges */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
          {LEVELS.map(l => (
            <div key={l.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: `1px solid ${l.border}`, background: l.bg, borderRadius: 2 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0, display: 'block' }} aria-hidden="true" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: l.color }}>{l.label}</span>
            </div>
          ))}
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            { value: '6', label: 'Leerpaden',      color: '#3ddf90' },
            { value: '3', label: 'Niveaus',         color: '#378ADD' },
            { value: '∞', label: 'Artikelen',       color: '#c080ff' },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5A8A', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="#leerpaden" className="btn-clip" style={{ background: '#3ddf90', color: '#04120a', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5aeaa6')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3ddf90')}
          >
            Start leren
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
          <Link href="/tools/herschrijver" style={{ fontSize: '0.72rem', color: '#8A9BC4', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
          >
            AI Herschrijver
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Level demo ───────────────────────────────────────────────────────────────
function LevelDemo() {
  const [active, setActive] = useState<'beg' | 'ama' | 'pro'>('beg')
  const text = active === 'beg' ? DEMO_CONCEPT.beg : active === 'ama' ? DEMO_CONCEPT.ama : DEMO_CONCEPT.pro
  const lvl = LEVELS.find(l => l.key === active)!
  return (
    <section aria-labelledby="level-demo-title" style={{ position: 'relative', zIndex: 1, background: '#12132A', borderTop: '1px solid #252858', borderBottom: '1px solid #252858' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 100% at 100% 50%, rgba(55,138,221,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#378ADD', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden="true" style={{ width: 28, height: 1, background: '#378ADD', display: 'inline-block' }} />
            Hoe werkt het
            <span aria-hidden="true" style={{ width: 28, height: 1, background: '#378ADD', display: 'inline-block' }} />
          </div>
          <h2 id="level-demo-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15 }}>
            Eén concept, drie dieptes
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520 }}>
            Probeer het zelf — wissel van niveau en zie hoe dezelfde uitleg verandert.
          </p>
        </div>

        {/* Demo card */}
        <div style={{ maxWidth: 780, margin: '0 auto', border: '1px solid #252858', background: '#0F1028', overflow: 'hidden', borderRadius: 2 }}>
          {/* Concept header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }} aria-hidden="true">🌑</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: '#FFFFFF' }}>{DEMO_CONCEPT.title}</span>
            </div>
            {/* Level toggle */}
            <div role="group" aria-label="Kies niveau" style={{ display: 'flex', gap: 4 }}>
              {LEVELS.map(l => (
                <button key={l.key} aria-pressed={active === l.key} onClick={() => setActive(l.key as 'beg' | 'ama' | 'pro')} style={{ padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${active === l.key ? l.color : 'rgba(37,40,88,0.8)'}`, color: active === l.key ? l.color : '#4A5A8A', background: active === l.key ? l.bg : 'transparent', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (active !== l.key) { e.currentTarget.style.borderColor = l.border; e.currentTarget.style.color = l.color } }}
                  onMouseLeave={e => { if (active !== l.key) { e.currentTarget.style.borderColor = 'rgba(37,40,88,0.8)'; e.currentTarget.style.color = '#4A5A8A' } }}
                >{l.label}</button>
              ))}
            </div>
          </div>
          {/* Level description bar */}
          <div style={{ padding: '10px 24px', background: lvl.bg, borderBottom: `2px solid ${lvl.color}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: lvl.color, flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.08em', color: lvl.color }}>{lvl.desc}</span>
          </div>
          {/* Content */}
          <div style={{ padding: '28px 24px' }}>
            <p style={{ fontSize: active === 'pro' ? '0.83rem' : '0.92rem', color: '#B5D4F4', lineHeight: 1.85, fontFamily: active === 'pro' ? 'var(--font-mono)' : 'var(--font-sans)' }}>
              {text}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/nieuws/neutronenster-uitgelegd" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#378ADD')}
          >
            Lees een volledig educatief artikel
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Leerpaden ────────────────────────────────────────────────────────────────
function Leerpaden() {
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <section id="leerpaden" aria-labelledby="leerpaden-title" style={{ position: 'relative', zIndex: 1, background: '#1A1A2E' }}>
      <div className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3ddf90', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden="true" style={{ width: 28, height: 1, background: '#3ddf90', display: 'inline-block' }} />
            Leerpaden
          </div>
          <h2 id="leerpaden-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 12 }}>
            Kies je leerpad
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 520 }}>
            Elk leerpad biedt een gestructureerde route door een astronomie-onderwerp — van basis tot expert.
          </p>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2, background: '#252858', border: '1px solid #252858' }}>
          {TOPICS.map(topic => (
            <div key={topic.id} style={{ background: hovered === topic.id ? '#16173A' : '#12132A', transition: 'background 0.25s', cursor: 'pointer', overflow: 'hidden' }}
              onMouseEnter={() => setHovered(topic.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Top accent */}
              <div aria-hidden="true" style={{ height: 2, background: topic.color }} />
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: `1px solid ${topic.color}30`, background: `${topic.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }} aria-hidden="true">
                    {topic.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 4 }}>{topic.title}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: topic.color }}>{topic.concepts.length} onderwerpen</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#8A9BC4', lineHeight: 1.7, marginBottom: 16 }}>{topic.desc}</p>
                {/* Concept pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {topic.concepts.map(c => (
                    <span key={c} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#4A5A8A', background: 'rgba(37,40,88,0.5)', border: '1px solid #252858', padding: '3px 8px', borderRadius: 2 }}>{c}</span>
                  ))}
                </div>
                {/* Read more */}
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Link href={`/nieuws?topic=${topic.title}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: topic.color, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'gap 0.15s' }}
                    onMouseEnter={e => { const svg = e.currentTarget.querySelector('svg'); if (svg) (svg as unknown as HTMLElement).style.transform = 'translateX(3px)' }}
                    onMouseLeave={e => { const svg = e.currentTarget.querySelector('svg'); if (svg) (svg as unknown as HTMLElement).style.transform = 'translateX(0)' }}
                  >
                    Bekijk artikelen
                    <svg width="10" height="10" fill="none" viewBox="0 0 12 12" style={{ transition: 'transform 0.15s' }} aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Kernconcepten ─────────────────────────────────────────────────────────────
function Kernconcepten() {
  return (
    <section aria-labelledby="concepten-title" style={{ position: 'relative', zIndex: 1, background: '#12132A', borderTop: '1px solid #252858' }}>
      <div className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c080ff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span aria-hidden="true" style={{ width: 28, height: 1, background: '#c080ff', display: 'inline-block' }} />
              Uitgelegd
            </div>
            <h2 id="concepten-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 12 }}>
              Kernconcepten
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#8A9BC4', lineHeight: 1.75, maxWidth: 440 }}>
              Elke uitleg is beschikbaar op drie niveaus. Klik een artikel om te beginnen.
            </p>
          </div>
          <Link href="/nieuws" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BC4', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'color 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8A9BC4')}
          >
            Alle artikelen
            <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2, background: '#252858', border: '1px solid #252858' }}>
          {CONCEPTS.map(c => (
            <article key={c.slug}>
              <Link href={`/nieuws/${c.slug}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', color: 'inherit', background: '#12132A', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#16173A')}
                onMouseLeave={e => (e.currentTarget.style.background = '#12132A')}
              >
                {/* Top accent */}
                <div aria-hidden="true" style={{ height: 2, background: c.color, flexShrink: 0 }} />
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.8rem' }} aria-hidden="true">{c.icon}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: c.color, marginBottom: 4 }}>{c.category}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>{c.title}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#8A9BC4', lineHeight: 1.7, flex: 1 }}>{c.desc}</p>
                  {/* Level pills */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {LEVELS.map(l => (
                      <span key={l.key} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: l.color, background: l.bg, border: `1px solid ${l.border}`, padding: '2px 7px', borderRadius: 2 }}>{l.label}</span>
                    ))}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── AI Tools CTA ─────────────────────────────────────────────────────────────
function AIToolsCta() {
  return (
    <section aria-labelledby="ai-cta-title" style={{ position: 'relative', zIndex: 1, background: '#1A1A2E', borderTop: '1px solid #252858' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(55,138,221,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="main-pad" style={{ maxWidth: 'var(--max-w)', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-8)', alignItems: 'stretch' }} className="content-split">
          {/* AI Herschrijver */}
          <div style={{ border: '1px solid rgba(55,138,221,0.3)', background: 'linear-gradient(135deg,rgba(16,17,42,0.95),rgba(20,25,60,0.95))', padding: 32, position: 'relative', overflow: 'hidden', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            <div aria-hidden="true" style={{ position: 'absolute', right: 16, top: 12, fontSize: '5rem', color: '#378ADD', opacity: 0.06, lineHeight: 1, pointerEvents: 'none' }}>⬡</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 16 }}>✦ AI Tool</div>
            <h2 id="ai-cta-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 12 }}>
              AI Herschrijver
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#8A9BC4', lineHeight: 1.75, marginBottom: 20, flex: 1 }}>
              Plak elk astronomie-tekst en laat onze AI het herschrijven op Beginner-, Amateur- of Pro-niveau. Ideaal voor scholieren, studenten én professionals.
            </p>
            <div role="group" aria-label="Niveau opties" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {LEVELS.map(l => (
                <div key={l.key} style={{ flex: 1, padding: '6px 0', fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', border: `1px solid ${l.border}`, color: l.color, background: l.bg, borderRadius: 2 }}>{l.label}</div>
              ))}
            </div>
            <Link href="/tools/herschrijver" className="btn-clip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#378ADD', color: '#1A1A2E', fontFamily: 'var(--font-mono)', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
            >
              Probeer nu
              <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>

          {/* Nieuwsbrief */}
          <div style={{ border: '1px solid rgba(61,223,144,0.2)', background: 'linear-gradient(135deg,rgba(4,18,8,0.95),rgba(8,26,14,0.95))', padding: 32, position: 'relative', overflow: 'hidden', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            <div aria-hidden="true" style={{ position: 'absolute', right: 16, top: 12, fontSize: '5rem', color: '#3ddf90', opacity: 0.06, lineHeight: 1, pointerEvents: 'none' }}>✦</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3ddf90', marginBottom: 16 }}>📬 Nieuwsbrief</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 12 }}>
              Wekelijks leren
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#8A9BC4', lineHeight: 1.75, marginBottom: 20, flex: 1 }}>
              Elke week een educatief astronomie-concept uitgelegd op jouw niveau, plus de nieuwste ontdekkingen en sterrenkijk-tips. Gratis, altijd uitschrijfbaar.
            </p>
            <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap' }}>
              {[['Wekelijks', 'Frequentie'], ['Gratis', 'Altijd']].map(([val, lbl]) => (
                <div key={lbl}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#3ddf90', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>
            <Link href="/nieuwsbrief" className="btn-clip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#3ddf90', color: '#04120a', fontFamily: 'var(--font-mono)', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#5aeaa6')}
              onMouseLeave={e => (e.currentTarget.style.background = '#3ddf90')}
            >
              Aanmelden
              <svg width="12" height="12" fill="none" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section aria-labelledby="faq-title" style={{ position: 'relative', zIndex: 1, background: '#12132A', borderTop: '1px solid #252858' }}>
      <div className="main-pad" style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 14 }}>Veelgestelde vragen</div>
          <h2 id="faq-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15 }}>FAQ</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ border: '1px solid #252858', background: open === i ? '#16173A' : '#0F1028', overflow: 'hidden', transition: 'background 0.2s', borderRadius: 2 }}>
              <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'left' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#FFFFFF', lineHeight: 1.4 }}>{faq.q}</span>
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0, color: '#4A5A8A', transition: 'transform 0.25s', transform: open === i ? 'rotate(45deg)' : 'none' }}>
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {open === i && (
                <div style={{ padding: '0 24px 20px', animation: 'fadeIn 0.2s ease both' }}>
                  <p style={{ fontSize: '0.84rem', color: '#8A9BC4', lineHeight: 1.75 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function SiteFooter() {
  const cols = [
    { title: 'Onderwerpen', links: [['Zonnestelsel', '/nieuws'], ['Sterren & Leven', '/nieuws'], ['Kosmologie', '/nieuws'], ['Exoplaneten', '/nieuws'], ['Ruimtevaart', '/missies']] },
    { title: 'Tools',       links: [['AI Herschrijver', '/tools/herschrijver'], ['Sterrenkijken', '/sterrenkijken'], ['Lanceringskalender', '/missies']] },
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
                { href: '#', label: 'NightGazer op X',         icon: <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M12.6 1h2.4l-5.2 6 6.2 8H12l-3.7-4.9L3.8 15H1.4l5.5-6.3L.8 1H5l3.4 4.5L12.6 1z" /></svg> },
                { href: '#', label: 'NightGazer op Instagram',  icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" width="13" height="13"><rect x="1.5" y="1.5" width="13" height="13" rx="3.5" /><circle cx="8" cy="8" r="3" /><circle cx="11.5" cy="4.5" r="0.7" fill="currentColor" stroke="none" /></svg> },
                { href: '#', label: 'NightGazer op YouTube',    icon: <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M14.5 4.5s-.2-1.2-.7-1.7c-.7-.7-1.4-.7-1.8-.8C10.5 2 8 2 8 2s-2.5 0-4 .1c-.4 0-1.1.1-1.8.8-.5.5-.7 1.7-.7 1.7S1.3 5.9 1.3 7.3v1.3c0 1.4.2 2.8.2 2.8s.2 1.2.7 1.7c.7.7 1.6.7 2 .7C5.5 14 8 14 8 14s2.5 0 4-.1c.4-.1 1.1-.1 1.8-.8.5-.5.7-1.7.7-1.7s.2-1.4.2-2.8V7.3C14.7 5.9 14.5 4.5 14.5 4.5zM6.5 10.2V5.8l4.5 2.2-4.5 2.2z" /></svg> },
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EducatiePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Ga naar hoofdinhoud</a>
      <SiteNav />
      <main id="main-content">
        <EducatieHero />
        <LevelDemo />
        <Leerpaden />
        <Kernconcepten />
        <AIToolsCta />
        <FAQ />
      </main>
      <SiteFooter />
    </>
  )
}
