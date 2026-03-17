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
  'james-webb':   '#7aadff',
  'kosmologie':   '#c080ff',
  'cosmology':    '#c080ff',
  'missies':      '#3dcfdf',
  'missions':     '#3dcfdf',
  'mars':         '#ff8a60',
  'sterrenkijken':'#d4a84b',
  'observing':    '#d4a84b',
  'educatie':     '#3ddf90',
  'education':    '#3ddf90',
  'default':      '#7aadff',
}

// ── Parse markdown frontmatter + body ─────────────────────────────────────
function parseMarkdown(raw: string, slug: string): ArticleData {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  const fm: Record<string, string> = {}
  let body = raw

  if (fmMatch) {
    // Parse frontmatter
    fmMatch[1].split('\n').forEach(line => {
      const [key, ...rest] = line.split(':')
      if (key && rest.length) {
        fm[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '')
      }
    })
    body = fmMatch[2]
  }

  // Split body into paragraphs (split on double newline, filter headings/empty)
  const paragraphs = body
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 30 && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('---'))
    .map(p => p.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^[-*]\s/, ''))
    .slice(0, 6)

  const category = fm.category || 'Astronomie'
  const catColor = CAT_COLORS[category.toLowerCase()] || CAT_COLORS['default']

  // Format date
  let date = fm.publishedAt || ''
  if (date) {
    try {
      date = new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {}
  }

  return {
    title:       fm.title       || slug.replace(/-/g, ' '),
    category:    category,
    catColor,
    author:      fm.author      || 'Redactie CosmosNL',
    role:        'CosmosNL Redactie',
    date,
    readTime:    parseInt(fm.readTime) || 4,
    imageUrl:    fm.imageUrl    || '',
    imageCredit: fm.imageCredit || '',
    paragraphs:  paragraphs.length > 0 ? paragraphs : ['Dit artikel wordt geladen...'],
  }
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
    <div style={{ position: 'sticky', top: 60, zIndex: 30, background: 'rgba(12,14,24,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1c2035', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a5278', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#e05040' }}>◈</span> Leesniveau
      </div>
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
    }}>
      {text || <span style={{ display: 'inline-block', width: '100%', height: '1em', background: '#1c2035', borderRadius: 4 }} />}
    </p>
  )
}

// ── Main article page ──────────────────────────────────────────────────────
export default function ArticleClient({ slug }: { slug: string }) {
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [level,   setLevel]   = useState<ReadingLevel>('original')
  const [loading, setLoading] = useState(false)
  const [texts,   setTexts]   = useState<string[]>([])
  const { rewrite } = useRewrite()

  // ── Laad markdown op basis van slug ─────────────────────────────────────
  useEffect(() => {
    fetch(`/content/articles/${slug}.md`)
      .then(r => {
        if (!r.ok) throw new Error('niet gevonden')
        return r.text()
      })
      .then(raw => {
        const parsed = parseMarkdown(raw, slug)
        setArticle(parsed)
        setTexts(parsed.paragraphs)
      })
      .catch(() => {
        // Fallback: laad index om slug te vinden in de ARTICLES array
        setArticle({
          title:       slug.replace(/-/g, ' '),
          category:    'Astronomie',
          catColor:    '#7aadff',
          author:      'Redactie CosmosNL',
          role:        'CosmosNL Redactie',
          date:        '',
          readTime:    4,
          imageUrl:    '',
          imageCredit: '',
          paragraphs:  ['Dit artikel kon niet worden geladen.'],
        })
        setTexts(['Dit artikel kon niet worden geladen.'])
      })
  }, [slug])

  async function handleLevelChange(newLevel: ReadingLevel) {
    setLevel(newLevel)
    if (newLevel === 'original' || !article) {
      setTexts(article?.paragraphs || [])
      return
    }
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
      <div style={{ background: '#07080d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: '#4a5278', letterSpacing: '0.2em' }}>
          LADEN...
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#07080d; color:#dde2f0; font-family:'Syne',sans-serif; }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(7,8,13,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1c2035' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 40px', height: 60, gap: 40, maxWidth: 1240, margin: '0 auto' }}>
          <a href="/" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 700, color: '#f4f6ff', textDecoration: 'none' }}>
            Cosmos<em style={{ fontStyle: 'italic', color: '#d4a84b' }}>NL</em>
          </a>
          <nav style={{ display: 'flex', gap: 24, flex: 1, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278' }}>
            <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>← Terug</a>
          </nav>
        </div>
      </header>

      <LevelToggle level={level} loading={loading} onChange={handleLevelChange} />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 120px' }}>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: col.dot, border: `1px solid ${col.border}`, padding: '3px 10px', borderRadius: 2, transition: 'all 0.3s' }}>
            {article.category}
          </span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.6rem', color: '#4a5278' }}>{article.date} · {article.readTime} min lezen</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.9rem,4.5vw,3rem)', fontWeight: 900, lineHeight: 1.1, color: '#f4f6ff', marginBottom: 22 }}>
          {article.title}
        </h1>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 24, borderBottom: '1px solid #1c2035', marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1c2035', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🔭</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.88rem', color: '#dde2f0' }}>{article.author}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5278' }}>{article.role}</div>
          </div>
        </div>

        {/* Level banner */}
        {level !== 'original' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 4, marginBottom: 24, background: col.bg, border: `1px solid ${col.border}`, fontFamily: 'DM Mono, monospace', fontSize: '0.63rem', letterSpacing: '0.1em', color: col.text }}>
            <span>{LEVELS[level].emoji}</span>
            <span>{LEVELS[level].description} — herschreven door AI</span>
          </div>
        )}

        {/* Hero image */}
        {article.imageUrl && (
          <div style={{ margin: '0 0 36px', position: 'relative', overflow: 'hidden' }}>
            <img
              src={`https://images.weserv.nl/?url=${encodeURIComponent(article.imageUrl)}`}
              alt={article.title}
              style={{ width: '100%', display: 'block', filter: 'brightness(0.88)', borderRadius: 4 }}
            />
            {article.imageCredit && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.58rem', color: '#4a5278', padding: '8px 0', letterSpacing: '0.06em' }}>
                {article.imageCredit}
              </div>
            )}
          </div>
        )}

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

      </main>

      <GalaxyMap currentSlug={slug} />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1c2035', background: '#0c0e18', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono, monospace', fontSize: '0.56rem', color: '#2a3050' }}>
        <span>© 2026 CosmosNL</span>
        <a href="/" style={{ color: '#4a5278', textDecoration: 'none' }}>← Terug naar home</a>
      </footer>
    </>
  )
}