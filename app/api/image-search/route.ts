import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/image-search?q=...&page=1&hash=12345
 *
 * Tries Pexels first (diverse, high-quality, includes equipment photos).
 * Falls back to NASA Images API when Pexels has no key or no results.
 * Returns { url, credit } or 404.
 */

const PEXELS_KEY = process.env.PEXELS_API_KEY

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q    = searchParams.get('q')    || 'space astronomy'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const hash = Math.abs(parseInt(searchParams.get('hash') || '0'))

  // ── 1. Pexels ────────────────────────────────────────────────────────────
  if (PEXELS_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=15&page=${page}&orientation=landscape`,
        { headers: { Authorization: PEXELS_KEY }, next: { revalidate: 3600 } },
      )
      if (res.ok) {
        const data = await res.json()
        const photos: any[] = data?.photos || []
        if (photos.length > 0) {
          // Deterministic selection + relevance preference
          const qTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 3)
          const start  = hash % photos.length

          for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < photos.length; i++) {
              const photo = photos[(start + i) % photos.length]
              const url   = photo?.src?.large2x || photo?.src?.large
              if (!url) continue
              if (pass === 0 && qTerms.length > 0) {
                const alt = (photo.alt || '').toLowerCase()
                if (!qTerms.some(t => alt.includes(t))) continue
              }
              return NextResponse.json({
                url,
                credit: `${photo.photographer} / Pexels`,
                source: 'pexels',
              })
            }
          }
        }
      }
    } catch { /* fall through to NASA */ }
  }

  // ── 2. NASA Images API (fallback) ─────────────────────────────────────────
  try {
    const res = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page_size=20&page=${page}`,
      { next: { revalidate: 3600 } },
    )
    if (res.ok) {
      const data  = await res.json()
      const items: any[] = data?.collection?.items || []
      const qTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 3)
      const start  = hash % (items.length || 1)

      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < items.length; i++) {
          const item = items[(start + i) % items.length]
          const href: string = item?.links?.[0]?.href ?? ''
          if (!href || !/\.(jpg|jpeg|png|webp)/i.test(href)) continue
          if (pass === 0 && qTerms.length > 0) {
            const meta = [
              item?.data?.[0]?.title ?? '',
              item?.data?.[0]?.description ?? '',
              (item?.data?.[0]?.keywords ?? []).join(' '),
            ].join(' ').toLowerCase()
            if (!qTerms.some(t => meta.includes(t))) continue
          }
          const photographer: string = item?.data?.[0]?.photographer ?? ''
          const center: string       = item?.data?.[0]?.center ?? 'NASA'
          return NextResponse.json({
            url:    href,
            credit: photographer ? `${photographer} / ${center}` : center,
            source: 'nasa',
          })
        }
      }
    }
  } catch { /* no result */ }

  return NextResponse.json({ url: null, credit: null }, { status: 404 })
}
