'use client'
import { useEffect, useRef, useState } from 'react'

interface AdUnitProps {
  /** Slot-ID uit jouw AdSense-dashboard (Advertenties → Weergaveadvertenties → slot) */
  slot: string
  style?: React.CSSProperties
}

declare global {
  interface Window { adsbygoogle: unknown[] }
}

/**
 * AdSense display-unit — rendert alleen na expliciete cookie-toestemming.
 * Roep in AdSense-dashboard "Weergaveadvertentie" aan per gewenste plek en
 * kopieer het gegenereerde slot-ID als prop mee.
 */
export function AdUnit({ slot, style }: AdUnitProps) {
  const [show,   setShow]   = useState(false)
  const pushed               = useRef(false)

  // Controleer consent na mount (localStorage bestaat alleen client-side)
  useEffect(() => {
    if (localStorage.getItem('nightgazer_consent') === 'all') setShow(true)
  }, [])

  // Push naar adsbygoogle zodra de <ins> in de DOM staat
  useEffect(() => {
    if (!show || pushed.current) return
    pushed.current = true
    try { ;(window.adsbygoogle = window.adsbygoogle || []).push({}) } catch {}
  }, [show])

  if (!show) return null

  return (
    <div style={{ textAlign: 'center', overflow: 'hidden', lineHeight: 0, ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1782461224909980"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
