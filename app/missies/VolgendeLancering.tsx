'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

interface Launch {
  id:          string
  name:        string
  agency:      string
  vehicle:     string
  pad:         string
  windowStart: string
  windowEnd:   string
  status:      string
  missionId:   string | null
}

function useCountdown(targetIso: string) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    const target = new Date(targetIso).getTime()
    const tick   = () => setDiff(Math.max(0, target - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetIso])

  const totalSec = Math.floor(diff / 1000)
  return {
    days:    Math.floor(totalSec / 86400),
    hours:   Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    past:    diff === 0,
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'clamp(1.1rem, 3vw, 1.6rem)',
        fontWeight:    700,
        color:         '#FFFFFF',
        lineHeight:    1,
        letterSpacing: '-0.02em',
      }}>
        {pad(value)}
      </span>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      '0.44rem',
        color:         '#4A5A8A',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginTop:     3,
      }}>
        {label}
      </span>
    </div>
  )
}

function CountdownSep() {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize:   'clamp(1rem, 2.5vw, 1.4rem)',
      color:      '#252858',
      alignSelf:  'flex-start',
      marginTop:  2,
      padding:    '0 4px',
    }}>:</span>
  )
}

export default function VolgendeLancering() {
  const [launches, setLaunches]   = useState<Launch[]>([])
  const [loaded,   setLoaded]     = useState(false)
  const [idx,      setIdx]        = useState(0)

  useEffect(() => {
    fetch(`${PROXY}/launches`)
      .then(r => r.json())
      .then(data => {
        setLaunches(Array.isArray(data) ? data : [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const next = launches[idx]
  const { days, hours, minutes, seconds, past } = useCountdown(next?.windowStart ?? '')

  const handleNext = useCallback(() => setIdx(i => (i + 1) % launches.length), [launches.length])
  const handlePrev = useCallback(() => setIdx(i => (i - 1 + launches.length) % launches.length), [launches.length])

  if (!loaded || !next) return null

  const inner = (
    <div style={{
      background:    'rgba(18,19,42,0.95)',
      border:        '1px solid #252858',
      borderRadius:  6,
      padding:       'clamp(16px, 3vw, 28px) clamp(16px, 4vw, 32px)',
      display:       'flex',
      flexDirection: 'column',
      gap:           14,
      transition:    'border-color 0.15s',
      cursor:        next.missionId ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (next.missionId) (e.currentTarget as HTMLDivElement).style.borderColor = '#378ADD' }}
      onMouseLeave={e => { if (next.missionId) (e.currentTarget as HTMLDivElement).style.borderColor = '#252858' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.5rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color:         '#378ADD',
            background:    'rgba(55,138,221,0.10)',
            border:        '1px solid rgba(55,138,221,0.25)',
            borderRadius:  2,
            padding:       '3px 8px',
          }}>
            Volgende lancering
          </span>
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.48rem',
            color:         next.status === 'Go' ? '#3ddf90' : '#4A5A8A',
            letterSpacing: '0.08em',
          }}>
            {next.status}
          </span>
        </div>

        {/* Navigatie (alleen bij meerdere lanceringen) */}
        {launches.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handlePrev} aria-label="Vorige lancering" style={{
              background: 'rgba(42,48,96,0.4)', border: '1px solid #252858',
              borderRadius: 3, color: '#4A5A8A', fontSize: '0.7rem',
              padding: '3px 8px', cursor: 'pointer',
            }}>‹</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: '#2A3060', alignSelf: 'center' }}>
              {idx + 1}/{launches.length}
            </span>
            <button onClick={handleNext} aria-label="Volgende lancering" style={{
              background: 'rgba(42,48,96,0.4)', border: '1px solid #252858',
              borderRadius: 3, color: '#4A5A8A', fontSize: '0.7rem',
              padding: '3px 8px', cursor: 'pointer',
            }}>›</button>
          </div>
        )}
      </div>

      {/* Missie naam + details */}
      <div>
        <p style={{
          fontFamily:  'var(--font-display)',
          fontSize:    'clamp(0.95rem, 2.5vw, 1.3rem)',
          fontWeight:  700,
          color:       '#FFFFFF',
          margin:      0,
          lineHeight:  1.2,
        }}>
          {next.name}
        </p>
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.52rem',
          color:         '#4A5A8A',
          margin:        '5px 0 0',
          letterSpacing: '0.04em',
        }}>
          {[next.agency, next.vehicle, next.pad].filter(Boolean).join(' · ')}
        </p>
      </div>

      {/* Countdown */}
      {past ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#3ddf90', margin: 0 }}>
          ✅ Lancering heeft plaatsgevonden
        </p>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <CountdownUnit value={days}    label="dagen"  />
          <CountdownSep />
          <CountdownUnit value={hours}   label="uur"    />
          <CountdownSep />
          <CountdownUnit value={minutes} label="min"    />
          <CountdownSep />
          <CountdownUnit value={seconds} label="sec"    />
        </div>
      )}
    </div>
  )

  if (next.missionId) {
    return (
      <Link href={`/missies/${next.missionId}`} style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </Link>
    )
  }

  return inner
}
