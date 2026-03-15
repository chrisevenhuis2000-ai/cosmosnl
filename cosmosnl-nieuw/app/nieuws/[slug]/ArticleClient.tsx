'use client'

import { useState, useEffect, useRef } from 'react'
import { LEVELS, type ReadingLevel } from '@/types'

// ── Artikel data (later via getArticles() uit markdown) ────────────────────
const ARTICLE = {
  title:       'James Webb vindt mogelijke sporen van leven op planeet K2-18b',
  category:    'James Webb · Exoplaneten',
  catColor:    '#7aadff',
  author:      'Dr. Mara Visser',
  role:        'Astrofysica redacteur',
  date:        '11 maart 2026',
  readTime:    6,
  imageUrl:    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Exoplanet_K2-18b_%28artist%27s_impression%29.jpg/1280px-Exoplanet_K2-18b_%28artist%27s_impression%29.jpg',
  imageCredit: 'ESA/Hubble, M. Kornmesser',
  paragraphs: [
    'In maart 2025 publiceerde het James Webb Space Telescope-team nieuwe spectroscopische observaties van K2-18b — een zogenaamde \'hycean wereld\' op 120 lichtjaar afstand in het sterrenbeeld Leeuw. De data, verkregen via het NIRSpec-instrument, toont een statistisch significante absorptielijn die overeenkomt met dimethylsulfide (DMS), een zwavelhoudend organisch molecuul.',
    'Op Aarde wordt DMS vrijwel uitsluitend geproduceerd door fytoplankton en andere mariene micro-organismen als bijproduct van het metabolisme van zwavelverbindingen. In de atmosfeer van K2-18b werd DMS eerder ook al tentatieven waargenomen in 2023-data, maar het nieuwe signaal is ruwweg drie keer zo sterk en nadert de 3σ-drempel voor wetenschappelijke significantie.',
    'K2-18b bevindt zich in de bewoonbare zone van zijn rode dwergster K2-18. Met een straal van circa 2,6 keer die van de Aarde en een massa van ongeveer 8,6 aardmassa\'s valt de planeet in de categorie \'mini-Neptunus\' of, wanneer een oceaan wordt aangenomen, een \'hycean wereld\' — een hypothetische klasse planeten met een diepglobale waterige oceaan onder een waterstofrijke atmosfeer.',
    'Toch blijft scepsis op zijn plaats. Diverse astrofysici wijzen erop dat DMS ook abiotisch kan worden gevormd in waterstofrijke atmosferen via fotochemische processen. Bovendien ligt het signaal nog ruim onder de gouden standaard van 5σ, de drempel waarbij de wetenschappelijke gemeenschap over het algemeen een ontdekking als vastgesteld beschouwt. Vervolgobservaties met JWST zijn gepland voor 2026.',
    'Het onderzoek benadrukt eens te meer het enorme potentieel van atmosferische spectroscopie met JWST voor de karakterisering van exoplaneetatmosferen. Waar de Hubble Space Telescope slechts rudimentaire atmosferische vingerafdrukken kon vastleggen, opent JWST een nieuw tijdperk van moleculaire detectie — met implicaties die de astrobiologie fundamenteel kunnen hervormen.',
  ],
}

// ── Level colours ──────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<ReadingLevel, { border: string; bg: string; text: string; dot: string }> = {
  original: { border: '#1c2035', bg: 'transparent',             text: '#dde2f0', dot: '#4a5278' },
  beginner: { border: '#c4390a', bg: 'rgba(196,57,10,0.06)',    text: '#ffb4a0', dot: '#e05040' },
  amateur:  { border: '#1a6b4a', bg: 'rgba(26,107,74,0.06)',    text: '#90e0b8', dot: '#3ddf90' },
  pro:      { border: '#2a3a8a', bg: 'rgba(42,58,138,0.06)',    text: '#a0b4ff', dot: '#3dcfdf' },
}

// ── Rewrite hook ───────────────────────────────────────────────────────────
function useRewrite() {
  const cache = useRef<Record<string, string[]>>({})

  async function rewrite(
    paragraphs: string[],
    level: ReadingLevel,
    onUpdate: (idx: number, text: string) => void,
    onDone: () => void,
  ) {
    const key = level
    if (cache.current[key]) {
      cache.current[key].forEach((t, i) => onUpdate(i, t))
      onDone()
      return
    }

    const results: string[] = Array(paragraphs.length).fill('')

    await Promise.all(paragraphs.map(async (para, idx) => {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model:      'claude-sonnet-4-20250514',
            max_tokens: 800,
            stream:     true,
            system:     LEVELS[level].prompt,
            messages:   [{ role: 'user', content: para }],
          }),
        })

        const reader  = res.body!.getReader()
        const decoder = new TextDecoder()
        let text = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.delta?.text) {
                text += parsed.delta.text
                onUpdate(idx, text)
              }
            } catch {}
          }
        }
        results[idx] = text
      } catch {
        results[idx] = para
        onUpdate(idx, para)
      }
    }))

    cache.current[key] = results
    onDone()
  }

  return { rewrite }
}

// ── Level Toggle ───────────────────────────────────────────────────────────
function LevelToggle({ level, loading, onChange }: {
  level: ReadingLevel
  loading: boolean
  onChange: (l: ReadingLevel) => void
}) {
  const levels: { key: ReadingLevel; label: string; emoji: string }[] = [
    { key: 'original', label: 'Origineel', emoji: '📄' },
    { key: 'beginner', label: 'Beginner',  emoji: '🌱' },
    { key: 'amateur',  label: 'Amateur',   emoji: '🔭' },
    { key: 'pro',      label: 'Pro',       emoji: '🎓' },
  ]

  const col = LEVEL_COLORS[level]

  return (
    <div style={{ position: 'sticky', top: 60, zIndex: 30, background: 'rgba(12,14,24,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1c2035', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>

      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a5278', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#e05040' }}>◈</span> Leesniveau
      </div>

      {/* Toggle pill */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#111420', border: '1px solid #1c2035', borderRadius: 40, padding: 3, gap: 2 }}>
        {levels.map(({ key, label, emoji }) => (
          <button key={key} onClick={() => onChange(key)} style={{
            border: 'none', borderRadius: 36, padding: '6px 16px',
            fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.25s',
            background: level === key ? '#0c0e18' : 'transparent',
            color: level === key ? '#f4f6ff' : '#4a5278',
            boxShadow: level === key ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
          }}>
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#4a5278', minWidth: 130, justifyContent: 'flex-end' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#d4a84b' : col.dot, animation: loading ? 'livePulse 1s ease-in-out infinite' : 'none' }} />
        {loading ? 'AI herschrijft...' : levels.find(l => l.key === level)?.label + ' versie'}
      </div>
    </div>
  )
}

// ── Paragraph block ────────────────────────────────────────────────────────
function ParagraphBlock({ text, isRewritten, level, loading }: {
  text: string; isRewritten: boolean; level: ReadingLevel; loading: boolean
}) {
  const col = LEVEL_COLORS[level]
  return (
    <p style={{
      marginBottom: '1.5em', lineHeight: 1.8, fontSize: '1.05rem',
      paddingLeft: isRewritten && level !== 'original' ? 18 : 0,
      borderLeft: isRewritten && level !== 'original' ? `2px solid ${col.border}` : 'none',
      opacity: loading ? 0.35 : 1,
      transition: 'opacity 0.2s, border-color 0.3s, padding-left 0.3s',
      position: 'relative',
    }}>
      {text || <span style={{ display: 'inline-block', width: '100%', height: '1em', background: '#1c2035', borderRadius: 4, animation: 'shimmer 1.2s infinite linear' }} />}
    </p>
  )
}

// ── Main article page ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ArticleClient({ slug }: { slug: string }) {
  const [level,   setLevel]   = useState<ReadingLevel>('original')
  const [loading, setLoading] = useState(false)
  const [texts,   setTexts]   = useState<string[]>(ARTICLE.paragraphs)
  const { rewrite } = useRewrite()

  async function handleLevelChange(newLevel: ReadingLevel) {
    setLevel(newLevel)
    if (newLevel === 'original') {
      setTexts(ARTICLE.paragraphs)
      return
    }
    setLoading(true)
    const updated = [...ARTICLE.paragraphs]
    setTexts(updated.map(() => '')) // clear for shimmer
    await rewrite(
      ARTICLE.paragraphs,
      newLevel,
      (idx, text) => setTexts(prev => { const n = [...prev]; n[idx] = text; return n }),
      ()         => setLoading(false),
    )
  }

  const col = LEVEL_COLORS[level]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Syne:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#07080d; color:#dde2f0; font-family:'Syne',sans-serif; }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
      `}</style>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(7,8,13,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1c2035' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 40px', height: 60, gap: 40, maxWidth: 1240, margin: '0 auto' }}>
          <a href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 700, color: '#f4f6ff', textDecoration: 'none' }}>
            Cosmos<em style={{ fontStyle: 'italic', color: '#d4a84b' }}>NL</em>
          </a>
          <nav style={{ display: 'flex', gap: 24, flex: 1, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278' }}>
            <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>← Terug</a>
            <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Nieuws</a>
          </nav>
        </div>
      </header>

      {/* Level toggle sticky bar */}
      <LevelToggle level={level} loading={loading} onChange={handleLevelChange} />

      {/* Article */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 120px' }}>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: col.dot, border: `1px solid ${col.border}`, padding: '3px 10px', borderRadius: 2, transition: 'all 0.3s' }}>
            {ARTICLE.category}
          </span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#4a5278' }}>{ARTICLE.date} · {ARTICLE.readTime} min lezen</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.9rem,4.5vw,3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.01em', color: '#f4f6ff', marginBottom: 22 }}>
          {ARTICLE.title}
        </h1>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 24, borderBottom: '1px solid #1c2035', marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1c2035', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🔭</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.88rem', color: '#dde2f0' }}>{ARTICLE.author}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278' }}>{ARTICLE.role}</div>
          </div>
        </div>

        {/* Level banner */}
        {level !== 'original' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 4, marginBottom: 24, background: col.bg, border: `1px solid ${col.border}`, fontFamily: 'DM Mono, monospace', fontSize: '0.63rem', letterSpacing: '0.1em', color: col.text, animation: 'fadeIn 0.3s ease' }}>
            <span>{LEVELS[level].emoji}</span>
            <span>{LEVELS[level].description} — herschreven door AI</span>
          </div>
        )}

        {/* Hero image */}
        <div style={{ margin: '0 -48px 36px', position: 'relative', overflow: 'hidden' }}>
          <img src={ARTICLE.imageUrl} alt={ARTICLE.title} style={{ width: '100%', display: 'block', filter: 'brightness(0.88)' }} />
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#4a5278', padding: '8px 0', letterSpacing: '0.06em' }}>
            {ARTICLE.imageCredit}
          </div>
        </div>

        {/* Data strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: '1px solid #1c2035', marginBottom: 36 }}>
          {[
            { num: '120', lbl: 'Lichtjaar afstand' },
            { num: '2.6×', lbl: 'Grootte vs. Aarde' },
            { num: '33d', lbl: 'Omlooptijd ster' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 20px', textAlign: 'center', borderRight: i < 2 ? '1px solid #1c2035' : 'none', background: '#0c0e18' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.9rem', fontWeight: 700, color: '#f4f6ff', display: 'block' }}>{s.num}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Article body */}
        <div>
          {texts.map((text, idx) => (
            <ParagraphBlock
              key={idx}
              text={text}
              isRewritten={level !== 'original'}
              level={level}
              loading={loading && !text}
            />
          ))}
        </div>

        {/* Pull quote */}
        <blockquote style={{ margin: '36px -16px', padding: '24px 28px', background: '#0c0e18', borderLeft: `4px solid ${col.dot || '#1c2035'}`, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontStyle: 'italic', lineHeight: 1.6, color: '#b0b8d0', transition: 'border-color 0.3s' }}>
          "Als dit DMS-signaal bevestigd wordt, zou het de eerste indirecte aanwijzing zijn voor biologische processen buiten ons zonnestelsel."
          <footer style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', fontStyle: 'normal', color: '#4a5278', marginTop: 10 }}>— Prof. Nikku Madhusudhan, Cambridge University</footer>
        </blockquote>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1c2035', background: '#0c0e18', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono, monospace', fontSize: '0.56rem', color: '#2a3050' }}>
        <span>© 2026 CosmosNL</span>
        <span>Powered by Claude AI · NASA Open APIs</span>
      </footer>
    </>
  )
}

