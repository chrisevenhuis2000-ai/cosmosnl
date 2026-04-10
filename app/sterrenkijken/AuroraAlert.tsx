'use client'

import { useState, useEffect } from 'react'

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

interface SpaceWeather {
  kp:      number
  kpText:  string
  aurora:  boolean
  entries: { time: string; kp: number }[]
  updated: string
}

function kpColor(kp: number): string {
  if (kp >= 7) return '#e05040'
  if (kp >= 5) return '#d4a84b'
  if (kp >= 3) return '#378ADD'
  return '#3ddf90'
}

export default function AuroraAlert() {
  const [data,    setData]    = useState<SpaceWeather | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${PROXY}/space-weather`)
      .then(r => r.json())
      .then((d: SpaceWeather) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (!loading && !data) return null

  const kp    = data?.kp ?? 0
  const color = kpColor(kp)
  const barMax = 9

  return (
    <div style={{
      background:   '#12132A',
      border:       `1px solid ${data?.aurora ? 'rgba(212,168,75,0.4)' : '#252858'}`,
      borderRadius: 4,
      overflow:     'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: data?.aurora ? '#d4a84b' : '#4A5A8A' }}>
          {data?.aurora ? '🌌 Aurora-alert' : '☀ Ruimteweer'}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.44rem', color: '#2A3060', marginLeft: 'auto' }}>NOAA KP-index</span>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* KP value + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
            {loading ? (
              <div style={{ width: 36, height: 36, background: '#252858', borderRadius: 4 }} />
            ) : (
              <>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>
                  {kp.toFixed(1)}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.44rem', color: '#4A5A8A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>KP</span>
              </>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {loading ? (
              <>
                <div style={{ height: 10, width: '60%', background: '#252858', borderRadius: 2, marginBottom: 6 }} />
                <div style={{ height: 8,  width: '90%', background: '#1e2050', borderRadius: 2 }} />
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color, marginBottom: 4 }}>
                  {data?.kpText}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#8A9BC4', lineHeight: 1.5 }}>
                  {data?.aurora
                    ? 'Kans op noorderlicht in Noord-Nederland! Ga naar een donkere locatie.'
                    : kp >= 3
                      ? 'Verhoogde activiteit. Goed moment voor hoge breedtegraden.'
                      : 'Rustige ruimteweerconditties. Geen aurora verwacht.'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* KP schaal balk */}
        {!loading && data && (
          <div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
              {Array.from({ length: barMax }, (_, i) => {
                const level = i + 1
                const filled = kp >= level
                const barColor = level >= 7 ? '#e05040' : level >= 5 ? '#d4a84b' : level >= 3 ? '#378ADD' : '#3ddf90'
                return (
                  <div key={level} style={{
                    flex: 1, height: 8, borderRadius: 2,
                    background: filled ? barColor : '#252858',
                    opacity:    filled ? (level <= Math.floor(kp) ? 1 : 0.5) : 0.3,
                    transition: 'background 0.3s',
                  }} />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.42rem', color: '#2A3060' }}>
              <span>Rustig</span>
              <span>Aurora NL ≥5</span>
              <span>Sterk ≥7</span>
            </div>
          </div>
        )}

        {/* 24-uurs grafiek */}
        {!loading && data && data.entries.length > 0 && (
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.44rem', color: '#2A3060', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Afgelopen 24 uur
            </div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 32 }}>
              {data.entries.map((e, i) => {
                const h = Math.max(3, Math.round((e.kp / 9) * 32))
                const c = kpColor(e.kp)
                return (
                  <div key={i} title={`${e.time}: KP ${e.kp}`} style={{ flex: 1, height: h, background: c, borderRadius: '2px 2px 0 0', opacity: i === data.entries.length - 1 ? 1 : 0.6 }} />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
