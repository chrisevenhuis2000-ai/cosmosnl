'use client'

import { useState, useEffect, useRef } from 'react'
import { LEVELS, type ReadingLevel } from '@/types'
import GalaxyMap from './GalaxyMap'

// ── Article data interface ─────────────────────────────────────────────────
interface ArticleData {
  title:       string
  category:    string
  catColor:    string
  author:      string
  role:        string
  date:        string
  readTime:    number
  imageUrl:    string
  imageCredit: string
  paragraphs:  string[]
}

// ── Slug → categorie kleur mapping ────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'james-webb':    '#7aadff',
  'kosmologie':    '#c080ff',
  'cosmology':     '#c080ff',
  'missies':       '#3dcfdf',
  'missions':      '#3dcfdf',
  'mars':          '#ff8a60',
  'sterrenkijken': '#d4a84b',
  'observing':     '#d4a84b',
  'educatie':      '#3ddf90',
  'education':     '#3ddf90',
  'default':       '#7aadff',
}

// ── Parse markdown frontmatter + body ─────────────────────────────────────
function parseMarkdown(raw: string, slug: string): ArticleData {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  const fm: Record<string, string> = {}
  let body = raw

  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const [key, ...rest] = line.split(':')
      if (key && rest.length) {
        fm[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '')
      }
    })
    body = fmMatch[2]
  }

  const paragraphs = body
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 30 && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('---'))
    .map(p => p.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^[-*]\s/, ''))
    .slice(0, 6)

  const category = fm.category || 'Astronomie'
  const catColor  = CAT_COLORS[category.toLowerCase()] || CAT_COLORS['default']

  let date = fm.publishedAt || ''
  if (date) {
    try { date = new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) } catch {}
  }

  return {
    title:       fm.title       || slug.replace(/-/g, ' '),
    category,
    catColor,
    author:      fm.author      || 'Redactie NightGazer',
    role:        'NightGazer Redactie',
    date,
    readTime:    parseInt(fm.readTime) || 4,
    imageUrl:    fm.imageUrl    || '',
    imageCredit: fm.imageCredit || '',
    paragraphs:  paragraphs.length > 0 ? paragraphs : ['Dit artikel wordt geladen...'],
  }
}

// ── Level colours ──────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<ReadingLevel, { border: string; bg: string; text: string; dot: string }> = {
  original: { border: '#252858', bg: 'transparent',          text: '#FFFFFF',  dot: '#4A5A8A' },
  beginner: { border: '#c4390a', bg: 'rgba(196,57,10,0.08)', text: '#ffb4a0',  dot: '#e05040' },
  amateur:  { border: '#1a6b4a', bg: 'rgba(26,107,74,0.08)', text: '#90e0b8',  dot: '#3ddf90' },
  pro:      { border: '#2a3a8a', bg: 'rgba(42,58,138,0.08)', text: '#a0b4ff',  dot: '#3dcfdf' },
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
        const res = await fetch('https://cosmosnl-proxy.chrisevenhuis2000.workers.dev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 800,
            system:     LEVELS[level].prompt,
            messages:   [{ role: 'user', content: para }],
          }),
        })
        const data = await res.json()
        const text = data.content?.[0]?.text || para
        results[idx] = text
        onUpdate(idx, text)
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
    <div style={{
      position: 'sticky', top: 60, zIndex: 30,
      background: 'rgba(26,26,46,0.97)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #252858',
      height: 52, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 clamp(16px, 4vw, 40px)',
      gap: 12,
    }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <span style={{ color: '#e05040' }}>◈</span>
        <span className="toggle-label">Leesniveau</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: '#16173A', border: '1px solid #252858', borderRadius: 40, padding: 3, gap: 1, flexShrink: 0 }}>
        {levels.map(({ key, label, emoji }) => (
          <button key={key} onClick={() => onChange(key)} style={{
            border: 'none', borderRadius: 36, padding: '5px 12px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            background: level === key ? '#0F1028' : 'transparent',
            color: level === key ? '#FFFFFF' : '#4A5A8A',
            boxShadow: level === key ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
          }}>
            {emoji} {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#4A5A8A', flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#378ADD' : col.dot, animation: loading ? 'livePulse 1s ease-in-out infinite' : 'none' }} />
        <span className="toggle-status">{loading ? 'AI herschrijft...' : levels.find(l => l.key === level)?.label}</span>
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
      marginBottom: '1.6em', lineHeight: 1.85, fontSize: '1.05rem',
      color: 'rgba(255,255,255,0.88)',
      paddingLeft: isRewritten && level !== 'original' ? 18 : 0,
      borderLeft: isRewritten && level !== 'original' ? `2px solid ${col.border}` : 'none',
      opacity: loading ? 0.35 : 1,
      transition: 'opacity 0.2s, border-color 0.3s, padding-left 0.3s',
    }}>
      {text || <span style={{ display: 'inline-block', width: '100%', height: '1.2em', background: '#252858', borderRadius: 4 }} />}
    </p>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ article }: { article: ArticleData }) {
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Newsletter */}
      <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>
          Nieuwsbrief
        </div>
        <div style={{ padding: 18 }}>
          <p style={{ fontSize: '0.82rem', color: '#8A9BC4', lineHeight: 1.65, marginBottom: 14 }}>
            Wekelijks het beste van de sterrenhemel in je inbox.
          </p>
          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="email" placeholder="jouw@email.nl" required autoComplete="email"
              style={{ width: '100%', padding: '10px 14px', background: '#0F1028', border: '1px solid #252858', borderRadius: 2, color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', outline: 'none' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#378ADD')}
              onBlur={e => (e.currentTarget.style.borderColor = '#252858')}
            />
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#378ADD', color: '#fff', border: 'none', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
            >
              Aanmelden →
            </button>
          </form>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', color: '#4A5A8A', marginTop: 8 }}>Gratis · Altijd uitschrijfbaar</p>
        </div>
      </div>

      {/* Category info */}
      <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>
          Categorie
        </div>
        <div style={{ padding: 18 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: article.catColor, border: `1px solid ${article.catColor}40`, padding: '6px 14px', borderRadius: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: article.catColor, display: 'inline-block' }} />
            {article.category}
          </span>
        </div>
      </div>

      {/* AI levels info */}
      <div style={{ background: '#12132A', border: '1px solid rgba(55,138,221,0.25)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#378ADD' }}>
          ✦ AI Leesniveaus
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { emoji: '🌱', level: 'Beginner', desc: 'Metaforen, geen jargon' },
            { emoji: '🔭', level: 'Amateur',  desc: 'Vakjargon met uitleg' },
            { emoji: '🎓', level: 'Pro',      desc: 'Technisch en analytisch' },
          ].map(({ emoji, level, desc }) => (
            <div key={level} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{emoji}</span>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 2 }}>{level}</div>
                <div style={{ fontSize: '0.76rem', color: '#8A9BC4' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back to news */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', border: '1px solid #252858', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BC4', textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.color = '#378ADD' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' }}
      >
        ← Alle artikelen
      </a>
    </aside>
  )
}

// ── Main article page ──────────────────────────────────────────────────────
export default function ArticleClient({ slug }: { slug: string }) {
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [level,   setLevel]   = useState<ReadingLevel>('original')
  const [loading, setLoading] = useState(false)
  const [texts,   setTexts]   = useState<string[]>([])
  const { rewrite } = useRewrite()

  useEffect(() => {
    fetch(`/content/articles/${slug}.md`)
      .then(r => { if (!r.ok) throw new Error('niet gevonden'); return r.text() })
      .then(raw => {
        const parsed = parseMarkdown(raw, slug)
        setArticle(parsed)
        setTexts(parsed.paragraphs)
      })
      .catch(() => {
        const fallback: ArticleData = {
          title: slug.replace(/-/g, ' '), category: 'Astronomie', catColor: '#7aadff',
          author: 'Redactie NightGazer', role: 'NightGazer Redactie', date: '', readTime: 4,
          imageUrl: '', imageCredit: '', paragraphs: ['Dit artikel kon niet worden geladen.'],
        }
        setArticle(fallback)
        setTexts(fallback.paragraphs)
      })
  }, [slug])

  async function handleLevelChange(newLevel: ReadingLevel) {
    setLevel(newLevel)
    if (newLevel === 'original' || !article) { setTexts(article?.paragraphs || []); return }
    setLoading(true)
    setTexts(article.paragraphs.map(() => ''))
    await rewrite(
      article.paragraphs,
      newLevel,
      (idx, text) => setTexts(prev => { const n = [...prev]; n[idx] = text; return n }),
      () => setLoading(false),
    )
  }

  const col = LEVEL_COLORS[level]

  if (!article) {
    return (
      <div style={{ background: '#1A1A2E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#4A5A8A', letterSpacing: '0.2em' }}>LADEN...</div>
      </div>
    )
  }

  const heroGradient = article.catColor
    ? `linear-gradient(135deg, #0a1030 0%, ${article.catColor}22 60%, #0d1540 100%)`
    : 'linear-gradient(135deg, #0a1030, #1a2860)'

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #1A1A2E; color: #FFFFFF; font-family: 'Inter', system-ui, sans-serif; }
        @keyframes livePulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }

        .article-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 48px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 40px 100px;
          align-items: start;
        }
        .sidebar-sticky { position: sticky; top: 120px; }

        /* Mobile */
        @media (max-width: 900px) {
          .article-layout {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 32px 20px 80px;
          }
          .sidebar-sticky { position: static; }
        }
        @media (max-width: 600px) {
          .article-layout { padding: 24px 16px 64px; }
          .toggle-label { display: none; }
          .toggle-status { display: none; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(26,26,46,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #252858' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 clamp(16px, 4vw, 40px)', height: 60, gap: 32, maxWidth: 1240, margin: '0 auto' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 46, width: 'auto', display: 'block' }} />
          </a>
          <nav style={{ flex: 1 }}>
            <a href="/" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5A8A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4A5A8A')}
            >← Nieuws</a>
          </nav>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', border: '1px solid rgba(55,138,221,0.3)', padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>
            {article.category}
          </span>
        </div>
      </header>

      {/* ── Level Toggle ───────────────────────────────────────────────── */}
      <LevelToggle level={level} loading={loading} onChange={handleLevelChange} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(220px, 35vw, 380px)', overflow: 'hidden', background: heroGradient }}>
        {article.imageUrl && (
          <img
            src={`https://images.weserv.nl/?url=${encodeURIComponent(article.imageUrl)}`}
            alt={article.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) saturate(1.1)' }}
          />
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,46,1) 0%, rgba(26,26,46,0.6) 50%, rgba(26,26,46,0.1) 100%)' }} />
        {/* Category accent line */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: article.catColor }} />
        {/* Hero text */}
        <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, padding: '0 clamp(16px, 4vw, 40px)', maxWidth: 860 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: article.catColor, border: `1px solid ${article.catColor}50`, padding: '3px 10px', borderRadius: 2 }}>
              {article.category}
            </span>
            {article.date && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#8A9BC4' }}>{article.date}</span>
            )}
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.6rem)', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            {article.title}
          </h1>
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────── */}
      <div className="article-layout">

        {/* ── LEFT: Article body ──────────────────────────────────────── */}
        <article>

          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 24, borderBottom: '1px solid #252858', marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#252858', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🔭</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFFFF', marginBottom: 2 }}>{article.author}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A' }}>{article.role}</div>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#4A5A8A', textAlign: 'right', lineHeight: 1.7 }}>
              {article.date && <div>{article.date}</div>}
              <div>{article.readTime} min lezen</div>
            </div>
          </div>

          {/* AI Level banner */}
          {level !== 'original' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 4, marginBottom: 28, background: col.bg, border: `1px solid ${col.border}`, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.08em', color: col.text }}>
              <span>{LEVELS[level].emoji}</span>
              <span>{LEVELS[level].description} — herschreven door AI</span>
            </div>
          )}

          {/* Image credit (if no full-width hero worked) */}
          {article.imageCredit && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#4A5A8A', marginBottom: 28, letterSpacing: '0.06em' }}>
              Afbeelding: {article.imageCredit}
            </div>
          )}

          {/* Article paragraphs */}
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

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 48, paddingTop: 24, borderTop: '1px solid #252858' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A' }}>Tags:</span>
            {[article.category, 'NightGazer', 'Astronomie'].map(tag => (
              <span key={tag} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', background: 'rgba(55,138,221,0.08)', color: '#B5D4F4', borderRadius: 2, border: '1px solid rgba(55,138,221,0.2)' }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Share */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A' }}>Deel:</span>
            {['X / Twitter', 'LinkedIn', 'Kopieer link'].map(label => (
              <button key={label} style={{ padding: '6px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid #252858', background: 'transparent', color: '#8A9BC4', borderRadius: 2, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.color = '#378ADD' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' }}
              >{label}</button>
            ))}
          </div>

        </article>

        {/* ── RIGHT: Sidebar ──────────────────────────────────────────── */}
        <div className="sidebar-sticky">
          <Sidebar article={article} />
        </div>

      </div>

      <GalaxyMap currentSlug={slug} />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #252858', background: '#12132A', padding: '20px clamp(16px, 4vw, 40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#2A3060' }}>© 2026 NightGazer — Astronomie voor iedereen</span>
        <a href="/" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#4A5A8A', textDecoration: 'none' }}>← Terug naar home</a>
      </footer>
    </>
  )
}
