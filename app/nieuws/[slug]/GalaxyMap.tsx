'use client'

import { useEffect, useRef, useState } from 'react'

interface ArticleNode {
  slug:     string
  title:    string
  category: string
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

/** Constellation arm angles — irregular, like real star charts */
const ARM_ANGLES = [
  -70,   // upper-right
   20,   // right
  105,   // lower-right
  195,   // lower-left
  280,   // upper-left
]

const ARM_DIST = [0.34, 0.38, 0.32, 0.37, 0.35] // fraction of min(W,H)

export default function GalaxyMap({ currentSlug, compact = false }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number>(0)
  const frameRef   = useRef<number>(0)
  const hovRef     = useRef<string>('')
  const nodesRef   = useRef<Array<{ slug: string; title: string; x: number; y: number; r: number; color: string }>>([])

  const [articles, setArticles] = useState<ArticleNode[]>([])
  const [hovered,  setHovered]  = useState<string>('')
  const [tooltip,  setTooltip]  = useState<{ x: number; y: number; title: string; slug: string } | null>(null)

  useEffect(() => {
    fetch('/content/articles-index.json')
      .then(r => r.json())
      .then((data: ArticleNode[]) => setArticles(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!articles.length) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const W = canvas.width  = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    const cx = W / 2
    const cy = H / 2 + (compact ? 0 : -10)

    const currentCat   = articles.find(a => a.slug === currentSlug)?.category ?? ''
    const currentColor = CAT_COLORS[currentCat] ?? '#7aadff'

    // Pick up to 5 related articles
    const related = articles
      .filter(a => a.category === currentCat && a.slug !== currentSlug)
      .slice(0, 5)

    // Build node positions
    const nodes: typeof nodesRef.current = [
      { slug: currentSlug, title: articles.find(a => a.slug === currentSlug)?.title ?? '', x: cx, y: cy, r: 9, color: currentColor },
    ]
    related.forEach((a, i) => {
      const angleDeg = ARM_ANGLES[i]
      const rad = (angleDeg * Math.PI) / 180
      const dist = ARM_DIST[i] * Math.min(W, H)
      nodes.push({
        slug:  a.slug,
        title: a.title,
        x:     cx + Math.cos(rad) * dist,
        y:     cy + Math.sin(rad) * dist,
        r:     6,
        color: CAT_COLORS[a.category] ?? '#7aadff',
      })
    })
    nodesRef.current = nodes

    // Static background stars with subtle twinkle phase
    const bgStars = Array.from({ length: 180 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.9 + 0.15,
      a: Math.random() * 0.4 + 0.08,
      s: Math.random() * 0.004 + 0.001,
      p: Math.random() * Math.PI * 2,
    }))

    // Tiny extra stars along the constellation arms (gives Milky Way depth)
    const armDust = related.map((_, i) => {
      const pts: Array<{ x: number; y: number; a: number }> = []
      const angleDeg = ARM_ANGLES[i]
      const rad = (angleDeg * Math.PI) / 180
      const dist = ARM_DIST[i] * Math.min(W, H)
      for (let t = 0; t < 6; t++) {
        const f = (t + 1) / 7
        pts.push({
          x: cx + Math.cos(rad) * dist * f + (Math.random() - .5) * 14,
          y: cy + Math.sin(rad) * dist * f + (Math.random() - .5) * 10,
          a: Math.random() * 0.22 + 0.04,
        })
      }
      return pts
    })

    function wrapTitle(title: string, maxChars: number): string[] {
      const words = title.split(' ')
      const lines: string[] = []
      let line = ''
      for (const w of words) {
        if ((line + ' ' + w).trim().length > maxChars) {
          if (line) lines.push(line)
          line = w
        } else {
          line = (line + ' ' + w).trim()
        }
      }
      if (line) lines.push(line)
      return lines.slice(0, 2) // max 2 lines
    }

    function draw() {
      frameRef.current++
      ctx.clearRect(0, 0, W, H)

      // Deep space background
      ctx.fillStyle = '#020510'
      ctx.fillRect(0, 0, W, H)

      // Subtle vignette
      const vig = ctx.createRadialGradient(cx, cy, H * .1, cx, cy, H * .9)
      vig.addColorStop(0, 'transparent')
      vig.addColorStop(1, 'rgba(1,2,8,0.85)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      // Background star field
      bgStars.forEach(s => {
        const alpha = s.a + 0.15 * Math.sin(s.p + frameRef.current * s.s)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${alpha.toFixed(3)})`
        ctx.fill()
      })

      // Arm dust (tiny stars along the lines)
      armDust.forEach(pts =>
        pts.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 0.7, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(160,200,255,${p.a})`
          ctx.fill()
        })
      )

      const hovSlug = hovRef.current
      const cur = nodes[0]

      // ── Constellation lines ──────────────────────────────────────────────
      nodes.slice(1).forEach(n => {
        const isHov = hovSlug === n.slug
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(cur.x, cur.y)
        ctx.lineTo(n.x, n.y)
        ctx.strokeStyle = isHov
          ? `rgba(200,220,255,0.55)`
          : `rgba(200,220,255,0.14)`
        ctx.lineWidth = isHov ? 1.2 : 0.7
        ctx.setLineDash([])
        ctx.shadowBlur  = isHov ? 8 : 0
        ctx.shadowColor = 'rgba(200,220,255,0.8)'
        ctx.stroke()
        ctx.restore()

        // Animated travel dot along hovered line
        if (isHov) {
          const t = (frameRef.current * .010) % 1
          ctx.beginPath()
          ctx.arc(
            cur.x + (n.x - cur.x) * t,
            cur.y + (n.y - cur.y) * t,
            1.8, 0, Math.PI * 2
          )
          ctx.fillStyle = 'rgba(220,235,255,0.9)'
          ctx.shadowBlur = 6; ctx.shadowColor = '#fff'
          ctx.fill(); ctx.shadowBlur = 0
        }
      })

      // ── Draw nodes ───────────────────────────────────────────────────────
      nodes.forEach((n, idx) => {
        const isCurrent = idx === 0
        const isHov     = hovSlug === n.slug
        const pulse     = isCurrent ? 1 + .06 * Math.sin(frameRef.current * .045) : 1
        const r         = n.r * pulse * (isHov && !isCurrent ? 1.4 : 1)

        // Diffraction spike on current star
        if (isCurrent) {
          const spike = r * 5
          ctx.save()
          ctx.strokeStyle = n.color + '40'
          ctx.lineWidth = 0.8
          ;[[1, 0], [0, 1], [0.7, 0.7], [-0.7, 0.7]].forEach(([dx, dy]) => {
            ctx.beginPath()
            ctx.moveTo(n.x - dx * spike, n.y - dy * spike)
            ctx.lineTo(n.x + dx * spike, n.y + dy * spike)
            ctx.stroke()
          })
          ctx.restore()
        }

        // Outer glow halo
        const haloR = r * (isCurrent ? 5 : isHov ? 4 : 3)
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR)
        grd.addColorStop(0, n.color + (isCurrent ? '45' : '25'))
        grd.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Star core — white-hot centre → colour rim
        const cg = ctx.createRadialGradient(n.x - r * .25, n.y - r * .25, 0, n.x, n.y, r)
        cg.addColorStop(0, '#ffffff')
        cg.addColorStop(0.35, n.color)
        cg.addColorStop(1, n.color + 'aa')
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = cg
        ctx.globalAlpha = isCurrent ? 1 : 0.88
        ctx.shadowBlur  = isCurrent ? 22 : isHov ? 14 : 7
        ctx.shadowColor = n.color
        ctx.fill()
        ctx.shadowBlur = 0; ctx.globalAlpha = 1

        // ── Label ────────────────────────────────────────────────────────
        const lines = wrapTitle(n.title, isCurrent ? 26 : 22)
        const fSize = isCurrent ? 11 : 9.5
        ctx.font      = `${isCurrent ? 600 : 400} ${fSize}px 'DM Mono',monospace`
        ctx.textAlign = 'center'

        // Label below node; if too close to bottom, put it above
        const labelY = n.y + r + fSize + 4
        const startY = labelY > H - 20 ? n.y - r - (lines.length * (fSize + 3)) - 2 : labelY

        lines.forEach((line, li) => {
          const lx = n.x
          const ly = startY + li * (fSize + 3)
          // Subtle text shadow for legibility
          ctx.fillStyle = 'rgba(2,5,16,0.7)'
          ctx.fillText(line, lx + 1, ly + 1)
          ctx.fillStyle = isCurrent
            ? '#e8eeff'
            : isHov
            ? '#c8d8ff'
            : '#7a90b8'
          ctx.fillText(line, lx, ly)
        })
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [articles, currentSlug, compact])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx   = e.clientX - rect.left
    const my   = e.clientY - rect.top
    let found: typeof nodesRef.current[0] | null = null
    for (const n of nodesRef.current.slice(1)) {
      const dx = n.x - mx, dy = n.y - my
      if (Math.sqrt(dx * dx + dy * dy) < Math.max(n.r + 14, 20)) { found = n; break }
    }
    hovRef.current = found?.slug ?? ''
    setHovered(found?.slug ?? '')
    if (found) {
      setTooltip({ x: mx, y: my, title: found.title, slug: found.slug })
    } else {
      setTooltip(null)
    }
    if (canvasRef.current) canvasRef.current.style.cursor = found ? 'pointer' : 'default'
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    for (const n of nodesRef.current.slice(1)) {
      const dx = n.x - mx, dy = n.y - my
      if (Math.sqrt(dx * dx + dy * dy) < Math.max(n.r + 14, 20)) {
        window.location.href = `/nieuws/${n.slug}`; return
      }
    }
  }

  if (!articles.length) return null
  const currentCat   = articles.find(a => a.slug === currentSlug)?.category ?? ''
  const currentColor = CAT_COLORS[currentCat] ?? '#7aadff'
  const related      = articles.filter(a => a.category === currentCat && a.slug !== currentSlug).slice(0, 5)
  const canvasHeight = compact ? 260 : 400

  return (
    <div style={compact ? { marginTop: 0 } : { marginTop: 80, borderTop: '1px solid #151828' }}>

      {/* Header */}
      {!compact && (
        <div style={{ padding: '24px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.57rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#3a4268', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ color: currentColor, fontSize: '0.65rem' }}>✦</span>
              Sterrenveld
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '1.05rem', color: '#6a78a0' }}>
              {related.length} gerelateerde artikelen in{' '}
              <span style={{ color: currentColor }}>{currentCat}</span>
            </div>
          </div>
          <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5rem', color: '#2a3050', letterSpacing: '0.08em', textAlign: 'right', lineHeight: 1.9 }}>
            HOVER om te verkennen<br />KLIK om te navigeren
          </div>
        </div>
      )}

      {compact && (
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #1a1e3a', fontFamily: 'JetBrains Mono,monospace', fontSize: '0.53rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: currentColor, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✦ Sterrenveld
        </div>
      )}

      {/* Canvas container */}
      <div style={{
        position: 'relative', width: '100%', height: canvasHeight,
        borderRadius: compact ? 0 : 6,
        overflow: 'hidden',
        border: compact ? 'none' : '1px solid #0e1020',
        background: '#020510',
      }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { hovRef.current = ''; setHovered(''); setTooltip(null) }}
          onClick={handleClick}
        />

        {/* Tooltip on hover */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 18, (canvasRef.current?.offsetWidth ?? 320) - 200),
            top:  Math.max(tooltip.y - 70, 8),
            background: 'rgba(4,6,18,0.97)',
            border: `1px solid ${currentColor}40`,
            borderRadius: 6,
            padding: '9px 13px',
            pointerEvents: 'none',
            maxWidth: 195,
            backdropFilter: 'blur(10px)',
            zIndex: 10,
          }}>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: currentColor, marginBottom: 5 }}>
              {currentCat}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: '0.9rem', color: '#dce8ff', lineHeight: 1.35 }}>
              {tooltip.title}
            </div>
            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.48rem', color: '#3a4870', marginTop: 7 }}>
              klik om te lezen →
            </div>
          </div>
        )}

        {/* "Jij bent hier" badge */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          fontFamily: 'DM Mono,monospace', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: currentColor,
          background: 'rgba(2,5,16,0.85)',
          border: `1px solid ${currentColor}35`,
          padding: '4px 10px', borderRadius: 4,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: currentColor, boxShadow: `0 0 5px ${currentColor}` }} />
          Jij bent hier
        </div>
      </div>
    </div>
  )
}
