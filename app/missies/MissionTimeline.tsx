'use client'
import Link from 'next/link'

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
  { id: 'curiosity',    abbr: 'Curiosity',    icon: '🤖', date: new Date(2011, 10, 26), color: '#378ADD', above: true,  extraUp: false },
  { id: 'perseverance', abbr: 'Perseverance', icon: '🤖', date: new Date(2020,  6, 30), color: '#4fa6e8', above: false, extraUp: false },
  { id: 'jwst',         abbr: 'James Webb',   icon: '🔭', date: new Date(2021, 11, 25), color: '#c080ff', above: true,  extraUp: false },
  { id: 'juice',        abbr: 'JUICE',        icon: '🪐', date: new Date(2023,  3, 14), color: '#ffa040', above: false, extraUp: false },
  { id: 'starship',     abbr: 'Starship',     icon: '🚀', date: new Date(2026,  2,  1), color: '#3dcfdf', above: true,  extraUp: true  },
  { id: 'smile',        abbr: 'SMILE',        icon: '🛰️', date: new Date(2026,  3,  9), color: '#ffa040', above: true,  extraUp: false },
  { id: 'artemis',      abbr: 'Artemis II',   icon: '🌕', date: new Date(2026,  9,  1), color: '#378ADD', above: false, extraUp: false },
]

const TODAY     = new Date(2026, 2, 28)
const YEAR_TICKS = Array.from({ length: 19 }, (_, i) => 2010 + i)

// ── Layout constants ────────────────────────────────────────────────────────
const TW      = 1600  // track width px
const LY      = 140   // center line Y
const TH      = 280   // total height
const LABEL_H = 56    // label box height (icon + name + year)
const CONN_H  = 22    // normal connector height
const EXTRA_UP = 62   // additional height for extraUp items to avoid overlap

export default function MissionTimeline() {
  const todayX = xOf(TODAY, TW)

  return (
    <section aria-labelledby="timeline-label" style={{ marginBottom: 80 }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span id="timeline-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4A5A8A' }}>Lanceertijdlijn</span>
        <div aria-hidden="true" style={{ flex: 1, height: 1, background: '#252858' }} />
      </div>

      {/* Voyager heritage note */}
      <Link
        href="/missies/voyager1"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(55,138,221,0.05)', border: '1px solid #252858', marginBottom: 16 }}
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
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'thin',
          scrollbarColor: '#252858 transparent',
          background: '#0b0c1e',
          border: '1px solid #252858',
          borderRadius: 2,
          paddingBottom: 2,
        }}
      >
        <div style={{ position: 'relative', width: TW, height: TH, minWidth: TW }}>

          {/* Subtle future-section tint (right of today) */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: todayX,
              top: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(55,138,221,0.022)',
              pointerEvents: 'none',
            }}
          />

          {/* Center line */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: LY, height: 1, background: '#252858' }} />

          {/* Year ticks */}
          {YEAR_TICKS.map(y => {
            const x = xOf(new Date(y, 0, 1), TW)
            const major  = y % 5 === 0
            const accent = y === 2026
            return (
              <div key={y}>
                <div style={{
                  position: 'absolute',
                  left:     x,
                  top:      LY - (major || accent ? 7 : 3),
                  width:    1,
                  height:   major || accent ? 14 : 6,
                  background: accent ? '#3dcfdf88' : (major ? '#4A5A8A' : '#252858'),
                }} />
                {(major || accent) && (
                  <span style={{
                    position:   'absolute',
                    left:       x,
                    top:        LY + 12,
                    transform:  'translateX(-50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize:   '0.47rem',
                    color:      accent ? '#3dcfdf' : '#4A5A8A',
                    letterSpacing: '0.05em',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}>
                    {y}
                  </span>
                )}
              </div>
            )
          })}

          {/* "Vandaag" marker */}
          <div style={{ position: 'absolute', left: todayX, top: 0, height: TH }}>
            <div style={{
              position:     'absolute',
              left:         0,
              top:          28,
              bottom:       28,
              width:        1,
              borderLeft:   '1px dashed rgba(61,207,223,0.45)',
            }} />
            <span style={{
              position:   'absolute',
              top:        14,
              left:       '50%',
              transform:  'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize:   '0.44rem',
              color:      '#3dcfdf',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              background: '#0b0c1e',
              padding:    '0 4px',
            }}>
              VANDAAG
            </span>
          </div>

          {/* Mission pins */}
          {EVENTS.map(m => {
            const x      = xOf(m.date, TW)
            const connH  = CONN_H + (m.extraUp ? EXTRA_UP : 0)
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
                  background: `${m.color}55`,
                }} />

                {/* Dot */}
                <div style={{
                  position:    'absolute',
                  left:        x - 5,
                  top:         LY - 5,
                  width:       10,
                  height:      10,
                  borderRadius: '50%',
                  background:  m.color,
                  boxShadow:   `0 0 10px ${m.color}70`,
                  zIndex:      2,
                }} />

                {/* Label */}
                <div style={{
                  position:   'absolute',
                  left:       x,
                  top:        labelTop,
                  transform:  'translateX(-50%)',
                  textAlign:  'center',
                  width:      78,
                  zIndex:     2,
                }}>
                  <div style={{ fontSize: '1.05rem', lineHeight: 1 }}>{m.icon}</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   '0.48rem',
                    color:      '#FFFFFF',
                    lineHeight: 1.35,
                    marginTop:  4,
                    whiteSpace: 'nowrap',
                  }}>
                    {m.abbr}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   '0.43rem',
                    color:      m.color,
                    marginTop:  2,
                    opacity:    0.85,
                  }}>
                    {m.date.getFullYear()}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { color: '#3ddf90', label: 'Actief' },
          { color: '#378ADD', label: 'Gepland' },
          { color: '#3dcfdf', label: 'Vandaag' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#4A5A8A', letterSpacing: '0.1em' }}>{l.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#2A3060' }}>Klik op een missie voor details</div>
      </div>
    </section>
  )
}
