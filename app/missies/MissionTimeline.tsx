'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// ── Timeline range ──────────────────────────────────────────────────────────
const T_START = new Date(2010, 0, 1).getTime()   // Jan 2010
const T_END   = new Date(2028, 6, 1).getTime()   // Jul 2028 (padding)
const T_TOTAL = T_END - T_START

function xOf(date: Date, trackW: number): number {
  return Math.max(0, Math.min(1, (date.getTime() - T_START) / T_TOTAL)) * trackW
}

// ── Mission events ──────────────────────────────────────────────────────────
interface TLEvent {
  id:       string
  abbr:     string
  icon:     string
  date:     Date
  color:    string
  above:    boolean
  extraUp:  boolean
}

const EVENTS: TLEvent[] = [
  { id: 'curiosity',      abbr: 'Curiosity',      icon: '🤖', date: new Date(2011, 10, 26), color: '#378ADD', above: true,  extraUp: false },
  { id: 'perseverance',   abbr: 'Perseverance',   icon: '🤖', date: new Date(2020,  6, 30), color: '#4fa6e8', above: false, extraUp: false },
  { id: 'jwst',           abbr: 'James Webb',     icon: '🔭', date: new Date(2021, 11, 25), color: '#c080ff', above: true,  extraUp: false },
  { id: 'juice',          abbr: 'JUICE',           icon: '🪐', date: new Date(2023,  3, 14), color: '#ffa040', above: false, extraUp: false },
  { id: 'europa-clipper', abbr: 'Europa Clipper', icon: '🌊', date: new Date(2024,  9, 14), color: '#378ADD', above: true,  extraUp: false },
  { id: 'starship',       abbr: 'Starship IFT-7', icon: '🚀', date: new Date(2026,  2,  1), color: '#3dcfdf', above: true,  extraUp: false },
  { id: 'smile',          abbr: 'SMILE',           icon: '🛰️', date: new Date(2026,  3,  9), color: '#ffa040', above: false, extraUp: false },
  { id: 'artemis',        abbr: 'Artemis II',     icon: '🌕', date: new Date(2026,  3,  1), color: '#3ddf90', above: true,  extraUp: true  },
]

const YEAR_TICKS = Array.from({ length: 19 }, (_, i) => 2010 + i)

// ── Layout constants ────────────────────────────────────────────────────────
const TW       = 1600   // track width px
const LY       = 185    // center line Y (more room above for extraUp labels)
const TH       = 360    // total height
const LABEL_H  = 72     // label box height (icon + card)
const CONN_H   = 30     // normal connector height
const EXTRA_UP = 78     // extra height for items that would otherwise overlap

export default function MissionTimeline() {
  // Stable initial value avoids SSR/hydration mismatch; useEffect updates to live date
  const [today, setToday] = useState(new Date(2026, 3, 1))

  useEffect(() => {
    setToday(new Date())
    const id = setInterval(() => setToday(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const todayX = xOf(today, TW)

  return (
    <section aria-labelledby="timeline-label" style={{ marginBottom: 80 }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span id="timeline-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>Lanceertijdlijn</span>
        {/* Live indicator */}
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, flexShrink: 0 }}>
          <span className="animate-live-ring" style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: 'rgba(61,223,144,0.3)' }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ddf90', display: 'block' }} />
        </span>
        <div aria-hidden="true" style={{ flex: 1, height: 1, background: '#252858' }} />
      </div>

      {/* Voyager heritage note */}
      <Link
        href="/missies/voyager1"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(55,138,221,0.05)', border: '1px solid rgba(55,138,221,0.18)', borderRadius: 4, marginBottom: 16 }}
      >
        <span style={{ fontSize: '1.1rem' }}>🌌</span>
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#4A5A8A', lineHeight: 1.5 }}>
          <strong style={{ color: '#8A9BC4' }}>Voyager 1</strong> — gelanceerd 5 september 1977, nu op &gt;163 AU — niet op schaal weergegeven
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: '#378ADD', flexShrink: 0 }}>Bekijk →</span>
      </Link>

      {/* Scrollable timeline track */}
      <div
        style={{
          overflowX:    'auto',
          overflowY:    'visible',
          scrollbarWidth: 'thin',
          scrollbarColor: '#378ADD33 transparent',
          background:   '#0b0c1e',
          border:       '1px solid rgba(55,138,221,0.25)',
          borderRadius: 4,
          paddingBottom: 2,
          boxShadow:    '0 2px 24px rgba(55,138,221,0.06)',
        }}
      >
        <div style={{ position: 'relative', width: TW, height: TH, minWidth: TW }}>

          {/* Subtle future-section tint (right of today) */}
          <div
            aria-hidden="true"
            style={{
              position:      'absolute',
              left:          todayX,
              top:           0,
              right:         0,
              bottom:        0,
              background:    'rgba(55,138,221,0.022)',
              pointerEvents: 'none',
            }}
          />

          {/* Center line base + progress fill up to TODAY */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: LY, height: 2, background: '#1a1e3a' }} />
          <div style={{ position: 'absolute', left: 0, width: todayX, top: LY, height: 2, background: 'linear-gradient(to right, #252858, #378ADD66)' }} />

          {/* Year ticks */}
          {YEAR_TICKS.map(y => {
            const x      = xOf(new Date(y, 0, 1), TW)
            const major  = y % 5 === 0
            const accent = y === today.getFullYear()
            return (
              <div key={y}>
                <div style={{
                  position:   'absolute',
                  left:       x,
                  top:        LY - (major || accent ? 8 : 3),
                  width:      1,
                  height:     major || accent ? 16 : 6,
                  background: accent ? '#3dcfdf88' : (major ? '#4A5A8A' : '#252858'),
                }} />
                {(major || accent) && (
                  <span style={{
                    position:      'absolute',
                    left:          x,
                    top:           LY + 14,
                    transform:     'translateX(-50%)',
                    fontFamily:    'var(--font-mono)',
                    fontSize:      '0.5rem',
                    color:         accent ? '#3dcfdf' : '#4A5A8A',
                    letterSpacing: '0.05em',
                    userSelect:    'none',
                    pointerEvents: 'none',
                  }}>
                    {y}
                  </span>
                )}
              </div>
            )
          })}

          {/* TODAY marker */}
          <div style={{ position: 'absolute', left: todayX, top: 0, height: TH }}>
            <div style={{
              position:   'absolute',
              left:       0,
              top:        36,
              bottom:     36,
              width:      1,
              borderLeft: '1px solid rgba(55,138,221,0.85)',
              boxShadow:  '0 0 8px rgba(55,138,221,0.45)',
            }} />
            <div style={{
              position:     'absolute',
              top:          16,
              left:         '50%',
              transform:    'translateX(-50%)',
              fontFamily:   'var(--font-mono)',
              fontSize:     '0.46rem',
              color:        '#fff',
              letterSpacing: '0.08em',
              whiteSpace:   'nowrap',
              background:   '#378ADD',
              padding:      '3px 8px',
              borderRadius: 3,
              display:      'flex',
              alignItems:   'center',
              gap:          5,
            }}>
              <span className="animate-pulse-dot" style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
              VANDAAG
            </div>
          </div>

          {/* Mission pins */}
          {EVENTS.map(m => {
            const x        = xOf(m.date, TW)
            const isPast   = m.date.getTime() <= today.getTime()
            const connH    = CONN_H + (m.extraUp ? EXTRA_UP : 0)
            const connTop  = m.above ? LY - connH : LY + 5
            const labelTop = m.above ? LY - connH - LABEL_H : LY + CONN_H + 4

            return (
              <Link
                key={m.id}
                href={`/missies/${m.id}`}
                style={{ textDecoration: 'none' }}
                title={m.abbr}
              >
                {/* Connector line */}
                <div style={{
                  position:   'absolute',
                  left:       x,
                  top:        connTop,
                  width:      1,
                  height:     connH,
                  background: isPast ? `${m.color}66` : `${m.color}33`,
                }} />

                {/* Dot */}
                <div style={{
                  position:     'absolute',
                  left:         x - 5,
                  top:          LY - 5,
                  width:        10,
                  height:       10,
                  borderRadius: '50%',
                  background:   isPast ? m.color : 'transparent',
                  boxShadow:    isPast ? `0 0 10px ${m.color}90` : 'none',
                  border:       isPast ? 'none' : `1.5px solid ${m.color}88`,
                  zIndex:       2,
                }} />

                {/* Label card */}
                <div style={{
                  position:  'absolute',
                  left:      x,
                  top:       labelTop,
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  width:     90,
                  zIndex:    2,
                  opacity:   isPast ? 1 : 0.5,
                }}>
                  <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{m.icon}</div>
                  <div style={{
                    marginTop:    3,
                    background:   '#0f1128',
                    border:       `1px solid ${m.color}33`,
                    borderLeft:   `2px solid ${m.color}`,
                    borderRadius: 4,
                    padding:      '5px 8px',
                  }}>
                    <div style={{
                      fontFamily:   'var(--font-mono)',
                      fontSize:     '0.53rem',
                      color:        isPast ? '#e0e8ff' : '#8090b8',
                      lineHeight:   1.3,
                      whiteSpace:   'nowrap',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {m.abbr}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   '0.46rem',
                      color:      m.color,
                      marginTop:  2,
                      opacity:    isPast ? 1 : 0.7,
                    }}>
                      {m.date.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3ddf90', boxShadow: '0 0 5px #3ddf9080', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#4A5A8A', letterSpacing: '0.1em' }}>Actief / voltooid</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid #378ADD66', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#4A5A8A', letterSpacing: '0.1em' }}>Gepland</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ background: '#378ADD', padding: '2px 6px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: '0.42rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            VANDAAG
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#4A5A8A', letterSpacing: '0.1em' }}>Huidige datum (live)</span>
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#2A3060' }}>Klik op een missie voor details</div>
      </div>
    </section>
  )
}
