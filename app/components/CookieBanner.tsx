'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import Link from 'next/link'

const CONSENT_KEY = 'nightgazer_consent'

export function CookieBanner() {
  const [consent,   setConsent]   = useState<'all' | 'minimal' | null>(null)
  const [visible,   setVisible]   = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as 'all' | 'minimal' | null
    if (stored) { setConsent(stored); return }
    setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'all')
    setConsent('all')
    setDismissed(true)
    setTimeout(() => setVisible(false), 300)
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'minimal')
    setConsent('minimal')
    setDismissed(true)
    setTimeout(() => setVisible(false), 300)
  }

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') decline() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {consent === 'all' && (
        <>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-ETD8FLPPCL" strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ETD8FLPPCL');
          `}</Script>
        </>
      )}

      {visible && (
        <div
          role="dialog"
          aria-label="Cookie toestemming"
          aria-modal="false"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: '#12132A',
            borderTop: '1px solid #252858',
            padding: '14px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
            animation: dismissed ? 'slideDown 0.3s ease-in forwards' : 'slideUp 0.3s ease-out both',
          }}
        >
          <p style={{ fontSize: '0.82rem', color: '#8A9BC4', lineHeight: 1.6, margin: 0, flex: 1, minWidth: 220 }}>
            We gebruiken analytische cookies (GA4) en CDN-diensten (Cloudflare) om de site te verbeteren.{' '}
            <Link href="/privacy" style={{ color: '#378ADD', textDecoration: 'underline' }}>Privacybeleid</Link>
          </p>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={decline}
              aria-label="Alleen noodzakelijke cookies toestaan"
              style={{
                padding: '8px 14px',
                fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                border: '1px solid #252858', color: '#8A9BC4',
                background: 'transparent', borderRadius: 4,
                cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#8A9BC4'; e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#252858'; e.currentTarget.style.color = '#8A9BC4' }}
            >
              Alleen noodzakelijk
            </button>
            <button
              onClick={accept}
              aria-label="Alle cookies accepteren"
              style={{
                padding: '8px 14px',
                fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#378ADD', color: '#fff',
                border: '1px solid #378ADD', borderRadius: 4,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2a6db5')}
              onMouseLeave={e => (e.currentTarget.style.background = '#378ADD')}
            >
              Accepteren
            </button>
          </div>
        </div>
      )}
    </>
  )
}
