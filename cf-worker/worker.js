const ALLOWED_ORIGIN = 'https://stargazing.crixium.net'

function cors(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      ...extra,
    },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // ── CORS preflight ────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
          'Access-Control-Max-Age':       '86400',
        },
      })
    }

    // ── GET /image-search?q=...&page=1&hash=12345 ─────────────────────────
    if (request.method === 'GET' && url.pathname === '/image-search') {
      const q    = url.searchParams.get('q')    || 'space astronomy'
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
      const hash = Math.abs(parseInt(url.searchParams.get('hash') || '0'))

      // 1. Pexels (diverse, high quality, includes equipment photos)
      const pexelsKey = env.PEXELS_API_KEY
      if (pexelsKey) {
        try {
          const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=15&page=${page}&orientation=landscape`,
            { headers: { Authorization: pexelsKey } },
          )
          if (res.ok) {
            const data    = await res.json()
            const photos  = data?.photos || []
            if (photos.length > 0) {
              const qTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 3)
              const start  = hash % photos.length
              for (let pass = 0; pass < 2; pass++) {
                for (let i = 0; i < photos.length; i++) {
                  const photo = photos[(start + i) % photos.length]
                  const imgUrl = photo?.src?.large2x || photo?.src?.large
                  if (!imgUrl) continue
                  if (pass === 0 && qTerms.length > 0) {
                    const alt = (photo.alt || '').toLowerCase()
                    if (!qTerms.some(t => alt.includes(t))) continue
                  }
                  return cors(JSON.stringify({
                    url:    imgUrl,
                    credit: `${photo.photographer} / Pexels`,
                    source: 'pexels',
                  }))
                }
              }
            }
          }
        } catch { /* fall through */ }
      }

      // 2. NASA Images API (fallback)
      try {
        const res = await fetch(
          `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page_size=20&page=${page}`,
        )
        if (res.ok) {
          const data   = await res.json()
          const items  = data?.collection?.items || []
          const qTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 3)
          const start  = hash % (items.length || 1)
          for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < items.length; i++) {
              const item = items[(start + i) % items.length]
              const href = item?.links?.[0]?.href ?? ''
              if (!href || !/\.(jpg|jpeg|png|webp)/i.test(href)) continue
              if (pass === 0 && qTerms.length > 0) {
                const meta = [
                  item?.data?.[0]?.title ?? '',
                  item?.data?.[0]?.description ?? '',
                  (item?.data?.[0]?.keywords ?? []).join(' '),
                ].join(' ').toLowerCase()
                if (!qTerms.some(t => meta.includes(t))) continue
              }
              const photographer = item?.data?.[0]?.photographer ?? ''
              const center       = item?.data?.[0]?.center ?? 'NASA'
              return cors(JSON.stringify({
                url:    href,
                credit: photographer ? `${photographer} / ${center}` : center,
                source: 'nasa',
              }))
            }
          }
        }
      } catch { /* no result */ }

      return cors(JSON.stringify({ url: null, credit: null }), 404)
    }

    // ── POST / → Anthropic proxy (existing) ──────────────────────────────
    if (request.method === 'POST' && url.pathname === '/') {
      const body     = await request.json()
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      return cors(JSON.stringify(data))
    }

    return cors(JSON.stringify({ error: 'Not found' }), 404)
  },
}
