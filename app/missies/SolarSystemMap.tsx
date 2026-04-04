'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

// ── Astronomical constants ───────────────────────────────────────────────────
const J2000_MS   = new Date('2000-01-01T12:00:00Z').getTime()
const MS_PER_DAY = 86_400_000
const DEG        = Math.PI / 180

function planetAngle(L0: number, rate: number, t: number): number {
  return ((L0 + rate * t) % 360 + 360) % 360
}

// ── Planets (heliocentric ecliptic, J2000 mean elements) ────────────────────
const PLANETS = [
  { id:'mercury', name:'Mercurius', color:'#8888A8', r:0.387,  L0:252.25, rate:4.09233, dot:3 },
  { id:'venus',   name:'Venus',     color:'#D4B85E', r:0.723,  L0:181.98, rate:1.60213, dot:4 },
  { id:'earth',   name:'Aarde',     color:'#4A9DE8', r:1.000,  L0:100.46, rate:0.98560, dot:5 },
  { id:'mars',    name:'Mars',      color:'#D46040', r:1.524,  L0:355.45, rate:0.52403, dot:4 },
  { id:'jupiter', name:'Jupiter',   color:'#C89060', r:5.203,  L0:34.40,  rate:0.08309, dot:9 },
  { id:'saturn',  name:'Saturnus',  color:'#D8C878', r:9.537,  L0:49.94,  rate:0.03346, dot:7 },
  { id:'uranus',  name:'Uranus',    color:'#78D0D8', r:19.19,  L0:313.23, rate:0.01172, dot:6 },
  { id:'neptune', name:'Neptunus',  color:'#3858D8', r:30.07,  L0:304.88, rate:0.00598, dot:5 },
] as const

// ── Zoom levels ──────────────────────────────────────────────────────────────
type Zoom = 'inner' | 'outer' | 'interstellar'

const ZOOM_CFG: Record<Zoom, { maxAU: number; log: boolean; label: string; showPlanets: string[] }> = {
  inner:        { maxAU: 2.4,  log: false, label: '0–2.4 AU',    showPlanets: ['mercury','venus','earth','mars'] },
  outer:        { maxAU: 33,   log: false, label: '0–33 AU',     showPlanets: ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'] },
  interstellar: { maxAU: 185,  log: true,  label: 'Log-schaal',  showPlanets: ['earth','mars','jupiter','saturn','neptune'] },
}

// ── Mission positions (approximate for early 2026) ───────────────────────────
// Planet angles at 26 Mar 2026 (≈9581 days since J2000):
//   Earth ≈ 187°, Mars ≈ 336°, Jupiter ≈ 110°, Saturn ≈ 10°
interface Mission {
  id:     string
  name:   string
  color:  string
  au:     number
  angle:  number   // ecliptic longitude, degrees
  label:  string
  detail: string
  agency: string
  status: 'actief' | 'gepland'
  zooms:  Zoom[]
}

const MISSIONS: Mission[] = [
  {
    id:'jwst', name:'James Webb Telescoop', color:'#c080ff', agency:'NASA/ESA/CSA',
    au:1.010, angle:7,
    label:'Webb (L2)', detail:'Sun-Earth L2-punt · 1,5M km van Aarde · Infrarood kosmos',
    status:'actief', zooms:['inner','outer','interstellar'],
  },
  {
    id:'perseverance', name:'Mars Perseverance', color:'#378ADD', agency:'NASA',
    au:1.524, angle:338,
    label:'Persev.', detail:'Jezero-krater · Mars oppervlak · >23 rotsmonsters',
    status:'actief', zooms:['inner','outer','interstellar'],
  },
  {
    id:'curiosity', name:'MSL Curiosity', color:'#5090C8', agency:'NASA',
    au:1.535, angle:333,
    label:'Curiosity', detail:'Gale-krater · Mars oppervlak · 4400+ sols',
    status:'actief', zooms:['inner','outer','interstellar'],
  },
  {
    id:'juice', name:'ESA JUICE', color:'#ffa040', agency:'ESA',
    au:1.10, angle:222,
    label:'JUICE', detail:'Op weg naar Jupiter via gravity-assists · Aankomst 2031',
    status:'actief', zooms:['inner','outer','interstellar'],
  },
  {
    id:'starship', name:'SpaceX Starship', color:'#3dcfdf', agency:'SpaceX',
    au:1.000, angle:192,
    label:'Starship', detail:'Lage Aardbaan · IFT-7 geslaagd',
    status:'actief', zooms:['inner','outer','interstellar'],
  },
  {
    id:'artemis', name:'Artemis II', color:'#378ADD', agency:'NASA',
    au:1.003, angle:183,
    label:'Artemis II', detail:'Actief · Bemande Maan-vlucht',
    status:'actief', zooms:['inner','outer'],
  },
  {
    id:'smile', name:'ESA SMILE', color:'#ffc060', agency:'ESA/CAS',
    au:0.997, angle:181,
    label:'SMILE', detail:'Lancering 9 apr 2026 · Aardse magneetsfeer',
    status:'gepland', zooms:['inner','outer'],
  },
  {
    id:'voyager1', name:'Voyager 1', color:'#3ddf90', agency:'NASA',
    au:158.6, angle:258,
    label:'Voyager 1', detail:'Interstellaire ruimte · ~158 AU · 47 jaar actief · Verst ooit gemaakt',
    status:'actief', zooms:['interstellar'],
  },
  {
    id:'voyager2', name:'Voyager 2', color:'#60d0a0', agency:'NASA',
    au:132.2, angle:303,
    label:'Voyager 2', detail:'Interstellaire ruimte · ~132 AU · Enige sonde die Uranus & Neptunus bezocht',
    status:'actief', zooms:['interstellar'],
  },
  {
    id:'newhorizons', name:'New Horizons', color:'#d4a84b', agency:'NASA',
    au:57.5, angle:296,
    label:'New Horizons', detail:'Kuipergordel · ~57 AU · Bezocht Pluto in 2015',
    status:'actief', zooms:['interstellar'],
  },
]

// ── Precomputed background stars (deterministic) ─────────────────────────────
const BG_STARS = Array.from({ length: 90 }, (_, i) => ({
  x: ((i * 137.508 + i * i * 0.031) % 1 + 1) % 1,
  y: ((i * 97.301  + i * i * 0.019) % 1 + 1) % 1,
  r: i % 9 === 0 ? 1.3 : i % 4 === 0 ? 0.9 : 0.6,
  o: 0.15 + (i % 5) * 0.08,
}))

// ── Mission dynamic positions ────────────────────────────────────────────────
// Reference epoch: 26 Mar 2026 ≈ day 9581 since J2000
const T0 = 9581

function getMissionPos(m: Mission, t: number): { au: number; angle: number } {
  const earthAng = planetAngle(100.46, 0.98560, t)
  const marsAng  = planetAngle(355.45, 0.52403, t)
  const jupAng   = planetAngle(34.40,  0.08309, t)
  const dt       = t - T0   // days elapsed since reference

  switch (m.id) {
    // Earth-orbit / L2 missions — follow Earth's heliocentric angle
    case 'jwst':     return { au: 1.010, angle: (earthAng + 3   + 360) % 360 }
    case 'starship': return { au: 1.000, angle: (earthAng + 8   + 360) % 360 }
    case 'smile':    return { au: 0.997, angle: (earthAng - 5   + 360) % 360 }
    case 'artemis':  return { au: 1.003, angle: (earthAng - 10  + 360) % 360 }

    // Mars-surface missions — follow Mars' heliocentric angle
    case 'perseverance': return { au: 1.524, angle: (marsAng + 2  + 360) % 360 }
    case 'curiosity':    return { au: 1.535, angle: (marsAng - 2  + 360) % 360 }

    // JUICE: en route to Jupiter (arrival ~Jul 2031, ~1935 days from T0)
    case 'juice': {
      const frac  = Math.max(0, Math.min(1, dt / 1935))
      // Angle sweeps from 222° toward Jupiter arrival angle
      const arrivalAngle = (jupAng + 180) % 360
      const delta = ((arrivalAngle - 222 + 540) % 360) - 180
      return {
        au:    1.10 + frac * (5.2 - 1.10),
        angle: (222 + frac * delta + 360) % 360,
      }
    }

    // Interstellar probes — drifting outward (speeds in AU/day)
    case 'voyager1':    return { au: 158.6 + dt * 0.00981, angle: (m.angle + dt * 0.00015 + 360) % 360 }
    case 'voyager2':    return { au: 132.2 + dt * 0.00812, angle: (m.angle - dt * 0.00018 + 360) % 360 }
    case 'newhorizons': return { au: 57.5  + dt * 0.00563, angle: (m.angle + dt * 0.00030 + 360) % 360 }

    default: return { au: m.au, angle: m.angle }
  }
}

// ── Scale helpers ────────────────────────────────────────────────────────────
function auToPx(au: number, R: number, z: Zoom): number {
  const { maxAU, log } = ZOOM_CFG[z]
  if (log) return R * Math.log10(1 + au) / Math.log10(1 + maxAU)
  return R * Math.min(au, maxAU) / maxAU
}

function auToXY(au: number, angleDeg: number, cx: number, cy: number, R: number, z: Zoom): [number, number] {
  const r   = auToPx(au, R, z)
  const rad = angleDeg * DEG
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
}

// ── Component ────────────────────────────────────────────────────────────────
type HitEntry = { id: string; x: number; y: number; r: number }
type CanvasWithHits = HTMLCanvasElement & { _hits?: HitEntry[] }

export default function SolarSystemMap() {
  const canvasRef     = useRef<CanvasWithHits>(null)
  const wrapRef       = useRef<HTMLDivElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const rafRef        = useRef(0)
  const timeRef       = useRef(0)
  const zoomRef       = useRef<Zoom>('inner')
  const hoverRef      = useRef<string | null>(null)
  const animRef       = useRef(false)
  const isFullRef     = useRef(false)

  const [zoom,       setZoom]       = useState<Zoom>('inner')
  const [hoverId,    setHoverId]    = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<[number,number] | null>(null)
  const [animating,  setAnimating]  = useState(false)
  const [mounted,    setMounted]    = useState(false)
  const [isFull,     setIsFull]     = useState(false)

  useEffect(() => {
    timeRef.current = (Date.now() - J2000_MS) / MS_PER_DAY
    setMounted(true)
  }, [])

  useEffect(() => { zoomRef.current = zoom },      [zoom])
  useEffect(() => { animRef.current = animating }, [animating])

  // ── Draw loop ──────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.width) { rafRef.current = requestAnimationFrame(draw); return }
    const ctx  = canvas.getContext('2d')!
    const W    = canvas.width, H = canvas.height
    const cx   = W / 2, cy = H / 2
    const R    = Math.min(W, H) * 0.46
    const z    = zoomRef.current
    const t    = timeRef.current
    const now  = performance.now() / 1000

    if (animRef.current) timeRef.current += 0.4   // 0.4 days/frame ≈ 12 days/sec at 30fps

    // ── Background ──────────────────────────────────────────────────────
    ctx.fillStyle = '#050810'
    ctx.fillRect(0, 0, W, H)

    for (const s of BG_STARS) {
      ctx.beginPath()
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(180,205,255,${s.o.toFixed(2)})`
      ctx.fill()
    }

    const visiblePlanets = PLANETS.filter(p => ZOOM_CFG[z].showPlanets.includes(p.id))

    // ── Orbit rings ──────────────────────────────────────────────────────
    ctx.setLineDash([3, 6])
    ctx.lineWidth = 0.8
    for (const p of visiblePlanets) {
      const orbitR = auToPx(p.r, R, z)
      ctx.beginPath()
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(74,90,138,0.20)'
      ctx.stroke()
    }
    ctx.setLineDash([])

    // ── Heliopause boundary (interstellar view) ──────────────────────────
    if (z === 'interstellar') {
      const helioR = auToPx(120, R, z)
      ctx.beginPath()
      ctx.setLineDash([6, 10])
      ctx.arc(cx, cy, helioR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(61,223,144,0.18)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.setLineDash([])
      ctx.font       = '9px JetBrains Mono, monospace'
      ctx.fillStyle  = 'rgba(61,223,144,0.45)'
      ctx.textAlign  = 'center'
      ctx.fillText('Heliopauze · ~120 AU', cx, cy - helioR + 14)
    }

    // ── Sun ──────────────────────────────────────────────────────────────
    const coronaR = 44 + 4 * Math.sin(now * 0.7)
    const corona  = ctx.createRadialGradient(cx, cy, 0, cx, cy, coronaR)
    corona.addColorStop(0,   'rgba(255,240,100,1)')
    corona.addColorStop(0.25,'rgba(255,180,30,0.7)')
    corona.addColorStop(0.6, 'rgba(255,120,0,0.18)')
    corona.addColorStop(1,   'rgba(255,80,0,0)')
    ctx.beginPath(); ctx.arc(cx, cy, coronaR, 0, Math.PI * 2)
    ctx.fillStyle = corona; ctx.fill()

    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 11)
    core.addColorStop(0,   '#FFFFFF')
    core.addColorStop(0.4, '#FFE868')
    core.addColorStop(1,   '#FF9020')
    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2)
    ctx.fillStyle = core; ctx.fill()

    // Sun label
    ctx.fillStyle = 'rgba(255,220,80,0.7)'
    ctx.font      = '10px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Zon', cx, cy + 22)

    // ── Saturn rings ─────────────────────────────────────────────────────
    if (ZOOM_CFG[z].showPlanets.includes('saturn')) {
      const sat = PLANETS.find(p => p.id === 'saturn')!
      const [sx, sy] = auToXY(sat.r, planetAngle(sat.L0, sat.rate, t), cx, cy, R, z)
      const dotR = z === 'interstellar' ? 5 : sat.dot
      ctx.save()
      ctx.translate(sx, sy)
      ctx.beginPath()
      ctx.ellipse(0, 0, dotR * 2.8, dotR * 0.9, 0.3, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(216,200,120,0.4)'
      ctx.lineWidth   = 2
      ctx.stroke()
      ctx.restore()
    }

    // ── Planets ──────────────────────────────────────────────────────────
    for (const p of visiblePlanets) {
      const angle    = planetAngle(p.L0, p.rate, t)
      const [px, py] = auToXY(p.r, angle, cx, cy, R, z)
      const dotR     = z === 'inner' ? p.dot * 1.3 : z === 'interstellar' ? Math.max(p.dot * 0.8, 3) : p.dot

      const glow = ctx.createRadialGradient(px, py, 0, px, py, dotR * 1.8)
      glow.addColorStop(0,   p.color + '44')
      glow.addColorStop(0.5, p.color + '16')
      glow.addColorStop(1,   p.color + '00')
      ctx.beginPath(); ctx.arc(px, py, dotR * 1.8, 0, Math.PI * 2)
      ctx.fillStyle = glow; ctx.fill()

      ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2)
      ctx.fillStyle = p.color; ctx.fill()

      if (z !== 'outer' || p.r >= 1.5) {
        ctx.fillStyle = 'rgba(180,200,235,0.75)'
        ctx.font      = `9px JetBrains Mono, monospace`
        ctx.textAlign = 'center'
        ctx.fillText(p.name, px, py - dotR - 5)
      }
    }

    // ── JUICE trajectory hint ─────────────────────────────────────────────
    if (z === 'inner' || z === 'outer') {
      const juice    = MISSIONS.find(m => m.id === 'juice')!
      const jup      = PLANETS.find(p => p.id === 'jupiter')!
      const juicePos = getMissionPos(juice, t)
      if (ZOOM_CFG[z].showPlanets.includes('jupiter') || z === 'inner') {
        const [jx, jy] = auToXY(juicePos.au, juicePos.angle, cx, cy, R, z)
        const jupAngle  = planetAngle(jup.L0, jup.rate, t)
        const targetAU  = Math.min(jup.r * 0.75, ZOOM_CFG[z].maxAU)
        const [tx, ty]  = auToXY(targetAU, jupAngle, cx, cy, R, z)
        ctx.beginPath()
        ctx.setLineDash([4, 6])
        ctx.moveTo(jx, jy)
        ctx.quadraticCurveTo(
          (jx + tx) / 2 + (ty - jy) * 0.3,
          (jy + ty) / 2 - (tx - jx) * 0.3,
          tx, ty
        )
        ctx.strokeStyle = 'rgba(255,160,64,0.35)'
        ctx.lineWidth   = 1
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // ── Missions ─────────────────────────────────────────────────────────
    const pulse  = 0.5 + 0.5 * Math.sin(now * 2.2)
    const hits: HitEntry[] = []

    for (const m of MISSIONS.filter(m => m.zooms.includes(z))) {
      const { au: mAu, angle: mAngle } = getMissionPos(m, t)
      const [mx, my] = auToXY(mAu, mAngle, cx, cy, R, z)
      const isHover   = hoverRef.current === m.id
      const isPlanned = m.status === 'gepland'
      const dotR      = isHover ? 8 : 6

      // Pulse ring
      const pulseR  = dotR + 4 + pulse * 8
      const pulseG  = ctx.createRadialGradient(mx, my, dotR, mx, my, pulseR + 6)
      pulseG.addColorStop(0,   m.color + (isHover ? 'BB' : '66'))
      pulseG.addColorStop(0.5, m.color + '33')
      pulseG.addColorStop(1,   m.color + '00')
      ctx.beginPath(); ctx.arc(mx, my, pulseR + 6, 0, Math.PI * 2)
      ctx.fillStyle = pulseG; ctx.fill()

      // Dot
      ctx.beginPath(); ctx.arc(mx, my, dotR, 0, Math.PI * 2)
      if (isPlanned) {
        ctx.strokeStyle = m.color + 'BB'; ctx.lineWidth = 1.5
        ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = m.color + '30'; ctx.fill()
      } else {
        ctx.fillStyle = isHover ? m.color : m.color + 'DD'; ctx.fill()
        ctx.beginPath(); ctx.arc(mx, my, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill()
      }

      // Label — offset outward from Sun along mission's current angle
      const labelDist = dotR + 13
      const rad = mAngle * DEG
      const lx  = mx + Math.cos(rad) * labelDist
      const ly  = my - Math.sin(rad) * labelDist
      ctx.fillStyle  = isHover ? '#FFFFFF' : 'rgba(200,218,255,0.85)'
      ctx.font       = isHover ? 'bold 10px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace'
      ctx.textAlign  = lx < cx ? 'right' : 'left'
      ctx.fillText(m.label, lx + (lx < cx ? -2 : 2), ly + 4)

      hits.push({ id: m.id, x: mx, y: my, r: 14 })
    }

    canvas._hits = hits

    // ── Scale bar ─────────────────────────────────────────────────────────
    const scaleAU = z === 'inner' ? 0.5 : z === 'outer' ? 5 : 30
    const scalePx = auToPx(scaleAU, R, z)
    const bx = 18, by = H - 18
    ctx.strokeStyle = 'rgba(100,130,190,0.75)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + scalePx, by); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx, by + 5); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(bx + scalePx, by - 5); ctx.lineTo(bx + scalePx, by + 5); ctx.stroke()
    ctx.fillStyle = 'rgba(140,160,210,0.95)'; ctx.font = '10px JetBrains Mono, monospace'; ctx.textAlign = 'left'
    ctx.fillText(`${scaleAU} AU`, bx, by - 9)

    // North label
    ctx.fillStyle = 'rgba(100,120,170,0.7)'; ctx.font = '9px JetBrains Mono, monospace'; ctx.textAlign = 'right'
    ctx.fillText('↑ Ecliptische noord', W - 12, 18)

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current.requestFullscreen().catch(() => {})
  }, [])

  // ── Setup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current!
    const wrap   = wrapRef.current!

    const resize = () => {
      if (isFullRef.current) {
        canvas.width  = window.innerWidth
        canvas.height = window.innerHeight - 52   // minus header bar
      } else {
        const w = wrap.clientWidth
        const h = Math.max(Math.round(w * 0.6), 340)
        canvas.width = w; canvas.height = h
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const onFsChange = () => {
      const full = !!document.fullscreenElement
      isFullRef.current = full
      setIsFull(full)
      resize()
    }
    document.addEventListener('fullscreenchange', onFsChange)

    cancelAnimationFrame(rafRef.current)
    draw()

    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current); document.removeEventListener('fullscreenchange', onFsChange) }
  }, [mounted, draw])

  // ── Mouse events ──────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const mx     = (e.clientX - rect.left)  * scaleX
    const my     = (e.clientY - rect.top)   * scaleY

    let found: string | null = null
    for (const h of canvas._hits ?? []) {
      if ((mx - h.x) ** 2 + (my - h.y) ** 2 < h.r ** 2) { found = h.id; break }
    }
    hoverRef.current = found
    setHoverId(found)
    setTooltipPos(found ? [e.clientX, e.clientY] : null)
    canvas.style.cursor = found ? 'pointer' : 'default'
  }, [])

  const onMouseLeave = useCallback(() => {
    hoverRef.current = null; setHoverId(null); setTooltipPos(null)
  }, [])

  const toggleAnim = useCallback(() => setAnimating(a => !a), [])

  const hovered = hoverId ? MISSIONS.find(m => m.id === hoverId) : null

  return (
    <div ref={containerRef} style={{ background: '#12132A', border: '1px solid #252858', borderRadius: isFull ? 0 : 4, overflow: 'hidden', ...(isFull ? { position: 'fixed' as const, inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column' as const } : {}) }}>

      {/* ── Header / controls ───────────────────────────────────────────── */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid #252858', flexShrink: 0 }}>
        {/* Row 1: title + LIVE + fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>
              🗺 Missie-positiekaart
            </span>
            {/* LIVE badge */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(61,223,144,0.1)', border: '1px solid rgba(61,223,144,0.3)', borderRadius: 3, padding: '2px 7px' }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
                <span className="animate-live-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(61,223,144,0.4)' }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ddf90', display: 'block' }} />
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.44rem', letterSpacing: '0.12em', color: '#3ddf90' }}>LIVE</span>
            </span>
          </div>
          <button onClick={toggleFullscreen} title={isFull ? 'Sluit volledig scherm' : 'Bekijk in volledig scherm'} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.49rem', letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '4px 10px',
            border:     `1px solid ${isFull ? '#378ADD' : '#252858'}`,
            background:  isFull ? 'rgba(55,138,221,0.14)' : 'transparent',
            color:       isFull ? '#FFFFFF' : '#4A5A8A',
            cursor: 'pointer', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
          }}>
            {isFull ? '⤡ Verkleinen' : '⤢ Volledig scherm'}
          </button>
        </div>
        {/* Row 2: zoom pill-group + animate toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Pill group */}
          <div style={{ display: 'flex' }}>
            {(['inner','outer','interstellar'] as Zoom[]).map((z, i) => (
              <button key={z} onClick={() => setZoom(z)} style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.49rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '4px 12px',
                border:           `1px solid ${zoom === z ? '#378ADD' : '#252858'}`,
                borderLeft:       i === 0 ? `1px solid ${zoom === z ? '#378ADD' : '#252858'}` : 'none',
                background:       zoom === z ? 'rgba(55,138,221,0.18)' : '#0b0c1e',
                color:            zoom === z ? '#FFFFFF' : '#4A5A8A',
                cursor:           'pointer',
                borderRadius:     i === 0 ? '3px 0 0 3px' : i === 2 ? '0 3px 3px 0' : 0,
                transition:       'all 0.15s',
              }}>
                {z === 'inner' ? '◎ Binnen' : z === 'outer' ? '◉ Buiten' : '⊙ Interstellair'}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 16, background: '#252858', flexShrink: 0 }} />
          <button onClick={toggleAnim} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.49rem', letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '4px 11px',
            border:     `1px solid ${animating ? '#3ddf90' : '#252858'}`,
            background:  animating ? 'rgba(61,223,144,0.12)' : 'transparent',
            color:       animating ? '#3ddf90' : '#4A5A8A',
            cursor: 'pointer', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
          }}>
            {animating
              ? <><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3ddf90', flexShrink: 0, animation: 'livePulse 1s ease-in-out infinite', display: 'inline-block' }} />⏸ Pauzeer</>
              : <>▷ Animeer</>
            }
          </button>
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div ref={wrapRef} style={{ position: 'relative', maxWidth: isFull ? '100%' : 580, width: '100%', margin: '0 auto', flex: isFull ? '1' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isFull ? 'none' : '0 0 40px rgba(55,138,221,0.10), inset 0 0 0 1px rgba(55,138,221,0.14)' }}>
        {mounted && (
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', maxWidth: isFull ? '100%' : 580 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          />
        )}

        {/* Tooltip */}
        {hovered && tooltipPos && (
          <div style={{
            position: 'fixed',
            left: tooltipPos[0] + 16,
            top:  tooltipPos[1] - 16,
            zIndex: 200,
            pointerEvents: 'none',
            background: '#0d0e22',
            border: `1px solid ${hovered.color}55`,
            borderRadius: 4,
            overflow: 'hidden',
            maxWidth: 250,
            boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 16px ${hovered.color}22`,
          }}>
            <div style={{ height: 3, background: hovered.color }} />
            <div style={{ padding: '11px 14px' }}>
              <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 3 }}>
                {hovered.name}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: hovered.color, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                {hovered.status === 'actief'
                  ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: hovered.color, display: 'inline-block' }} />
                  : <span style={{ width: 5, height: 5, borderRadius: '50%', border: `1px solid ${hovered.color}`, display: 'inline-block' }} />
                }
                {hovered.status === 'actief' ? 'Actief' : 'Gepland'} · {hovered.agency} · {hovered.au < 10 ? hovered.au.toFixed(2) : Math.round(hovered.au)} AU
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#8A9BC4', lineHeight: 1.6 }}>
                {hovered.detail}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mission legend ───────────────────────────────────────────────── */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid #252858' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px 14px', marginBottom: 8 }}>
          {MISSIONS.filter(m => m.zooms.includes(zoom)).map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: m.status === 'actief' ? 1 : 0.6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: m.status === 'actief' ? m.color : 'transparent',
                border: `1.5px solid ${m.color}`,
                boxShadow: m.status === 'actief' ? `0 0 5px ${m.color}88` : 'none',
              }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.49rem', color: m.status === 'actief' ? '#c0cce8' : '#6070a0', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.label}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.43rem', color: m.status === 'actief' ? m.color : '#4A5A8A' }}>
                  {m.status === 'actief'
                    ? (m.au < 10 ? `${m.au.toFixed(2)} AU` : `${Math.round(m.au)} AU`)
                    : 'Gepland'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.43rem', color: '#2A3868', textAlign: 'right' }}>
          Posities: benadering {new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
        </div>
      </div>

    </div>
  )
}
