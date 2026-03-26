'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ───────────────────────────────────────────────────────────────────

interface Location {
  lat:  number
  lon:  number
  name: string
}

interface WeatherData {
  cloud_cover:          number
  temperature_2m:       number
  relative_humidity_2m: number
  wind_speed_10m:       number
  visibility:           number
}

interface ScoreData {
  score:   number
  label:   string
  color:   string
  weather: WeatherData | null
}

interface DayForecast {
  date:      Date
  score:     number
  color:     string
  label:     string
  cloud:     number
  moonPhase: number // 0–1
}

// ── Constants ───────────────────────────────────────────────────────────────

const PRESET_LOCATIONS: Location[] = [
  { lat: 53.1439, lon: 6.2642,   name: 'Marum, Groningen' },
  { lat: 53.2194, lon: 6.5665,   name: 'Groningen' },
  { lat: 52.3676, lon: 4.9041,   name: 'Amsterdam' },
  { lat: 52.0907, lon: 5.1214,   name: 'Utrecht' },
  { lat: 51.4416, lon: 5.4697,   name: 'Eindhoven' },
  { lat: 52.2215, lon: 6.8937,   name: 'Enschede' },
  { lat: 51.9225, lon: 4.4792,   name: 'Rotterdam' },
  { lat: 53.2012, lon: 5.7999,   name: 'Leeuwarden' },
  { lat: 52.5200, lon: 13.4050,  name: 'Berlijn, DE' },
  { lat: 51.5074, lon: -0.1278,  name: 'Londen, UK' },
  { lat: 48.8566, lon: 2.3522,   name: 'Parijs, FR' },
]

const DARK_SPOTS = [
  { name: 'Terschelling',     lat: 53.43, lon: 5.35,  bortle: '2–3', desc: 'Het donkerste stuk Nederland. Spectaculair voor Melkweg-fotografie.',                        tip: 'Boschplaat aan de oostkant is het donkerst. Neem warme kleding mee!' },
  { name: 'Spiekeroog (DE)',  lat: 53.77, lon: 7.69,  bortle: '2–3', desc: 'IDA-gecertificeerd Dark Sky eiland in Duitsland. Extreem donker.',                          tip: 'Veerboot vanuit Neuharlingersiel. Perfecte Melkweg-conditie!' },
  { name: 'Lauwersmeer',      lat: 53.36, lon: 6.20,  bortle: '3–4', desc: 'Nationaal Park, officieel Dark Sky Park. Beste locatie in Noord-Nederland.',                  tip: 'Ga naar de zuidkant van het meer voor minste lichtvervuiling.' },
  { name: 'Bargerveen',       lat: 52.68, lon: 7.03,  bortle: '3–4', desc: 'Groot natuurgebied in Zuidoost-Drenthe, ver van grote steden.',                              tip: 'Combineer met een bezoek aan het veenmuseum overdag.' },
  { name: 'Bourtangermoor',   lat: 53.01, lon: 7.20,  bortle: '3–4', desc: 'Grensgebied Drenthe/Duitsland, zeer weinig lichtvervuiling.',                                tip: 'Net over de Duitse grens is het nog donkerder.' },
  { name: 'Fochteloërveen',   lat: 52.96, lon: 6.38,  bortle: '4',   desc: 'Hoogveengebied met weinig lichtvervuiling. Dichtbij en toegankelijk.',                       tip: 'Vlak terrein = groot hemelbereik. Parkeer bij de ingang.' },
]

const METEORS = [
  { name: 'Quadrantiden',  peak: '3–4 jan',    zhr: 110, rating: 1, month: 1,  note: 'Volle maan verstoorde zicht volledig' },
  { name: 'Lyriden',       peak: '21–22 apr',  zhr: 18,  rating: 4, month: 4,  note: 'Donkere hemel! Beste na middernacht' },
  { name: 'Eta Aquariden', peak: '5–6 mei',    zhr: 50,  rating: 2, month: 5,  note: 'Maanlicht verstoort helaas veel' },
  { name: 'Perseïden',     peak: '12–13 aug',  zhr: 100, rating: 5, month: 8,  note: 'BESTE KANS 2026! Nieuwe maan = perfecte condities' },
  { name: 'Draconiden',    peak: '8–9 okt',    zhr: 10,  rating: 3, month: 10, note: 'Klein maar donkere hemel, vroege avond' },
  { name: 'Orioniden',     peak: '21 okt',     zhr: 20,  rating: 2, month: 10, note: 'Maanlicht hindert, alleen helderste zichtbaar' },
  { name: 'Leoniden',      peak: '16–17 nov',  zhr: 15,  rating: 3, month: 11, note: 'Halve maan, redelijke condities' },
  { name: 'Geminiden',     peak: '13–14 dec',  zhr: 150, rating: 5, month: 12, note: 'Grootste shower! Minimale maanlicht' },
  { name: 'Ursiden',       peak: '21–22 dec',  zhr: 10,  rating: 1, month: 12, note: 'Bijna volle maan, lastig' },
]

const SEASONS = [
  { name: 'Melkweg Seizoen',          icon: '🌌', months: [3,4,5,6,7,8,9,10], color: '#c080ff', targets: 'Galactische kern, Sagittarius sterrenwolk, Rho Ophiuchi',          tip: 'Beste na middernacht bij nieuwe maan. Ga naar Lauwersmeer of Terschelling.' },
  { name: 'Nevelseizoen — Winter',    icon: '✨', months: [11,12,1,2,3],      color: '#ff8a60', targets: 'Orionnevel (M42), Paardekopnevel, Rosette-nevel, Krab-nevel (M1)',  tip: 'Orionnevel is prachtig door telescoop! Kijk richting het zuiden na 21:00.' },
  { name: 'Nevelseizoen — Zomer',     icon: '🔴', months: [5,6,7,8,9],       color: '#d4a84b', targets: 'Sluiernevel, NGC 7000, Lagune-nevel (M8), Ring-nevel (M57)',         tip: 'Ring-nevel (M57) in Lier is compact maar helder — prachtig door telescoop!' },
  { name: 'Sterrenstelsel Seizoen',   icon: '🔭', months: [3,4,5],           color: '#7aadff', targets: 'M31 Andromeda, M51 Draaikolk, M81/M82 Bode, M104 Sombrero',        tip: 'Andromedanevel is nog zichtbaar in het westen in maart.' },
  { name: 'Bolvormige Sterrenhopen',  icon: '⭐', months: [5,6,7,8,9],       color: '#3ddf90', targets: 'M13 Hercules, M5 Slang, M22 Schutter, M92 Hercules',               tip: 'M13 is een must! Zichtbaar met verrekijker als wazig vlekje.' },
]

const SKY_OBJECTS = [
  { obj: 'Jupiter',    where: 'Hoog in het zuiden, in Gemini',            mag: '–2.3', icon: '♃', tip: 'Perfect voor je telescoop! Probeer de Galileïsche manen.' },
  { obj: 'Venus',      where: 'Laag in het westen na zonsondergang',      mag: '–3.9', icon: '♀', tip: 'Schitterend helder, maar zakt snel onder de horizon.' },
  { obj: 'Mars',       where: 'Aan de ochtendhemel voor zonsopkomst',     mag: '1.4',  icon: '♂', tip: 'Beter zichtbaar later dit jaar.' },
  { obj: 'Orionnevel', where: 'Hoog in het zuidwesten (Orion)',           mag: '',     icon: '⭐', tip: 'Orionnevel (M42) — prachtig door elke telescoop!' },
]

const BORTLE_COLORS: Record<string, string> = {
  '2–3': '#3ddf90',
  '3–4': '#d4a84b',
  '4':   '#378ADD',
  '5':   '#8A9BC4',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
}

function calcScore(w: WeatherData): ScoreData {
  let score = 100
  const cc = w.cloud_cover, hum = w.relative_humidity_2m, wind = w.wind_speed_10m, temp = w.temperature_2m
  if (cc > 80) score -= 50; else if (cc > 60) score -= 35; else if (cc > 40) score -= 20; else if (cc > 20) score -= 8
  if (hum > 90) score -= 15; else if (hum > 80) score -= 8
  if (wind > 30) score -= 15; else if (wind > 20) score -= 8
  if (temp < -5) score -= 5
  score = Math.max(0, Math.min(100, score))
  const label = score >= 80 ? 'Uitstekend' : score >= 60 ? 'Goed' : score >= 40 ? 'Matig' : score >= 20 ? 'Slecht' : 'Onmogelijk'
  const color = score >= 80 ? '#3ddf90' : score >= 60 ? '#d4a84b' : score >= 40 ? '#ff8a60' : '#e05040'
  return { score, label, color, weather: w }
}

function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

function getMoonPhase(date: Date): number {
  // Returns 0–1: 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  const KNOWN_NEW_MOON_MS = new Date('2000-01-06T18:14:00Z').getTime()
  const SYNODIC_MS = 29.53059 * 24 * 3600 * 1000
  return (((date.getTime() - KNOWN_NEW_MOON_MS) % SYNODIC_MS) + SYNODIC_MS) % SYNODIC_MS / SYNODIC_MS
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ scoreData, loading }: { scoreData: ScoreData | null; loading: boolean }) {
  const score = scoreData?.score ?? 0
  const color = scoreData?.color ?? '#4A5A8A'
  const label = scoreData?.label ?? '—'
  const circumference = 2 * Math.PI * 54
  const dash = circumference * (score / 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r="54" fill="none" stroke="#252858" strokeWidth="10" />
          <circle cx="70" cy="70" r="54" fill="none" stroke={loading ? '#252858' : color}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${loading ? 0 : dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <div style={{ width: 40, height: 8, background: '#252858', borderRadius: 2 }} />
          ) : (
            <>
              <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5A8A', marginTop: 4 }}>/100</span>
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: loading ? '#252858' : color }}>{loading ? '—' : label}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#4A5A8A', marginTop: 4 }}>Sterrenkijk-score vanavond</div>
      </div>
    </div>
  )
}

function WeatherFactors({ weather, loading }: { weather: WeatherData | null; loading: boolean }) {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '14px 16px' }}>
          <div style={{ height: 8, width: '60%', background: '#252858', borderRadius: 2, marginBottom: 8 }} />
          <div style={{ height: 20, width: '40%', background: '#1e2050', borderRadius: 2 }} />
        </div>
      ))}
    </div>
  )
  if (!weather) return null

  const factors = [
    { label: 'Bewolking',    value: `${weather.cloud_cover}%`,                icon: '☁',  color: weather.cloud_cover < 20 ? '#3ddf90' : weather.cloud_cover < 50 ? '#d4a84b' : '#e05040' },
    { label: 'Luchtvochtig', value: `${weather.relative_humidity_2m}%`,       icon: '💧', color: weather.relative_humidity_2m < 70 ? '#3ddf90' : weather.relative_humidity_2m < 85 ? '#d4a84b' : '#e05040' },
    { label: 'Windsnelheid', value: `${weather.wind_speed_10m} km/u`,         icon: '💨', color: weather.wind_speed_10m < 10 ? '#3ddf90' : weather.wind_speed_10m < 25 ? '#d4a84b' : '#e05040' },
    { label: 'Temperatuur',  value: `${weather.temperature_2m.toFixed(1)}°C`, icon: '🌡', color: weather.temperature_2m > -5 ? '#3ddf90' : '#e05040' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {factors.map(f => (
        <div key={f.label} style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, padding: '14px 16px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{f.icon}</span>{f.label}
          </div>
          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: f.color }}>{f.value}</div>
        </div>
      ))}
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i <= rating ? '#378ADD' : '#252858' }} />
      ))}
    </div>
  )
}

function WeekVoorspelling({ forecast, loading }: { forecast: DayForecast[]; loading: boolean }) {
  const DAYS_NL_SHORT = ['Zo','Ma','Di','Wo','Do','Vr','Za']
  const PHASE_EMOJIS  = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘']

  return (
    <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden', gridColumn: '1 / -1' }}>
      <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>
        ☁ 7-daagse sterrenkijk-voorspelling · 20:00
      </div>
      <div style={{ padding: '20px 18px 12px', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {loading
          ? [1,2,3,4,5,6,7].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ height: 9, width: 24, background: '#252858', borderRadius: 2 }} />
                <div style={{ height: 8, width: 16, background: '#1e2050', borderRadius: 2 }} />
                <div style={{ width: '70%', height: 80, background: '#1e2050', borderRadius: 3 }} />
                <div style={{ height: 14, width: 22, background: '#252858', borderRadius: 2 }} />
                <div style={{ height: 14, width: 18, background: '#1e2050', borderRadius: 2 }} />
              </div>
            ))
          : forecast.map((day, i) => {
              const isToday   = i === 0
              const dayName   = DAYS_NL_SHORT[day.date.getDay()]
              const dayNum    = day.date.getDate()
              const phaseIdx  = Math.round(day.moonPhase * 8) % 8
              const barH      = Math.max(4, Math.round(day.score * 0.8))
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {/* Day label */}
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: isToday ? '#378ADD' : '#8A9BC4', fontWeight: isToday ? 700 : 400 }}>
                    {isToday ? 'Van.' : dayName}
                  </div>
                  {/* Date */}
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', color: '#4A5A8A' }}>{dayNum}</div>
                  {/* Bar container */}
                  <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div
                      title={`${day.label} · Score ${day.score}/100 · Bewolking ${day.cloud}%`}
                      style={{
                        width: '68%',
                        height: barH,
                        background: `linear-gradient(to top, ${day.color}cc, ${day.color}33)`,
                        border: `1px solid ${day.color}55`,
                        borderRadius: '3px 3px 2px 2px',
                        boxShadow: isToday ? `0 0 10px ${day.color}44` : 'none',
                        transition: 'height 0.8s ease',
                      }}
                    />
                  </div>
                  {/* Score */}
                  <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: day.color, lineHeight: 1 }}>{day.score}</div>
                  {/* Moon phase */}
                  <div title={`Maanfase`} style={{ fontSize: '0.85rem', lineHeight: 1 }}>{PHASE_EMOJIS[phaseIdx]}</div>
                </div>
              )
            })
        }
      </div>
      {/* Legend */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid #252858', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { c: '#3ddf90', l: 'Uitstekend ≥80' },
          { c: '#d4a84b', l: 'Goed 60–79' },
          { c: '#ff8a60', l: 'Matig 40–59' },
          { c: '#e05040', l: 'Slecht <40' },
        ].map(({ c, l }) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c, opacity: 0.85 }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', color: '#8A9BC4' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaanKalender() {
  const now = new Date()
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth() // 0-indexed

  const MONTHS_NL = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
  const DAYS_NL   = ['Ma','Di','Wo','Do','Vr','Za','Zo']
  const PHASE_EMOJIS = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘']
  const PHASE_NAMES  = ['Nieuwe maan','Wassende sikkel','Eerste kwartier','Wassend gibbeus','Volle maan','Afnemend gibbeus','Laatste kwartier','Afnemende sikkel']

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startDow = new Date(year, month, 1).getDay() - 1
  if (startDow < 0) startDow = 6

  const todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate()

  const cells: (number | null)[] = [...Array(startDow).fill(null)]
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const btnStyle: React.CSSProperties = { background: 'none', border: '1px solid #252858', borderRadius: 2, color: '#8A9BC4', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  return (
    <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden', gridColumn: '1 / -1' }}>
      {/* Header */}
      <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>🌙 Maankalender</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={btnStyle} onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', minWidth: 160, textAlign: 'center' }}>{MONTHS_NL[month]} {year}</span>
          <button style={btnStyle} onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 18px 4px' }}>
        {DAYS_NL.map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A5A8A' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: '4px 18px 16px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const date     = new Date(year, month, day, 12)
          const phase    = getMoonPhase(date)
          const phaseIdx = Math.round(phase * 8) % 8
          const emoji    = PHASE_EMOJIS[phaseIdx]
          const isNew    = phaseIdx === 0
          const isFull   = phaseIdx === 4
          const isToday  = year === todayY && month === todayM && day === todayD
          return (
            <div
              key={i}
              title={`${day} ${MONTHS_NL[month]}: ${PHASE_NAMES[phaseIdx]}`}
              style={{
                textAlign: 'center',
                padding: '6px 2px',
                borderRadius: 3,
                border: isNew  ? '1px solid rgba(61,223,144,0.5)'
                      : isFull ? '1px solid rgba(224,80,64,0.4)'
                      : isToday ? '1px solid rgba(55,138,221,0.4)'
                      : '1px solid transparent',
                background: isToday ? 'rgba(55,138,221,0.10)'
                           : isNew  ? 'rgba(61,223,144,0.05)'
                           : isFull ? 'rgba(224,80,64,0.05)'
                           : 'transparent',
                cursor: 'default',
              }}
            >
              <div style={{ fontSize: '1rem', lineHeight: 1 }}>{emoji}</div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.48rem',
                marginTop: 3,
                color: isToday ? '#378ADD' : isNew ? '#3ddf90' : isFull ? '#e05040' : '#4A5A8A',
                fontWeight: isToday ? 700 : 400,
              }}>{day}</div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid #252858', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>🌑</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', color: '#3ddf90' }}>Nieuwe maan — beste kijkavond</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>🌕</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', color: '#e05040' }}>Volle maan — slechtste kijkavond</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, border: '1px solid rgba(55,138,221,0.5)', background: 'rgba(55,138,221,0.12)' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', color: '#378ADD' }}>Vandaag</span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SterrenkijkenPage() {
  const [tab,          setTab]          = useState<'vanavond' | 'kalender' | 'darksky' | 'locatie'>('vanavond')
  const [location,     setLocation]     = useState<Location>({ lat: 52.3676, lon: 4.9041, name: 'Amsterdam' })
  const [scoreData,    setScoreData]    = useState<ScoreData | null>(null)
  const [weekForecast, setWeekForecast] = useState<DayForecast[]>([])
  const [weatherLoad,  setWeatherLoad]  = useState(true)
  const [gpsLoading,   setGpsLoading]   = useState(false)
  const [manLat,       setManLat]       = useState('')
  const [manLon,       setManLon]       = useState('')
  const [manName,      setManName]      = useState('')
  const [locError,     setLocError]     = useState('')

  const curMonth = getCurrentMonth()

  // Load saved location, or auto-detect via GPS on first visit
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nightgazer_stargazing_loc')
      if (saved) { setLocation(JSON.parse(saved)); return }
    } catch {}

    // No saved location — silently request GPS, fall back to Amsterdam on deny
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        let name = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=nl`)
          const d = await r.json()
          const a = d.address
          name = a.city || a.town || a.village || a.municipality || name
        } catch {}
        saveLocation({ lat, lon, name })
      },
      () => { /* denied — Amsterdam default is already set, do nothing */ },
      { timeout: 8000 }
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch weather whenever location changes
  const fetchWeather = useCallback(async (loc: Location) => {
    setWeatherLoad(true)
    setScoreData(null)
    setWeekForecast([])
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=cloud_cover,temperature_2m,relative_humidity_2m,wind_speed_10m,visibility&forecast_days=7`
      const res  = await fetch(url)
      const data = await res.json()
      const h    = data.hourly

      // Tonight at 20:00 (index 20)
      const todayWeather: WeatherData = {
        cloud_cover:          h.cloud_cover[20],
        temperature_2m:       h.temperature_2m[20],
        relative_humidity_2m: h.relative_humidity_2m[20],
        wind_speed_10m:       h.wind_speed_10m[20],
        visibility:           h.visibility?.[20] ?? 10000,
      }
      setScoreData(calcScore(todayWeather))

      // 7-day forecast — one entry per day at 20:00
      const days: DayForecast[] = []
      const now = new Date()
      for (let d = 0; d < 7; d++) {
        const idx = d * 24 + 20
        const w: WeatherData = {
          cloud_cover:          h.cloud_cover[idx]          ?? 100,
          temperature_2m:       h.temperature_2m[idx]       ?? 5,
          relative_humidity_2m: h.relative_humidity_2m[idx] ?? 80,
          wind_speed_10m:       h.wind_speed_10m[idx]       ?? 10,
          visibility:           h.visibility?.[idx]         ?? 10000,
        }
        const scored = calcScore(w)
        const date   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d)
        days.push({
          date,
          score:     scored.score,
          color:     scored.color,
          label:     scored.label,
          cloud:     w.cloud_cover,
          moonPhase: getMoonPhase(date),
        })
      }
      setWeekForecast(days)
    } catch {
      setScoreData({ score: 0, label: 'Geen data', color: '#4A5A8A', weather: null })
    } finally {
      setWeatherLoad(false)
    }
  }, [])

  useEffect(() => { fetchWeather(location) }, [location, fetchWeather])

  function saveLocation(loc: Location) {
    setLocation(loc)
    try { localStorage.setItem('nightgazer_stargazing_loc', JSON.stringify(loc)) } catch {}
  }

  function detectGPS() {
    if (!navigator.geolocation) { setLocError('GPS niet beschikbaar in deze browser.'); return }
    setGpsLoading(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords
        let name = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=nl`)
          const d = await r.json()
          const a = d.address
          name = a.city || a.town || a.village || a.municipality || name
        } catch {}
        setGpsLoading(false)
        saveLocation({ lat, lon, name })
        setTab('vanavond')
      },
      () => { setGpsLoading(false); setLocError('GPS toegang geweigerd. Kies handmatig een locatie.') }
    )
  }

  function saveManual() {
    const lat = parseFloat(manLat), lon = parseFloat(manLon)
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLocError('Ongeldige coördinaten. Gebruik bijv. 52.37 en 4.90.')
      return
    }
    setLocError('')
    saveLocation({ lat, lon, name: manName || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E` })
    setTab('vanavond')
  }

  const darkSpotsSorted = [...DARK_SPOTS].sort((a, b) =>
    calcDistance(location.lat, location.lon, a.lat, a.lon) - calcDistance(location.lat, location.lon, b.lat, b.lon)
  )

  const upcomingMeteors = [...METEORS].sort((a, b) => {
    const d = (m: number) => { let diff = m - curMonth; if (diff < 0) diff += 12; return diff }
    return d(a.month) - d(b.month)
  })

  const activeSeasons = SEASONS.filter(s => s.months.includes(curMonth))
  const inactiveSeasons = SEASONS.filter(s => !s.months.includes(curMonth))

  const TABS = [
    { id: 'vanavond', label: 'Vanavond',  emoji: '🌙' },
    { id: 'kalender', label: 'Kalender',  emoji: '📅' },
    { id: 'darksky',  label: 'Dark Sky',  emoji: '🌑' },
    { id: 'locatie',  label: 'Locatie',   emoji: '📍' },
  ] as const

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#1A1A2E; color:#fff; font-family:'Inter',system-ui,sans-serif; }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .sk-panel { animation: fadeIn 0.25s ease both; }
        .sk-tab-btn:hover { color:#FFFFFF !important; background:rgba(55,138,221,0.08) !important; }
        .sk-preset:hover  { border-color:#378ADD !important; color:#FFFFFF !important; }
        .sk-darkspot:hover { border-color:rgba(55,138,221,0.3) !important; background:#16173A !important; }
        .sk-meteor:hover { background:#16173A !important; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(26,26,46,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #252858' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 clamp(16px,4vw,40px)', height: 60, gap: 32, maxWidth: 1100, margin: '0 auto' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo-transparent.png" alt="NightGazer" style={{ height: 46, width: 'auto', display: 'block' }} />
          </a>
          <nav style={{ flex: 1 }}>
            <a href="/" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4A5A8A', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4A5A8A')}
            >← Nieuws</a>
          </nav>
          <button onClick={() => setTab('locatie')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BC4', background: 'none', border: '1px solid #252858', borderRadius: 2, padding: '5px 12px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.color = '#378ADD' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' }}
          >
            <span>📍</span>
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location.name}</span>
          </button>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg,#0a0a1e 0%,#0d1540 50%,#1A1A2E 100%)', borderBottom: '1px solid #252858', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,40px) clamp(24px,4vw,48px)', overflow: 'hidden' }}>
        {/* Background stars */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.5 }}>
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', width: Math.random() > 0.8 ? 2 : 1, height: Math.random() > 0.8 ? 2 : 1, borderRadius: '50%', background: '#B5D4F4', left: `${(i * 1.618 * 13.7) % 100}%`, top: `${(i * 2.414 * 7.3) % 100}%`, opacity: 0.3 + (i % 5) * 0.1 }} />
          ))}
        </div>
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: scoreData?.color ?? '#4A5A8A' }}>✦</span>
            Sterrenkijken · NightGazer
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(1.8rem,4vw,3.2rem)', fontWeight: 800, lineHeight: 1.1, color: '#FFFFFF', marginBottom: 12 }}>
            Kan ik vanavond<br />sterren kijken?
          </h1>
          <p style={{ fontSize: '0.92rem', color: '#8A9BC4', lineHeight: 1.7, maxWidth: 480, marginBottom: 20 }}>
            Persoonlijke sterrenkijk-checker voor jouw locatie. Realtime weerscore, dark sky plekken en de beste objecten voor vanavond.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: weatherLoad ? '#378ADD' : (scoreData?.color ?? '#4A5A8A'), animation: weatherLoad ? 'livePulse 1s ease-in-out infinite' : 'none', flexShrink: 0 }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A' }}>
              {weatherLoad ? 'Weersdata ophalen...' : `Score voor ${location.name}`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 60, zIndex: 30, background: 'rgba(26,26,46,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #252858' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t.id} className="sk-tab-btn" onClick={() => setTab(t.id)}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '14px 22px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: tab === t.id ? '#FFFFFF' : '#4A5A8A', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#378ADD' : 'transparent'}`, cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap' }}
            >
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,40px) 80px' }}>

        {/* ── VANAVOND ─────────────────────────────────────────────────────── */}
        {tab === 'vanavond' && (
          <div className="sk-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>

            {/* 7-day forecast */}
            <WeekVoorspelling forecast={weekForecast} loading={weatherLoad} />

            {/* Score + weather */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>Score vanavond 20:00</div>
                <div style={{ padding: '28px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                  <ScoreGauge scoreData={scoreData} loading={weatherLoad} />
                </div>
              </div>
              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>Weersfactoren</div>
                <div style={{ padding: 18 }}>
                  <WeatherFactors weather={scoreData?.weather ?? null} loading={weatherLoad} />
                </div>
              </div>
            </div>

            {/* Visible objects + tip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>🔭 Zichtbaar vanavond</div>
                <div style={{ padding: '0 18px' }}>
                  {SKY_OBJECTS.map((o, i) => (
                    <div key={o.obj} style={{ padding: '14px 0', borderBottom: i < SKY_OBJECTS.length - 1 ? '1px solid #252858' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{o.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#FFFFFF' }}>{o.obj}</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#8A9BC4', marginTop: 2 }}>{o.where}</div>
                        </div>
                        {o.mag && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#378ADD', background: 'rgba(55,138,221,0.1)', padding: '2px 6px', borderRadius: 2, flexShrink: 0 }}>{o.mag} mag</span>}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#378ADD', paddingLeft: 32 }}>→ {o.tip}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active seasons this month */}
              {activeSeasons.length > 0 && (
                <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#378ADD' }}>✦ Deze maand actief</div>
                  <div style={{ padding: '0 18px' }}>
                    {activeSeasons.map((s, i) => (
                      <div key={s.name} style={{ padding: '14px 0', borderBottom: i < activeSeasons.length - 1 ? '1px solid #252858' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#FFFFFF' }}>{s.name}</div>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        </div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#8A9BC4', paddingLeft: 30, lineHeight: 1.6 }}>{s.targets}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick link to nearest dark sky */}
              <div style={{ background: '#12132A', border: '1px solid rgba(55,138,221,0.25)', borderRadius: 4, padding: '18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(55,138,221,0.1)', border: '1px solid rgba(55,138,221,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🌑</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 4 }}>Dichtstbijzijnde Dark Sky</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFFFF', marginBottom: 4 }}>{darkSpotsSorted[0].name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#8A9BC4' }}>
                    {calcDistance(location.lat, location.lon, darkSpotsSorted[0].lat, darkSpotsSorted[0].lon)} km · Bortle {darkSpotsSorted[0].bortle}
                  </div>
                </div>
                <button onClick={() => setTab('darksky')} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#378ADD', background: 'none', border: '1px solid rgba(55,138,221,0.3)', borderRadius: 2, padding: '6px 12px', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(55,138,221,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >Meer →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── KALENDER ─────────────────────────────────────────────────────── */}
        {tab === 'kalender' && (
          <div className="sk-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>

            {/* Moon phase calendar */}
            <MaanKalender />

            {/* Meteor showers */}
            <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>☄ Meteorenzwerms 2026</div>
              <div>
                {upcomingMeteors.map((m, i) => {
                  const isCurrent = m.month === curMonth
                  return (
                    <div key={m.name} className="sk-meteor" style={{ padding: '14px 18px', borderBottom: i < upcomingMeteors.length - 1 ? '1px solid #252858' : 'none', background: isCurrent ? 'rgba(55,138,221,0.05)' : 'transparent', borderLeft: isCurrent ? '3px solid #378ADD' : '3px solid transparent', transition: 'background 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.92rem', color: isCurrent ? '#FFFFFF' : '#8A9BC4' }}>{m.name}</span>
                            {isCurrent && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.46rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', background: 'rgba(55,138,221,0.15)', padding: '2px 6px', borderRadius: 2 }}>Nu actief</span>}
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#4A5A8A' }}>Piek: {m.peak} · ZHR: {m.zhr}/u</div>
                        </div>
                        <RatingStars rating={m.rating} />
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: m.rating >= 4 ? '#3ddf90' : m.rating >= 3 ? '#d4a84b' : '#e05040', lineHeight: 1.5 }}>
                        {m.note}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Deep sky seasons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeSeasons.length > 0 && (
                <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#378ADD' }}>✦ Actief deze maand</div>
                  <div style={{ padding: '0 18px' }}>
                    {activeSeasons.map((s, i) => (
                      <div key={s.name} style={{ padding: '16px 0', borderBottom: i < activeSeasons.length - 1 ? '1px solid #252858' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>{s.name}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#8A9BC4', lineHeight: 1.65, marginBottom: 10 }}>{s.tip}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.08em', color: s.color, lineHeight: 1.6 }}>
                          → {s.targets}
                        </div>
                        {/* Month bar */}
                        <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(mo => (
                            <div key={mo} title={`Maand ${mo}`} style={{ flex: 1, height: 4, borderRadius: 2, background: s.months.includes(mo) ? s.color : '#252858', opacity: mo === curMonth ? 1 : s.months.includes(mo) ? 0.55 : 0.3 }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>Overige seizoenen</div>
                <div style={{ padding: '0 18px' }}>
                  {inactiveSeasons.map((s, i) => (
                    <div key={s.name} style={{ padding: '12px 0', borderBottom: i < inactiveSeasons.length - 1 ? '1px solid #252858' : 'none', opacity: 0.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{s.icon}</span>
                        <span style={{ fontSize: '0.85rem', color: '#8A9BC4' }}>{s.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(mo => (
                          <div key={mo} style={{ flex: 1, height: 3, borderRadius: 2, background: s.months.includes(mo) ? s.color : '#252858', opacity: 0.4 }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DARK SKY ─────────────────────────────────────────────────────── */}
        {tab === 'darksky' && (
          <div className="sk-panel">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 8 }}>Gesorteerd op afstand vanaf {location.name}</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {['2–3', '3–4', '4'].map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#4A5A8A' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: BORTLE_COLORS[b] }} />
                    Bortle {b}
                  </div>
                ))}
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#4A5A8A' }}>Lager = donkerder</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {darkSpotsSorted.map((spot, i) => {
                const dist = calcDistance(location.lat, location.lon, spot.lat, spot.lon)
                const col = BORTLE_COLORS[spot.bortle] ?? '#378ADD'
                return (
                  <div key={spot.name} className="sk-darkspot" style={{ background: '#12132A', border: `1px solid ${i === 0 ? 'rgba(55,138,221,0.35)' : '#252858'}`, borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.15s, background 0.15s', cursor: 'default' }}>
                    <div style={{ height: 4, background: col }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>{spot.name}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: col, background: `${col}18`, padding: '2px 7px', borderRadius: 2, border: `1px solid ${col}40` }}>Bortle {spot.bortle}</span>
                            {i === 0 && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.46rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', background: 'rgba(55,138,221,0.12)', padding: '2px 6px', borderRadius: 2 }}>Dichtstbij</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>{dist}</div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.46rem', color: '#4A5A8A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>km</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#8A9BC4', lineHeight: 1.65, marginBottom: 10 }}>{spot.desc}</p>
                      <div style={{ background: '#0F1028', borderRadius: 2, padding: '8px 12px' }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#378ADD', marginBottom: 4 }}>Tip</div>
                        <div style={{ fontSize: '0.75rem', color: '#8A9BC4', lineHeight: 1.6 }}>{spot.tip}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── LOCATIE ──────────────────────────────────────────────────────── */}
        {tab === 'locatie' && (
          <div className="sk-panel" style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 6 }}>Huidige locatie</div>
              <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: '#FFFFFF' }}>{location.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', color: '#4A5A8A', marginTop: 4 }}>{location.lat.toFixed(4)}°N · {location.lon.toFixed(4)}°E</div>
            </div>

            {locError && (
              <div style={{ padding: '10px 14px', background: 'rgba(224,80,64,0.1)', border: '1px solid rgba(224,80,64,0.3)', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.58rem', color: '#ff8a7a', marginBottom: 20 }}>
                ⚠ {locError}
              </div>
            )}

            {/* GPS button */}
            <button onClick={detectGPS} disabled={gpsLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', background: gpsLoading ? '#1e2050' : '#378ADD', color: gpsLoading ? '#4A5A8A' : '#fff', border: 'none', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: gpsLoading ? 'default' : 'pointer', marginBottom: 24, transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!gpsLoading) e.currentTarget.style.background = '#4A9DE8' }}
              onMouseLeave={e => { if (!gpsLoading) e.currentTarget.style.background = '#378ADD' }}
            >
              {gpsLoading ? <><span style={{ animation: 'livePulse 1s ease-in-out infinite' }}>⟳</span> GPS bepalen...</> : <>📍 Gebruik mijn GPS-locatie</>}
            </button>

            {/* Preset locations */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 12 }}>Snelkeuze</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PRESET_LOCATIONS.map(p => (
                  <button key={p.name} className="sk-preset" onClick={() => { saveLocation(p); setTab('vanavond') }}
                    style={{ padding: '7px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.06em', textTransform: 'uppercase', border: `1px solid ${location.name === p.name ? '#378ADD' : '#252858'}`, background: location.name === p.name ? 'rgba(55,138,221,0.1)' : 'transparent', color: location.name === p.name ? '#378ADD' : '#8A9BC4', borderRadius: 2, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                  >{p.name}</button>
                ))}
              </div>
            </div>

            {/* Manual input */}
            <div style={{ background: '#12132A', border: '1px solid #252858', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ padding: '11px 18px', borderBottom: '1px solid #252858', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4A5A8A' }}>Handmatige coördinaten</div>
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Breedtegraad', val: manLat, set: setManLat, placeholder: '52.37' },
                    { label: 'Lengtegraad',  val: manLon, set: setManLon, placeholder: '4.90' },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 6 }}>{f.label}</div>
                      <input type="number" step="0.01" value={f.val} placeholder={f.placeholder} onChange={e => f.set(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', background: '#0F1028', border: '1px solid #252858', borderRadius: 2, color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', outline: 'none' }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#378ADD')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#252858')}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A5A8A', marginBottom: 6 }}>Locatienaam (optioneel)</div>
                  <input type="text" value={manName} placeholder="Mijn sterrenkijkplek" onChange={e => setManName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#0F1028', border: '1px solid #252858', borderRadius: 2, color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', outline: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#378ADD')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#252858')}
                  />
                </div>
                <button onClick={saveManual}
                  style={{ padding: '10px', background: '#378ADD', color: '#fff', border: 'none', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#4A9DE8')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
                >Opslaan →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #252858', background: '#12132A', padding: '20px clamp(16px,4vw,40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.52rem', color: '#2A3060' }}>© 2026 NightGazer — Astronomie voor iedereen</span>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[['Open-Meteo', ''], ['Nominatim/OSM', ''], ['NASA', '']].map(([s]) => (
            <span key={s} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.48rem', color: '#2A3060', letterSpacing: '0.06em' }}>Data: {s}</span>
          ))}
        </div>
      </footer>
    </>
  )
}
