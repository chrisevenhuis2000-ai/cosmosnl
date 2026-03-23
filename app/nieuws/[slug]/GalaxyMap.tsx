'use client'

import { useEffect, useRef, useState } from 'react'

interface ArticleNode {
  slug:     string
  title:    string
  category: string
  catColor: string
  emoji:    string
}

interface DrawNode {
  slug:     string
  title:    string
  category: string
  x:        number
  y:        number
  r:        number
}

interface Props {
  currentSlug: string
  compact?: boolean
}

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
}

const CAT_EMOJI: Record<string, string> = {
  'james-webb':    '🔭',
  'kosmologie':    '💫',
  'missies':       '🚀',
  'mars':          '🔴',
  'sterrenkijken': '☄️',
  'educatie':      '⭐',
}

/** Evenly space nodes on a ring with a minimum angular gap. */
function placeOnRing(
  count: number,
  cx: number,
  cy: number,
  r: number,
  offsetAngle = 0,
): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = offsetAngle + (i / count) * Math.PI * 2 - Math.PI / 2
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
  })
}

export default function GalaxyMap({ currentSlug, compact = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef  = useRef<DrawNode[]>([])
  const rafRef    = useRef<number>(0)
  const frameRef  = useRef<number>(0)
  const hovRef    = useRef<string>('')

  const [articles, setArticles] = useState<ArticleNode[]>([])
  const [hovered,  setHovered]  = useState<DrawNode | null>(null)
  const [tooltip,  setTooltip]  = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: ArticleNode[]) => setArticles(data.slice(0, 28)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!articles.length) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width  = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    const cx = W / 2, cy = H / 2

    const currentCat = articles.find(a => a.slug === currentSlug)?.category ?? ''
    const related    = articles.filter(a => a.category === currentCat && a.slug !== currentSlug)
    const others     = articles.filter(a => a.category !== currentCat && a.slug !== currentSlug)

    // ── Place nodes on concentric rings (no random jitter) ───────────────
    const nodes: DrawNode[] = []

    // Centre node — current article
    nodes.push({ slug: currentSlug, title: articles.find(a => a.slug === currentSlug)?.title ?? '', category: currentCat, x: cx, y: cy, r: 14 })

    // Inner ring — related articles
    const innerR  = Math.min(W, H) * 0.26
    const innerPts = placeOnRing(Math.max(related.length, 1), cx, cy, innerR)
    related.forEach((a, i) => {
      nodes.push({ slug: a.slug, title: a.title, category: a.category, x: innerPts[i].x, y: innerPts[i].y, r: 8 })
    })

    // Outer ring — unrelated articles
    const outerR   = Math.min(W, H) * 0.44
    const outerPts = placeOnRing(others.length, cx, cy, outerR, Math.PI / others.length)
    others.forEach((a, i) => {
      nodes.push({ slug: a.slug, title: a.title, category: a.category, x: outerPts[i].x, y: outerPts[i].y, r: 4 })
    })

    nodesRef.current = nodes

    // Background star field (static positions, only alpha twinkle)
    const bgStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 0.8 + 0.2,
      a: Math.random() * 0.35 + 0.05,
      s: Math.random() * 0.005 + 0.001,
      p: Math.random() * Math.PI * 2,
    }))

    function draw() {
      frameRef.current++
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#03060f'
      ctx.fillRect(0, 0, W, H)

      // Vignette
      const vig = ctx.createRadialGradient(cx, cy, H * .15, cx, cy, H * .8)
      vig.addColorStop(0, 'transparent')
      vig.addColorStop(1, 'rgba(3,6,15,0.75)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      // Stars — only alpha twinkling, no movement
      bgStars.forEach(s => {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,210,255,${s.a + .18 * Math.sin(s.p + frameRef.current * s.s)})`
        ctx.fill()
      })

      const cur      = nodes.find(n => n.slug === currentSlug)!
      const hovSlug  = hovRef.current

      // Connector lines from current → related (only)
      nodes.forEach(n => {
        if (n.slug === currentSlug || n.category !== currentCat) return
        const isHov = hovSlug === n.slug
        ctx.beginPath(); ctx.moveTo(cur.x, cur.y); ctx.lineTo(n.x, n.y)
        ctx.strokeStyle  = isHov ? 'rgba(125,211,252,0.55)' : 'rgba(125,211,252,0.12)'
        ctx.lineWidth    = isHov ? 1.2 : 0.7
        ctx.setLineDash(isHov ? [] : [4, 6])
        ctx.shadowBlur   = isHov ? 6 : 0
        ctx.shadowColor  = '#7dd3fc'
        ctx.stroke()
        ctx.setLineDash([]); ctx.shadowBlur = 0

        // Animated travel dot on hovered connection
        if (isHov) {
          const t = (frameRef.current * .012) % 1
          ctx.beginPath()
          ctx.arc(cur.x + (n.x - cur.x) * t, cur.y + (n.y - cur.y) * t, 2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(125,211,252,0.85)'; ctx.shadowBlur = 6; ctx.shadowColor = '#7dd3fc'
          ctx.fill(); ctx.shadowBlur = 0
        }
      })

      // Nodes
      nodes.forEach(n => {
        const isCurrent = n.slug === currentSlug
        const isRelated = n.category === currentCat && !isCurrent
        const isHov     = hovSlug === n.slug
        const color     = CAT_COLORS[n.category] ?? '#7aadff'

        // Pulse only for current node
        const pulse = isCurrent ? 1 + .08 * Math.sin(frameRef.current * .05) : 1
        const r     = n.r * (isCurrent ? pulse : isHov ? 1.35 : 1)

        // Soft glow halo
        if (isCurrent || isRelated || isHov) {
          const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * (isCurrent ? 4 : 3))
          grd.addColorStop(0, color + (isCurrent ? '50' : '28')); grd.addColorStop(1, 'transparent')
          ctx.beginPath(); ctx.arc(n.x, n.y, r * (isCurrent ? 4 : 3), 0, Math.PI * 2)
          ctx.fillStyle = grd; ctx.fill()
        }

        // Node fill
        const cg = ctx.createRadialGradient(n.x - r * .2, n.y - r * .2, 0, n.x, n.y, r)
        cg.addColorStop(0, 'white'); cg.addColorStop(.4, color); cg.addColorStop(1, color + '88')
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle    = cg
        ctx.globalAlpha  = isCurrent ? 1 : isRelated ? .85 : .3
        ctx.shadowBlur   = isCurrent ? 18 : isHov ? 12 : 4
        ctx.shadowColor  = color
        ctx.fill()
        ctx.shadowBlur = 0; ctx.globalAlpha = 1

        // Crosshair on current node
        if (isCurrent) {
          const spike = r * 3
          ctx.strokeStyle = color + '50'; ctx.lineWidth = .8
          ;([[1,0],[0,1]] as Array<[number,number]>).forEach(([dx, dy]) => {
            ctx.beginPath()
            ctx.moveTo(n.x - dx * spike, n.y - dy * spike)
            ctx.lineTo(n.x + dx * spike, n.y + dy * spike)
            ctx.stroke()
          })
        }

        // ── Labels: current node always, others only on hover ────────────
        if (isCurrent) {
          ctx.font      = `600 11px 'DM Mono',monospace`
          ctx.textAlign = 'center'
          ctx.fillStyle = '#f1f5f9'
          const label   = n.title.length > 30 ? n.title.slice(0, 28) + '…' : n.title
          ctx.fillText(label, n.x, n.y + r + 15)
        }
        // Related label on hover — drawn via the tooltip overlay below
      })

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [articles, currentSlug])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    let found: DrawNode | null = null
    for (const n of nodesRef.current) {
      if (n.slug === currentSlug) continue
      const dx = n.x - mx, dy = n.y - my
      if (Math.sqrt(dx * dx + dy * dy) < Math.max(n.r + 10, 16)) { found = n; break }
    }
    hovRef.current = found?.slug ?? ''
    setHovered(found)
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (canvasRef.current) canvasRef.current.style.cursor = found ? 'pointer' : 'default'
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    for (const n of nodesRef.current) {
      if (n.slug === currentSlug) continue
      const dx = n.x - mx, dy = n.y - my
      if (Math.sqrt(dx * dx + dy * dy) < Math.max(n.r + 10, 16)) {
        window.location.href = `/nieuws/${n.slug}`; return
      }
    }
  }

  if (!articles.length) return null
  const currentCat = articles.find(a => a.slug === currentSlug)?.category ?? ''
  const related    = articles.filter(a => a.category === currentCat && a.slug !== currentSlug)
  const canvasHeight = compact ? 260 : 380

  return (
    <div style={compact ? { marginTop: 0 } : { marginTop: 80, borderTop: '1px solid #1c2035' }}>
      {!compact && (
        <div style={{ padding: '28px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4a5278', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ color: CAT_COLORS[currentCat] ?? '#7aadff' }}>✦</span>
              Sterrenveld — Verken gerelateerde artikelen
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '1.1rem', color: '#7a86a8' }}>
              {related.length} gerelateerde artikelen in <span style={{ color: CAT_COLORS[currentCat] ?? '#7aadff' }}>{currentCat}</span>
            </div>
          </div>
          <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.55rem', color: '#2a3050', letterSpacing: '0.1em', textAlign: 'right', lineHeight: 1.8 }}>
            HOVER om te verkennen<br />KLIK om te navigeren
          </div>
        </div>
      )}
      {compact && (
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono,monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: CAT_COLORS[currentCat] ?? '#7aadff', display: 'flex', alignItems: 'center', gap: 8 }}>
          ✦ Sterrenveld
        </div>
      )}
      <div style={{ position: 'relative', width: '100%', height: canvasHeight, borderRadius: compact ? 0 : 8, overflow: 'hidden', border: compact ? 'none' : '1px solid #1c2035' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { hovRef.current = ''; setHovered(null) }}
          onClick={handleClick}
        />
        {/* Hover tooltip */}
        {hovered && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 16, (canvasRef.current?.offsetWidth ?? 300) - 190),
            top: Math.max(tooltip.y - 64, 8),
            background: 'rgba(7,8,13,0.96)',
            border: `1px solid ${CAT_COLORS[hovered.category] ?? '#1c2035'}55`,
            borderRadius: 8, padding: '10px 14px', pointerEvents: 'none',
            maxWidth: 185, backdropFilter: 'blur(8px)', zIndex: 10,
          }}>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.52rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: CAT_COLORS[hovered.category] ?? '#7aadff', marginBottom: 5 }}>
              {CAT_EMOJI[hovered.category] ?? '🌌'} {hovered.category}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '0.92rem', color: '#f1f5f9', lineHeight: 1.3 }}>{hovered.title}</div>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5rem', color: '#4a5278', marginTop: 6 }}>klik om te lezen →</div>
          </div>
        )}
        {/* "Jij bent hier" badge */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          fontFamily: 'DM Mono,monospace', fontSize: '0.52rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: CAT_COLORS[currentCat] ?? '#7aadff',
          background: 'rgba(7,8,13,0.8)',
          border: `1px solid ${CAT_COLORS[currentCat] ?? '#1c2035'}44`,
          padding: '5px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: CAT_COLORS[currentCat] ?? '#7aadff', boxShadow: `0 0 6px ${CAT_COLORS[currentCat] ?? '#7aadff'}` }} />
          Jij bent hier
        </div>
      </div>
    </div>
  )
}
