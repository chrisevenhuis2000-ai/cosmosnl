'use client'
import { useEffect } from 'react'

export function AdSenseScript() {
  useEffect(() => {
    function load() {
      if (localStorage.getItem('nightgazer_consent') !== 'all') return
      if (document.querySelector('script[data-adsense]')) return
      const s = document.createElement('script')
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1782461224909980'
      s.async = true
      s.crossOrigin = 'anonymous'
      s.dataset.adsense = '1'
      document.head.appendChild(s)
    }
    load()
    window.addEventListener('storage', load)
    return () => window.removeEventListener('storage', load)
  }, [])
  return null
}
