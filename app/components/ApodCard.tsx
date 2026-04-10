'use client'

import { useState, useEffect } from 'react'

const PROXY = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'

interface ApodData {
  title:       string
  explanation: string
  url:         string
  hdurl?:      string
  media_type:  string
  copyright?:  string
  date:        string
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return iso }
}

export default function ApodCard() {
  const [apod,    setApod]    = useState<ApodData | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgErr,  setImgErr]  = useState(false)

  useEffect(() => {
    fetch(`${PROXY}/apod`)
      .then(r => r.json())
      .then((d: ApodData) => { setApod(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (!loading && !apod) return null

  const isVideo = apod?.media_type === 'video'
  const imgUrl  = apod?.hdurl || apod?.url

  return (
    <div style={{
      background:   '#12132A',
      border:       '1px solid #252858',
      borderRadius: 6,
      overflow:     'hidden',
      transition:   'border-color 0.15s',
    }}
      onMouseEnter={e => { if (imgUrl && !isVideo) (e.currentTarget as HTMLDivElement).style.borderColor = '#378ADD' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252858' }}
    >
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #252858', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.5rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color:         '#378ADD',
          background:    'rgba(55,138,221,0.1)',
          border:        '1px solid rgba(55,138,221,0.25)',
          borderRadius:  2,
          padding:       '2px 7px',
        }}>NASA · Foto van de dag</span>
        {apod && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: '#2A3060', marginLeft: 'auto' }}>
            {formatDate(apod.date)}
          </span>
        )}
      </div>

      {/* Image / Video */}
      {loading ? (
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#0d0e20' }} />
      ) : isVideo ? (
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#0d0e20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <a href={apod!.url} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: '#378ADD', textDecoration: 'none', letterSpacing: '0.08em' }}>
            ▶ Bekijk video ↗
          </a>
        </div>
      ) : imgErr || !imgUrl ? (
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#0d0e20' }} />
      ) : (
        <a href={apod!.hdurl || apod!.url} target="_blank" rel="noopener noreferrer" aria-label={`APOD: ${apod?.title}`}>
          <img
            src={`${PROXY}/image-proxy?url=${encodeURIComponent(imgUrl!)}`}
            alt={apod?.title || 'Astronomy Photo of the Day'}
            onError={() => setImgErr(true)}
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
          />
        </a>
      )}

      {/* Title + explanation */}
      <div style={{ padding: '14px 16px' }}>
        {loading ? (
          <>
            <div style={{ height: 14, width: '70%', background: '#252858', borderRadius: 2, marginBottom: 10 }} />
            <div style={{ height: 9,  width: '100%', background: '#1e2050', borderRadius: 2, marginBottom: 6 }} />
            <div style={{ height: 9,  width: '85%',  background: '#1e2050', borderRadius: 2 }} />
          </>
        ) : apod ? (
          <>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'clamp(0.88rem,2vw,1.05rem)',
              fontWeight: 700,
              color:      '#FFFFFF',
              margin:     '0 0 8px',
              lineHeight: 1.3,
            }}>
              {apod.title}
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize:   '0.52rem',
              color:      '#4A5A8A',
              margin:     0,
              lineHeight: 1.7,
              display:    '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical' as const,
              overflow:   'hidden',
            }}>
              {apod.explanation}
            </p>
            {apod.copyright && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: '#2A3060', margin: '8px 0 0', letterSpacing: '0.04em' }}>
                © {apod.copyright.replace(/\n/g, ' ')}
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
