'use client'

import { useState, useEffect, useRef } from 'react'
import { LEVELS, type ReadingLevel } from '@/types'
import GalaxyMap from './GalaxyMap'

// ── Types ──────────────────────────────────────────────────────────────────

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
  tags:        string[]
  paragraphs:  string[]
  rawBody:     string
}

interface Enrichment {
  kerncijfers: { value: string; label: string; unit: string }[]
  kernfeiten:  string[]
  quote:       { text: string; author: string } | null
  headings:    string[]
}

interface RelatedItem {
  slug:     string
  title:    string
  category: string
  imageUrl: string
}

// ── Constants ──────────────────────────────────────────────────────────────

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

const LEVEL_COLORS: Record<ReadingLevel, { border: string; bg: string; text: string; dot: string }> = {
  original: { border: '#252858', bg: 'transparent',          text: '#FFFFFF',  dot: '#4A5A8A' },
  beginner: { border: '#c4390a', bg: 'rgba(196,57,10,0.08)', text: '#ffb4a0',  dot: '#e05040' },
  amateur:  { border: '#1a6b4a', bg: 'rgba(26,107,74,0.08)', text: '#90e0b8',  dot: '#3ddf90' },
  pro:      { border: '#2a3a8a', bg: 'rgba(42,58,138,0.08)', text: '#a0b4ff',  dot: '#3dcfdf' },
}

const PROXY = 'https://api.nightgazer.space'
const IMG   = (url: string, w = 800, h = 450) =>
  `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${w}&h=${h}&fit=cover`

// ── Markdown parser ────────────────────────────────────────────────────────

function parseMarkdown(raw: string, slug: string): ArticleData {
  // Normalise line endings (files may use \r\n on Windows)
  raw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  const fm: Record<string, string> = {}
  let body = raw

  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) return
      const key = line.slice(0, colonIdx).trim()
      const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key) fm[key] = val
    })
    body = fmMatch[2]
  }

  // Parse tags array from frontmatter
  let tags: string[] = []
  if (fmMatch) {
    const tagsLine = fmMatch[1].match(/^tags:\s*\[([^\]]*)\]/m)
    if (tagsLine) tags = tagsLine[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  }

  const paragraphs = body
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 30 && !p.startsWith('#') && !p.startsWith('|') && !p.startsWith('---') && !p.startsWith('>'))
    .map(p => p.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^[-*]\s/, ''))

  const category = fm.category || 'Astronomie'
  let date = fm.publishedAt || ''
  if (date) {
    try { date = new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) } catch {}
  }

  return {
    title:       fm.title       || slug.replace(/-/g, ' '),
    category,
    catColor:    CAT_COLORS[category.toLowerCase()] || CAT_COLORS['default'],
    author:      'Redactie NightGazer',
    role:        'NightGazer Redactie',
    date,
    readTime:    parseInt(fm.readTime) || 4,
    imageUrl:    fm.imageUrl    || '',
    imageCredit: fm.imageCredit || '',
    tags:        tags.slice(0, 6),
    paragraphs:  paragraphs.length ? paragraphs : ['Dit artikel wordt geladen...'],
    rawBody:     body,
  }
}

// ── AI enrichment hook ─────────────────────────────────────────────────────

function useEnrich() {
  const cache = useRef<Record<string, Enrichment>>({})

  async function enrich(slug: string, body: string): Promise<Enrichment> {
    if (cache.current[slug]) return cache.current[slug]
    const fallback: Enrichment = { kerncijfers: [], kernfeiten: [], quote: null, headings: [] }
    try {
      const res = await fetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 700,
          messages: [{
            role: 'user',
            content: `Analyseer dit astronomie-artikel en antwoord ALLEEN met geldig JSON:
{
  "kerncijfers": [
    { "value": "compacte waarde", "label": "kort label", "unit": "eenheid/context" }
  ],
  "kernfeiten": ["feit 1 in het Nederlands", "feit 2", "feit 3"],
  "quote": { "text": "opvallende uitspraak of parafrase in het Nederlands", "author": "naam of rol" },
  "headings": ["Sectietitel 1 in het Nederlands", "Sectietitel 2 in het Nederlands"]
}
Regels: kerncijfers exact 3, kernfeiten 3-5, headings exact 2, alles in het Nederlands.

Artikel:
${body.slice(0, 2500)}`,
          }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as Enrichment
        cache.current[slug] = result
        return result
      }
    } catch {}
    cache.current[slug] = fallback
    return fallback
  }

  return { enrich }
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
    if (cache.current[level]) {
      cache.current[level].forEach((t, i) => onUpdate(i, t))
      onDone()
      return
    }
    const results: string[] = Array(paragraphs.length).fill('')
    await Promise.all(paragraphs.map(async (para, idx) => {
      try {
        const res = await fetch(PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001', max_tokens: 800,
            system: LEVELS[level].prompt,
            messages: [{ role: 'user', content: para }],
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
    cache.current[level] = results
    onDone()
  }

  return { rewrite }
}

// ── Level Toggle ───────────────────────────────────────────────────────────

function LevelToggle({ level, loading, onChange }: {
  level: ReadingLevel; loading: boolean; onChange: (l: ReadingLevel) => void
}) {
  const levels = [
    { key: 'original' as ReadingLevel, label: 'Origineel', emoji: '📄' },
    { key: 'beginner' as ReadingLevel, label: 'Beginner',  emoji: '🌱' },
    { key: 'amateur'  as ReadingLevel, label: 'Amateur',   emoji: '🔭' },
    { key: 'pro'      as ReadingLevel, label: 'Pro',       emoji: '🎓' },
  ]
  const dot = LEVEL_COLORS[level].dot
  return (
    <div style={{ position: 'sticky', top: 60, zIndex: 30, background: 'rgba(26,26,46,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #252858', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(16px, 4vw, 40px)', gap: 12 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <span style={{ color: '#e05040' }}>◈</span>
        <span className="toggle-label">Leesniveau</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', background: '#16173A', border: '1px solid #252858', borderRadius: 40, padding: 3, gap: 1, flexShrink: 0 }}>
        {levels.map(({ key, label, emoji }) => (
          <button key={key} onClick={() => onChange(key)} style={{ border: 'none', borderRadius: 36, padding: '5px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', background: level === key ? '#0F1028' : 'transparent', color: level === key ? '#FFFFFF' : '#4A5A8A', boxShadow: level === key ? '0 1px 4px rgba(0,0,0,0.4)' : 'none' }}>
            {emoji} {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#4A5A8A', flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? '#378ADD' : dot, animation: loading ? 'livePulse 1s ease-in-out infinite' : 'none' }} />
        <span className="toggle-status">{loading ? 'AI herschrijft...' : levels.find(l => l.key === level)?.label}</span>
      </div>
    </div>
  )
}

// ── Paragraph block ────────────────────────────────────────────────────────

function Para({ text, isRewritten, level, loading, isLead }: {
  text: string; isRewritten: boolean; level: ReadingLevel; loading: boolean; isLead?: boolean
}) {
  const col = LEVEL_COLORS[level]
  return (
    <p style={{ marginBottom: '1.6em', lineHeight: isLead ? 1.7 : 1.85, fontSize: isLead ? '1.18rem' : '1.05rem', fontWeight: isLead ? 500 : 400, color: isLead ? '#FFFFFF' : 'rgba(255,255,255,0.88)', paddingLeft: isRewritten && level !== 'original' ? 18 : 0, borderLeft: isRewritten && level !== 'original' ? `2px solid ${col.border}` : 'none', opacity: loading ? 0.35 : 1, transition: 'opacity 0.2s, border-color 0.3s, padding-left 0.3s' }}>
      {text || <span style={{ display: 'inline-block', width: '100%', height: '1.2em', background: '#252858', borderRadius: 4 }} />}
    </p>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({ article, enrichment, enrichLoading, readProgress, related, currentSlug }: {
  article: ArticleData
  enrichment: Enrichment | null
  enrichLoading: boolean
  readProgress: number
  related: RelatedItem[]
  currentSlug: string
}) {
  const minsLeft = Math.max(1, Math.round(article.readTime * (1 - readProgress / 100)))

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Voortgang */}
      <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>Voortgang</div>
        <div style={{ padding: 18 }}>
          <div style={{ height: 3, background: '#252858', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${readProgress}%`, background: 'linear-gradient(90deg, #185FA5, #378ADD)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', color: '#4A5A8A' }}>
            {readProgress >= 98 ? '✓ Volledig gelezen' : `~${minsLeft} min resterend`}
          </div>
        </div>
      </div>

      {/* Kerncijfers */}
      <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>Kerncijfers</div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {enrichLoading && !enrichment ? (
            [1, 2, 3].map(i => (
              <div key={i}>
                <div style={{ height: 8, width: '55%', background: '#252858', borderRadius: 2, marginBottom: 7 }} />
                <div style={{ height: 28, width: '40%', background: '#1e2050', borderRadius: 2, marginBottom: 5 }} />
                <div style={{ height: 8, width: '75%', background: '#252858', borderRadius: 2 }} />
              </div>
            ))
          ) : enrichment?.kerncijfers?.length ? (
            enrichment.kerncijfers.map((kc, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 4 }}>{kc.label}</div>
                <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.6rem', fontWeight: 700, color: '#378ADD', lineHeight: 1 }}>{kc.value}</div>
                <div style={{ fontSize: '0.76rem', color: '#8A9BC4', marginTop: 4 }}>{kc.unit}</div>
              </div>
            ))
          ) : (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#252858' }}>Geen cijfers beschikbaar</div>
          )}
        </div>
      </div>

      {/* Newsletter */}
      <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>Nieuwsbrief</div>
        <div style={{ padding: 18 }}>
          <p style={{ fontSize: '0.82rem', color: '#8A9BC4', lineHeight: 1.65, marginBottom: 14 }}>Wekelijks het beste van de sterrenhemel in je inbox.</p>
          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input type="email" placeholder="jouw@email.nl" required autoComplete="email"
              style={{ width: '100%', padding: '10px 14px', background: '#0F1028', border: '1px solid #252858', borderRadius: 2, color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', outline: 'none' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#378ADD')}
              onBlur={e  => (e.currentTarget.style.borderColor = '#252858')}
            />
            <button type="submit"
              style={{ width: '100%', padding: '10px', background: '#378ADD', color: '#fff', border: 'none', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
            >Aanmelden →</button>
          </form>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', color: '#4A5A8A', marginTop: 8 }}>Gratis · Altijd uitschrijfbaar</p>
        </div>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>Gerelateerde artikelen</div>
          <div style={{ padding: '0 18px' }}>
            {related.map((r, i) => (
              <a key={r.slug} href={`/nieuws/${r.slug}`}
                style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < related.length - 1 ? '1px solid #252858' : 'none', textDecoration: 'none', opacity: 1, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {r.imageUrl && (
                  <div style={{ width: 54, height: 40, borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={IMG(r.imageUrl, 108, 80)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 4 }}>{r.category}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* AI Leesniveaus */}
      <div style={{ background: '#12132A', border: '1px solid rgba(55,138,221,0.25)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#378ADD' }}>✦ AI Leesniveaus</div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { emoji: '🌱', label: 'Beginner', desc: 'Metaforen, geen jargon' },
            { emoji: '🔭', label: 'Amateur',  desc: 'Vakjargon met uitleg' },
            { emoji: '🎓', label: 'Pro',      desc: 'Technisch en analytisch' },
          ].map(({ emoji, label, desc }) => (
            <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{emoji}</span>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: '0.76rem', color: '#8A9BC4' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sterrenveld */}
      <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
        <GalaxyMap currentSlug={currentSlug} compact />
      </div>

      {/* Back */}
      <a href="/"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', border: '1px solid #252858', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BC4', textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.color = '#378ADD' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' }}
      >← Alle artikelen</a>
    </aside>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function ArticleClient({ slug }: { slug: string }) {
  const [article,      setArticle]      = useState<ArticleData | null>(null)
  const [level,        setLevel]        = useState<ReadingLevel>('original')
  const [loading,      setLoading]      = useState(false)
  const [texts,        setTexts]        = useState<string[]>([])
  const [enrichment,   setEnrichment]   = useState<Enrichment | null>(null)
  const [enrichLoading,setEnrichLoading]= useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const [related,      setRelated]      = useState<RelatedItem[]>([])
  const [nasaImage,    setNasaImage]    = useState<{ url: string; credit: string } | null>(null)
  const articleRef = useRef<HTMLElement>(null)
  const { rewrite } = useRewrite()
  const { enrich }  = useEnrich()

  // Load article
  useEffect(() => {
    fetch(`/content/articles/${slug}.md`)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.text() })
      .then(raw => {
        const parsed = parseMarkdown(raw, slug)
        setArticle(parsed)
        setTexts(parsed.paragraphs)
        // Start AI enrichment in background
        setEnrichLoading(true)
        enrich(slug, parsed.rawBody).then(e => { setEnrichment(e); setEnrichLoading(false) })
      })
      .catch(() => {
        const fb: ArticleData = { title: slug.replace(/-/g, ' '), category: 'Astronomie', catColor: '#7aadff', author: 'Redactie NightGazer', role: 'NightGazer Redactie', date: '', readTime: 4, imageUrl: '', imageCredit: '', tags: [], paragraphs: ['Dit artikel kon niet worden geladen.'], rawBody: '' }
        setArticle(fb)
        setTexts(fb.paragraphs)
      })
  }, [slug])

  // Load related articles (same category)
  useEffect(() => {
    if (!article) return
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((index: any[]) => {
        const rel = index
          .filter(a => a.slug !== slug && a.category?.toLowerCase() === article.category.toLowerCase())
          .slice(0, 3)
          .map(a => ({ slug: a.slug, title: a.title, category: a.category, imageUrl: a.imageUrl || '' }))
        setRelated(rel)
      })
      .catch(() => {})
  }, [article, slug])

  // Fetch a unique, article-specific NASA image when no imageUrl is set.
  useEffect(() => {
    if (!article || article.imageUrl) return

    // Stop-words: common words that add no image-search value
    const STOP = new Set([
      'a','an','the','of','in','to','for','on','at','by','from','and','or',
      'with','is','are','was','its','it','as','be','do','go','up','no','so',
      'if','live','coverage','how','nasa','esas','nasas',
      'makes','made','launches','launched','ready','preparing','gets','new',
      'returns','second','first','third','next','last','latest','update','updates',
      'invites','selects','selected','catches','finds','found','blog','sols',
      'data','stream','added','daily','minor','plane','bit','wave','rolls',
      'roll','oddly','high','rates','restless','unexpectedly','further',
      'teases','another','shot','ahead','about','will','has','have','had',
      'this','that','then','than','when','where','which',
    ])

    // Deterministic hash → unique page + index per article
    const hash = slug.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0)

    // Keywords from article title (preserves compound tokens like "x-59", "artemis-2")
    const titleKeywords = (article.title || slug.replace(/-/g, ' '))
      .toLowerCase()
      .replace(/[''`'"]/g, '')
      .replace(/[^a-z0-9\-]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => {
        if (!w || w.length < 2) return false
        if (/^[a-z\d]+-\d/.test(w) || /^\d+-[a-z]/.test(w)) return true
        return w.length > 2 && !STOP.has(w)
      })
      .slice(0, 6)
      .join(' ')

    // Tags give more specific search terms than the title alone
    const tagKeywords = (article.tags || [])
      .slice(0, 4)
      .map(t => t.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim())
      .filter(t => t.length > 2 && !STOP.has(t))
      .join(' ')

    // Combined title + tag query (most specific)
    const combinedQuery = [titleKeywords, tagKeywords]
      .filter(Boolean)
      .join(' ')
      .split(/\s+/)
      .filter((w, i, arr) => arr.indexOf(w) === i) // deduplicate
      .slice(0, 7)
      .join(' ')

    // Category fallback queries — specific enough to match NASA image metadata
    const CAT_QUERIES: Record<string, string> = {
      'missies':       'rocket launch spacecraft mission',
      'missions':      'rocket launch spacecraft mission',
      'james-webb':    'james webb space telescope',
      'kosmologie':    'galaxy nebula deep space hubble',
      'cosmology':     'galaxy nebula deep space hubble',
      'mars':          'mars surface curiosity rover',
      'sterrenkijken': 'telescope observatory night sky',
      'observing':     'telescope observatory night sky',
      'educatie':      'astronaut spacewalk earth orbit',
      'education':     'astronaut spacewalk earth orbit',
    }
    const cat      = article.category?.toLowerCase() || ''
    const catQuery = CAT_QUERIES[cat] || 'space telescope astronomy'
    // Try: combined (title+tags) → title-only → category fallback
    const queries  = [combinedQuery, titleKeywords, catQuery].filter((q, i, arr) => q && arr.indexOf(q) === i)

    async function tryFetch(q: string, page: number): Promise<boolean> {
      try {
        const res = await fetch(
          `${PROXY}/image-search?q=${encodeURIComponent(q)}&page=${page}&hash=${hash}`
        )
        if (!res.ok) return false
        const data = await res.json()
        if (!data?.url) return false
        setNasaImage({ url: data.url, credit: data.credit || '' })
        return true
      } catch {}
      return false
    }

    ;(async () => {
      const page = (hash % 3) + 1
      for (const q of queries) {
        if (await tryFetch(q, page)) return
        if (await tryFetch(q, 1))    return
      }
    })()
  }, [article?.imageUrl, article?.tags, article?.title])

  // Reading progress (scroll-based)
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const pct = Math.min(100, Math.max(0, Math.round(((window.innerHeight - top) / (height + window.innerHeight)) * 100)))
      setReadProgress(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLevelChange(newLevel: ReadingLevel) {
    setLevel(newLevel)
    if (newLevel === 'original' || !article) { setTexts(article?.paragraphs || []); return }
    setLoading(true)
    setTexts(article.paragraphs.map(() => ''))
    await rewrite(
      article.paragraphs, newLevel,
      (idx, text) => setTexts(prev => { const n = [...prev]; n[idx] = text; return n }),
      () => setLoading(false),
    )
  }

  if (!article) return (
    <div style={{ background: '#1A1A2E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#4A5A8A', letterSpacing: '0.2em' }}>LADEN...</div>
    </div>
  )

  const col = LEVEL_COLORS[level]

  const displayImageUrl    = article.imageUrl    || nasaImage?.url    || ''
  const displayImageCredit = article.imageCredit || nasaImage?.credit || ''

  // Layout helpers
  const leadPara   = texts[0]
  const section1   = texts.slice(1, 3)   // after heading 1
  const section2   = texts.slice(3, 5)   // after heading 2
  const section3   = texts.slice(5)      // remaining

  const heading0      = enrichment?.headings?.[0]
  const heading1      = enrichment?.headings?.[1]
  const quote         = enrichment?.quote
  const kernfeiten    = enrichment?.kernfeiten
  const showHeadings  = enrichLoading || enrichment

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#1A1A2E; color:#fff; font-family:'Inter',system-ui,sans-serif; }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer   { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        .shimmer { background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.05) 50%,transparent 100%); background-size:600px 100%; animation:shimmer 1.4s infinite linear; }

        .article-layout {
          display:grid; grid-template-columns:1fr 300px; gap:48px;
          max-width:1100px; margin:0 auto; padding:48px 40px 100px; align-items:start;
        }
        .sidebar-sticky { position:sticky; top:120px; }

        @media (max-width:900px) {
          .article-layout { grid-template-columns:1fr; gap:40px; padding:32px 20px 80px; }
          .sidebar-sticky { position:static; }
        }
        @media (max-width:600px) {
          .article-layout { padding:24px 16px 64px; }
          .toggle-label,.toggle-status { display:none; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(26,26,46,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #252858' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 clamp(16px,4vw,40px)', height: 60, gap: 32, maxWidth: 1240, margin: '0 auto' }}>
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

      {/* ── Level Toggle ───────────────────────────────────────────── */}
      <LevelToggle level={level} loading={loading} onChange={handleLevelChange} />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg,#0a1030 0%,${article.catColor}22 60%,#0d1540 100%)` }}>
        <div style={{ height: 'clamp(220px,35vw,420px)', position: 'relative', overflow: 'hidden' }}>
        {displayImageUrl && (
          <img src={IMG(displayImageUrl, 1400, 840)} alt={article.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) saturate(1.1)' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(26,26,46,1) 0%,rgba(26,26,46,0.65) 45%,rgba(26,26,46,0.1) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: article.catColor }} />
        <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, padding: '0 clamp(16px,4vw,40px)', maxWidth: 860 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: article.catColor, border: `1px solid ${article.catColor}50`, padding: '3px 10px', borderRadius: 2 }}>{article.category}</span>
            {article.date && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#8A9BC4' }}>{article.date}</span>}
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#8A9BC4' }}>· Redactie NightGazer</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(55,138,221,0.15)', color: '#B5D4F4', padding: '2px 8px', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem' }}>⏱ {article.readTime} min</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(1.5rem,3.5vw,2.8rem)', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            {article.title}
          </h1>
        </div>
        </div>{/* end inner hero height div */}
        {/* ── Image credit below hero ── */}
        {displayImageCredit && (
          <div style={{ background: 'rgba(10,12,30,0.95)', borderBottom: '1px solid #1a1e40', padding: '5px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', color: '#3A4A70', letterSpacing: '0.08em' }}>📷</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', color: '#3A4A70', letterSpacing: '0.06em' }}>{displayImageCredit}</span>
          </div>
        )}
      </div>

      {/* ── Two-column layout ──────────────────────────────────────── */}
      <div className="article-layout">

        {/* LEFT: Article body */}
        <article ref={articleRef}>

          {/* Author block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 28, borderBottom: '1px solid #252858', marginBottom: 32 }}>
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

          {/* AI level banner */}
          {level !== 'original' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 4, marginBottom: 28, background: col.bg, border: `1px solid ${col.border}`, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.08em', color: col.text }}>
              <span>{LEVELS[level].emoji}</span>
              <span>{LEVELS[level].description} — herschreven door AI</span>
            </div>
          )}

          {/* ── Lead paragraph ── */}
          {leadPara && <Para text={leadPara} isRewritten={level !== 'original'} level={level} loading={loading && !leadPara} isLead />}

          {/* ── Section 1: heading + 2 paragraphs ── */}
          {showHeadings && (
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.55rem', fontWeight: 700, color: '#FFFFFF', margin: '2.2em 0 0.8em', lineHeight: 1.2 }}>
              {heading0
                ? heading0
                : <span style={{ display: 'inline-block', width: '62%', height: '1.4rem', background: '#1e2050', borderRadius: 2 }} className="shimmer" />}
            </h2>
          )}

          {section1.map((text, i) => (
            <Para key={i + 1} text={text} isRewritten={level !== 'original'} level={level} loading={loading && !text} />
          ))}

          {/* ── Kernfeiten fact box ── */}
          {(kernfeiten?.length || enrichLoading) && (
            <div style={{ background: '#12132A', border: '1px solid #252858', borderTop: '3px solid #378ADD', padding: '20px 24px', borderRadius: '0 0 4px 4px', margin: '2.2em 0' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 14 }}>✦ Kernfeiten</div>
              {enrichLoading && !kernfeiten?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3].map(i => <div key={i} style={{ height: 12, background: '#252858', borderRadius: 2 }} className="shimmer" />)}
                </div>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {kernfeiten?.map((feit, i) => (
                    <li key={i} style={{ fontSize: '0.88rem', color: '#8A9BC4', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: '#378ADD', flexShrink: 0, marginTop: 1 }}>→</span>
                      {feit}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Section 2: second heading + 2 paragraphs ── */}
          {showHeadings && (
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.55rem', fontWeight: 700, color: '#FFFFFF', margin: '2.2em 0 0.8em', lineHeight: 1.2 }}>
              {heading1
                ? heading1
                : <span style={{ display: 'inline-block', width: '50%', height: '1.4rem', background: '#1e2050', borderRadius: 2 }} className="shimmer" />}
            </h2>
          )}

          {section2.map((text, i) => (
            <Para key={i + 3} text={text} isRewritten={level !== 'original'} level={level} loading={loading && !text} />
          ))}

          {/* ── Inline image (after section 2) ── */}
          {displayImageUrl && (
            <figure style={{ margin: '2.5em 0' }}>
              <img src={IMG(displayImageUrl, 860, 480)} alt={article.title}
                style={{ width: '100%', borderRadius: 4, display: 'block', filter: 'brightness(0.88)' }}
              />
              <figcaption style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', color: '#4A5A8A', padding: '8px 0', letterSpacing: '0.06em' }}>
                📷 {displayImageCredit || 'NASA'}
              </figcaption>
            </figure>
          )}

          {/* ── Remaining paragraphs ── */}
          {section3.map((text, i) => (
            <Para key={i + 5} text={text} isRewritten={level !== 'original'} level={level} loading={loading && !text} />
          ))}

          {/* ── Pull quote ── */}
          {quote && (
            <blockquote style={{ borderLeft: '3px solid #378ADD', padding: '18px 24px', background: 'rgba(55,138,221,0.06)', borderRadius: '0 4px 4px 0', margin: '2.5em 0' }}>
              <p style={{ fontStyle: 'italic', color: '#B5D4F4', margin: 0, fontSize: '1.08rem', lineHeight: 1.7 }}>"{quote.text}"</p>
              {quote.author && (
                <footer style={{ marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#4A5A8A' }}>
                  — {quote.author}
                </footer>
              )}
            </blockquote>
          )}

          {/* ── Tags ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 52, paddingTop: 24, borderTop: '1px solid #252858' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A' }}>Tags:</span>
            {(article.tags.length ? article.tags : [article.category, 'NightGazer', 'Astronomie']).map(tag => (
              <span key={tag} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', background: 'rgba(55,138,221,0.08)', color: '#B5D4F4', borderRadius: 2, border: '1px solid rgba(55,138,221,0.2)' }}>
                {tag}
              </span>
            ))}
          </div>

          {/* ── Share ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A' }}>Deel:</span>
            {['X / Twitter', 'LinkedIn', 'Kopieer link'].map(label => (
              <button key={label}
                style={{ padding: '6px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid #252858', background: 'transparent', color: '#8A9BC4', borderRadius: 2, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.color = '#378ADD' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' }}
              >{label}</button>
            ))}
          </div>

        </article>

        {/* RIGHT: Sidebar */}
        <div className="sidebar-sticky">
          <Sidebar
            article={article}
            enrichment={enrichment}
            enrichLoading={enrichLoading}
            readProgress={readProgress}
            related={related}
            currentSlug={slug}
          />
        </div>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #252858', background: '#12132A', padding: '20px clamp(16px,4vw,40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#2A3060' }}>© 2026 NightGazer — Astronomie voor iedereen</span>
        <a href="/" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#4A5A8A', textDecoration: 'none' }}>← Terug naar home</a>
      </footer>
    </>
  )
}
