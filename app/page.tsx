'use client'

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
interface APODData {
  title: string
  explanation: string
  url: string
  media_type: string
  copyright?: string
  date: string
}

interface ISSData {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
}

const ARTICLES = [
  {
    slug: 'james-webb-k2-18b-biosignatuur',
    title: 'James Webb vindt mogelijke sporen van leven op K2-18b',
    excerpt: 'De JWST heeft dimethylsulfide gedetecteerd in de atmosfeer van K2-18b — een molecuul dat op Aarde uitsluitend door levende organismen wordt gemaakt.',
    category: 'James Webb',
    catColor: '#7aadff',
    emoji: '🔭',
    author: 'Dr. Mara Visser',
    date: '11 mrt 2026',
    readTime: 6,
    featured: true,
    bgColor: 'linear-gradient(135deg,#0a1030,#1a2860)',
  },
  {
    slug: 'desi-donkere-energie',
    title: 'DESI: donkere energie verzwakt al 4,5 miljard jaar',
    excerpt: 'De grootste 3D kaart van het heelal toont dat de kracht van donkere energie niet constant is — een potentiële revolutie in de kosmologie.',
    category: 'Kosmologie',
    catColor: '#c080ff',
    emoji: '💫',
    author: 'Redactie',
    date: '9 mrt 2026',
    readTime: 5,
    featured: false,
    bgColor: 'linear-gradient(135deg,#0f0520,#1a0a35)',
  },
  {
    slug: 'starship-mechazilla',
    title: 'Starship IFT-7: booster gevangen door Mechazilla',
    excerpt: 'SpaceX\' mechanische arm ving opnieuw de Super Heavy booster op — een mijlpaal voor volledig herbruikbare ruimtevaart.',
    category: 'Missies',
    catColor: '#3dcfdf',
    emoji: '🚀',
    author: 'Redactie',
    date: '7 mrt 2026',
    readTime: 4,
    featured: false,
    bgColor: 'linear-gradient(135deg,#051a20,#0a3040)',
  },
  {
    slug: 'perseverance-mars',
    title: 'Perseverance vindt \'luipaardvlekken\' in Jezero krater',
    excerpt: 'Vreemde geologische patronen op Mars verbazen wetenschappers wereldwijd.',
    category: 'Mars',
    catColor: '#ff8a60',
    emoji: '🔴',
    author: 'Redactie',
    date: '5 mrt 2026',
    readTime: 3,
    featured: false,
    bgColor: 'linear-gradient(135deg,#1a0a05,#3a1510)',
  },
  {
    slug: 'komeet-c2026-a1',
    title: 'Komeet C/2026 A1 mogelijk zichtbaar met blote oog',
    excerpt: 'Astronomen zijn enthousiast over een heldere komeet die in april zichtbaar wordt.',
    category: 'Sterrenkijken',
    catColor: '#d4a84b',
    emoji: '☄️',
    author: 'Redactie',
    date: '3 mrt 2026',
    readTime: 3,
    featured: false,
    bgColor: 'linear-gradient(135deg,#1a1505,#2a2010)',
  },
  {
    slug: 'neutronenster-uitgelegd',
    title: 'Wat is een neutronenster? Uitleg in 3 niveaus',
    excerpt: 'Van makkelijk naar technisch — ons AI-systeem legt het uit op jouw niveau.',
    category: 'Educatie',
    catColor: '#3ddf90',
    emoji: '⭐',
    author: 'Redactie',
    date: '1 mrt 2026',
    readTime: 5,
    featured: false,
    bgColor: 'linear-gradient(135deg,#051a10,#0a2a1a)',
  },
]

// ── Starfield ──────────────────────────────────────────────────────────────
function Starfield() {
  useEffect(() => {
    const canvas = document.getElementById('starfield') as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    const stars = Array.from({ length: 250 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.1 + 0.1,
      o: Math.random() * 0.5 + 0.1,
      s: (Math.random() - 0.5) * 0.015,
    }))
    let raf: number
    function draw() {
      ctx.clearRect(0, 0, W, H)
      stars.forEach(s => {
        s.o += s.s
        if (s.o > 0.65 || s.o < 0.05) s.s *= -1
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(210,220,255,${s.o})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas id="starfield" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ── Header ─────────────────────────────────────────────────────────────────
function Header() {
  const date = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <>
      {/* Topbar */}
      <div style={{ position: 'relative', zIndex: 20, borderBottom: '1px solid #1c2035', display: 'flex', alignItems: 'center', padding: '0 40px', height: 44, gap: 20, background: 'rgba(7,8,13,0.95)', backdropFilter: 'blur(12px)' }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#4a5278', textTransform: 'uppercase' }}>{date}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'ticker 40s linear infinite' }}>
            {['James Webb detecteert DMS op K2-18b', 'SpaceX Starship IFT-8 gepland Q2 2026', 'Vera Rubin Observatory start eerste survey', 'ESA Hera nadert asteroïde Dimorphos'].map((item, i) => (
              <span key={i} style={{ display: 'inline-block', marginRight: 48, fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#4a5278', letterSpacing: '0.06em' }}>
                <span style={{ color: '#3dcfdf', marginRight: 8 }}>●</span>{item}
              </span>
            ))}
            {['James Webb detecteert DMS op K2-18b', 'SpaceX Starship IFT-8 gepland Q2 2026', 'Vera Rubin Observatory start eerste survey', 'ESA Hera nadert asteroïde Dimorphos'].map((item, i) => (
              <span key={`b${i}`} style={{ display: 'inline-block', marginRight: 48, fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#4a5278', letterSpacing: '0.06em' }}>
                <span style={{ color: '#3dcfdf', marginRight: 8 }}>●</span>{item}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#4a5278' }}>
          <a href="/" style={{ color: '#dde2f0' }}>NL</a>
          <a href="/en" style={{ color: '#4a5278' }}>EN</a>
        </div>
      </div>

      {/* Main nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(7,8,13,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1c2035' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 40px', height: 60, gap: 40, maxWidth: 1240, margin: '0 auto' }}>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 700, color: '#f4f6ff' }}>
              Cosmos<em style={{ fontStyle: 'italic', color: '#d4a84b' }}>NL</em>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 28, flex: 1, justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a86a8' }}>
            {['Nieuws', 'Sterrenkijken', 'Missies', 'Educatie'].map(item => (
              <a key={item} href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#dde2f0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7a86a8')}>{item}</a>
            ))}
            {/* ✅ FIX: was hardcoded naar james-webb artikel */}
            <a href="/tools/herschrijver" style={{ color: '#d4a84b', textDecoration: 'none' }}>AI Tools</a>
          </nav>
          <button style={{ background: '#d4a84b', color: '#07080d', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 20px', border: 'none', cursor: 'pointer', clipPath: 'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))' }}>
            Nieuwsbrief
          </button>
        </div>
      </header>
    </>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────
// ✅ FIX: featuredSlug als prop zodat de knop dynamisch is
function Hero({ apod, featuredSlug }: { apod: APODData | null; featuredSlug: string }) {
  return (
    <section style={{ position: 'relative', zIndex: 1, height: '88vh', minHeight: 520, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: '#0c0e18' }}>
        {apod?.media_type === 'image' && (
          <img src={apod.url} alt={apod.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'brightness(0.85) saturate(1.2)' }} />
        )}
        {!apod && (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0c0e18 0%,#111a2a 50%,#0a1020 100%)' }} />
        )}
      </div>

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,8,13,1) 0%, rgba(7,8,13,0.65) 40%, rgba(7,8,13,0.1) 80%, transparent 100%)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '0 40px 56px', maxWidth: 820 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#d4a84b', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 28, height: 1, background: '#d4a84b' }} />
          <span style={{ background: '#e05040', color: '#fff', fontSize: '0.5rem', letterSpacing: '0.15em', padding: '2px 8px', animation: 'livePulse 2s ease-in-out infinite' }}>NASA APOD</span>
          Foto van de dag
        </div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.2rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.08, color: '#f4f6ff', marginBottom: 16 }}>
          {apod?.title || 'Elke dag een nieuw venster op het heelal'}
        </h1>
        <p style={{ fontSize: '1rem', color: '#7a86a8', lineHeight: 1.7, maxWidth: 540, marginBottom: 28 }}>
          {apod ? apod.explanation.slice(0, 180) + '…' : 'NASA publiceert dagelijks de mooiste astronomische foto — wij leggen het uit op jouw niveau.'}
        </p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* ✅ FIX: gebruikt nu de dynamische featuredSlug */}
          <a href={`/nieuws/${featuredSlug}`} style={{ background: '#f4f6ff', color: '#07080d', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', clipPath: 'polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))' }}>
            Lees het artikel →
          </a>
          <a href="#nieuws" style={{ fontSize: '0.7rem', color: '#7a86a8', textDecoration: 'none' }}>Alle nieuws →</a>
        </div>
      </div>

      {apod?.copyright && (
        <div style={{ position: 'absolute', bottom: 14, right: 24, zIndex: 3, fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', color: 'rgba(120,130,160,0.6)' }}>
          © {apod.copyright}
        </div>
      )}
    </section>
  )
}

// ── Article Card ───────────────────────────────────────────────────────────
function ArticleCard({ article, size = 'sm' }: { article: typeof ARTICLES[0]; size?: 'lg' | 'sm' | 'xs' }) {
  const [hovered, setHovered] = useState(false)
  const imgHeight = size === 'lg' ? 320 : size === 'sm' ? 160 : 130

  return (
    <article
      onClick={() => window.location.href = `/nieuws/${article.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? '#111420' : '#0c0e18', overflow: 'hidden', cursor: 'pointer', transition: 'background 0.25s', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ height: imgHeight, background: article.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size === 'lg' ? '4rem' : '2.2rem', overflow: 'hidden', transition: 'transform 0.5s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }}>
        {article.emoji}
      </div>
      <div style={{ padding: size === 'lg' ? 28 : 18, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.catColor, marginBottom: 8 }}>
          {article.category}
        </div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, lineHeight: 1.2, color: '#f4f6ff', fontSize: size === 'lg' ? '1.85rem' : size === 'sm' ? '1.05rem' : '0.9rem', marginBottom: size === 'xs' ? 0 : 10 }}>
          {article.title}
        </div>
        {size !== 'xs' && (
          <p style={{ fontSize: '0.8rem', color: '#7a86a8', lineHeight: 1.6, flex: 1, display: '-webkit-box', WebkitLineClamp: size === 'lg' ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.excerpt}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, fontFamily: 'DM Mono, monospace', fontSize: '0.56rem', color: '#4a5278', letterSpacing: '0.06em' }}>
          {size === 'lg' && <span>{article.author}</span>}
          {size === 'lg' && <span>·</span>}
          <span>{article.date}</span>
          <span>·</span>
          <span>{article.readTime} min</span>
          {hovered && <span style={{ marginLeft: 'auto', color: '#d4a84b' }}>Lees meer →</span>}
        </div>
      </div>
    </article>
  )
}

// ── ISS Widget ─────────────────────────────────────────────────────────────
function ISSWidget({ iss }: { iss: ISSData | null }) {
  const px = iss ? ((iss.longitude + 180) / 360 * 100) : 50
  const py = iss ? ((90 - iss.latitude) / 180 * 100) : 50

  return (
    <div style={{ border: '1px solid #1c2035', background: '#111420', overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #1c2035', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7a86a8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ddf90', animation: 'livePulse 1.5s ease-in-out infinite' }} />
          ISS Live Tracker
        </div>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', color: '#4a5278' }}>Realtime</span>
      </div>

      {/* Map */}
      <div style={{ height: 150, background: '#050810', position: 'relative', overflow: 'hidden', backgroundImage: 'linear-gradient(#1c2035 1px,transparent 1px),linear-gradient(90deg,#1c2035 1px,transparent 1px)', backgroundSize: '40px 40px' }}>
        <div style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, width: 12, height: 12, borderRadius: '50%', background: '#3ddf90', transform: 'translate(-50%,-50%)', boxShadow: '0 0 0 4px rgba(61,223,144,0.2),0 0 16px rgba(61,223,144,0.5)', transition: 'left 2s linear,top 2s linear', zIndex: 2 }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {[
          { val: iss ? `${iss.latitude.toFixed(1)}°` : '—', lbl: 'Breedtegraad' },
          { val: iss ? `${iss.longitude.toFixed(1)}°` : '—', lbl: 'Lengtegraad' },
          { val: iss ? `${Math.round(iss.altitude)} km` : '408 km', lbl: 'Hoogte' },
          { val: '27.6k km/h', lbl: 'Snelheid' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '12px 18px', borderTop: '1px solid #1c2035', borderRight: i % 2 === 0 ? '1px solid #1c2035' : 'none' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 700, color: '#f4f6ff', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278', marginTop: 3 }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [apod, setApod] = useState<APODData | null>(null)
  const [iss,  setIss]  = useState<ISSData | null>(null)

  // ✅ FIX: bepaal de featured article één keer hier, gebruik de slug overal
  const featuredArticle = ARTICLES.find(a => a.featured) ?? ARTICLES[0]

  // Fetch APOD
  useEffect(() => {
    fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#07080d; color:#dde2f0; font-family:'Syne',sans-serif; overflow-x:hidden; }
        a { color:inherit; text-decoration:none; }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <Starfield />
      <Header />
      {/* ✅ FIX: geeft featuredSlug mee aan Hero */}
      <Hero apod={apod} featuredSlug={featuredArticle.slug} />

      {/* Topics strip */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 40px 0' }}>
        <div style={{ display: 'flex', gap: 2, background: '#1c2035', border: '1px solid #1c2035', overflowX: 'auto' }}>
          {['🌌 Alles','🔭 James Webb','🔴 Mars','🚀 Missies','⚫ Zwarte Gaten','🌙 Maan','🌠 Sterrenkijken','🪐 Zonnestelsel','💫 Kosmologie'].map((t, i) => (
            <div key={t} style={{ flexShrink: 0, background: i === 0 ? '#111420' : '#0c0e18', padding: '12px 24px', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: i === 0 ? '#dde2f0' : '#4a5278', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t}{i === 0 && <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#d4a84b', marginLeft: 8, verticalAlign: 'middle' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 40px 100px' }} id="nieuws">

        {/* Section label */}
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4a5278', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          Laatste nieuws
          <div style={{ flex: 1, height: 1, background: '#1c2035' }} />
        </div>

        {/* Article grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 2, background: '#1c2035', border: '1px solid #1c2035', marginBottom: 64 }}>
          <div style={{ gridColumn: 'span 7', gridRow: 'span 2' }}><ArticleCard article={ARTICLES[0]} size="lg" /></div>
          <div style={{ gridColumn: 'span 5' }}><ArticleCard article={ARTICLES[1]} size="sm" /></div>
          <div style={{ gridColumn: 'span 5' }}><ArticleCard article={ARTICLES[2]} size="sm" /></div>
          <div style={{ gridColumn: 'span 4' }}><ArticleCard article={ARTICLES[3]} size="xs" /></div>
          <div style={{ gridColumn: 'span 4' }}><ArticleCard article={ARTICLES[4]} size="xs" /></div>
          <div style={{ gridColumn: 'span 4' }}><ArticleCard article={ARTICLES[5]} size="xs" /></div>
        </div>

        {/* Split: news list + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 64, alignItems: 'start' }}>

          {/* Recent nieuws */}
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4a5278', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
              Recent
              <div style={{ flex: 1, height: 1, background: '#1c2035' }} />
            </div>
            {ARTICLES.map((a, i) => (
              <div key={i} onClick={() => window.location.href = `/nieuws/${a.slug}`}
                style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 16, padding: '18px 0', borderBottom: '1px solid #1c2035', cursor: 'pointer' }}>
                <div style={{ width: 72, height: 72, background: a.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{a.emoji}</div>
                <div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: a.catColor, marginBottom: 4 }}>{a.category}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 600, color: '#f4f6ff', lineHeight: 1.3, marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.53rem', color: '#4a5278' }}>{a.date} · {a.readTime} min lezen</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            <ISSWidget iss={iss} />

            {/* APOD sidebar */}
            {apod && (
              <div style={{ border: '1px solid #1c2035', background: '#111420', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #1c2035', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7a86a8' }}>📸 NASA Foto van de Dag</div>
                {apod.media_type === 'image' && <img src={apod.url} alt={apod.title} style={{ width: '100%', height: 170, objectFit: 'cover', filter: 'brightness(0.85)' }} />}
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.1em', color: '#d4a84b', marginBottom: 5 }}>{new Date(apod.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', fontWeight: 600, color: '#f4f6ff', marginBottom: 6 }}>{apod.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#7a86a8', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{apod.explanation}</div>
                </div>
              </div>
            )}

            {/* AI promo */}
            <div style={{ border: '1px solid #8a6820', background: 'linear-gradient(135deg,#100e05,#1a1508)', padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: 12, top: 8, fontSize: '3.5rem', color: '#8a6820', opacity: 0.15, lineHeight: 1 }}>✦</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d4a84b', marginBottom: 8 }}>✦ AI Feature</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 700, color: '#f4f6ff', marginBottom: 8, lineHeight: 1.2 }}>Lees elk artikel op jouw niveau</div>
              <p style={{ fontSize: '0.76rem', color: '#7a86a8', lineHeight: 1.6, marginBottom: 14 }}>Kies Beginner, Amateur of Pro — onze AI herschrijft het artikel live voor jou.</p>
              {/* ✅ FIX: was hardcoded naar james-webb, nu naar featured artikel */}
              <a href={`/nieuws/${featuredArticle.slug}`} style={{ display: 'block', background: '#d4a84b', color: '#07080d', fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 20px', textAlign: 'center', textDecoration: 'none' }}>
                Probeer het nu →
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1c2035', background: '#0c0e18', padding: '48px 40px', maxWidth: '100%' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 700, color: '#f4f6ff', marginBottom: 12 }}>Cosmos<em style={{ fontStyle: 'italic', color: '#d4a84b' }}>NL</em></div>
            <p style={{ fontSize: '0.8rem', color: '#7a86a8', lineHeight: 1.7, maxWidth: 280 }}>Het Nederlandse astronomie-platform met AI-aangedreven uitleg op jouw niveau. Van beginners tot professionals.</p>
          </div>
          {[
            { title: 'Onderwerpen', links: ['James Webb', 'Mars Exploratie', 'Zwarte Gaten', 'Sterrenkijken', 'Exoplaneten'] },
            { title: 'Tools', links: ['AI Herschrijver', 'ISS Tracker', 'Sterrenkaart', 'Lanceerkalender'] },
            { title: 'Over ons', links: ['Redactie', 'Nieuwsbrief', 'Contact', 'Privacy'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a5278', marginBottom: 14 }}>{col.title}</div>
              {col.links.map(link => (
                <div key={link} style={{ marginBottom: 8 }}><a href="#" style={{ fontSize: '0.8rem', color: '#7a86a8', textDecoration: 'none' }}>{link}</a></div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #1c2035', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.08em', color: '#2a3050' }}>
          <span>© 2026 CosmosNL — Astronomie voor iedereen</span>
          <span>Powered by Claude AI · NASA Open APIs</span>
        </div>
      </footer>
    </>
  )
}