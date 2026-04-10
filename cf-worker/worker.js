const ALLOWED_ORIGINS = [
  'https://nightgazer.space',
  'https://www.nightgazer.space',
  'https://stargazing.crixium.net',  // legacy — remove after migration
]

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin') || ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

function cors(request, body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
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
          'Access-Control-Allow-Origin':  getAllowedOrigin(request),
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
          'Access-Control-Max-Age':       '86400',
        },
      })
    }

    // ── GET /image-search?q=...&page=1&hash=12345&exclude=url1,url2 ──────
    if (request.method === 'GET' && url.pathname === '/image-search') {
      const q       = url.searchParams.get('q')    || 'space astronomy'
      const page    = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
      const hash    = Math.abs(parseInt(url.searchParams.get('hash') || '0'))
      // Excluded URLs passed by client to prevent duplicate images across articles
      const exclude = new Set((url.searchParams.get('exclude') || '').split(',').filter(Boolean))

      // 1. NASA Images API (primary — most relevant for space/astronomy content)
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
              // Skip excluded URLs
              if (exclude.has(href)) continue
              if (pass === 0 && qTerms.length > 0) {
                const meta = [
                  item?.data?.[0]?.title ?? '',
                  item?.data?.[0]?.description ?? '',
                  (item?.data?.[0]?.keywords ?? []).join(' '),
                ].join(' ').toLowerCase()
                const matchCount = qTerms.filter(t => meta.includes(t)).length
                const threshold  = qTerms.length <= 2 ? 1 : 2
                if (matchCount < threshold) continue
              }
              const photographer = item?.data?.[0]?.photographer ?? ''
              const center       = item?.data?.[0]?.center ?? 'NASA'
              return cors(request, JSON.stringify({
                url:    href,
                credit: photographer ? `${photographer} / ${center}` : center,
                source: 'nasa',
              }))
            }
          }
        }
      } catch { /* fall through */ }

      // 2. Pexels (fallback — broader stock photo library)
      const pexelsKey = env.PEXELS_API_KEY
      if (pexelsKey) {
        try {
          const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=20&page=${page}&orientation=landscape`,
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
                  if (exclude.has(imgUrl)) continue
                  if (pass === 0 && qTerms.length > 0) {
                    const alt = (photo.alt || '').toLowerCase()
                    if (!qTerms.some(t => alt.includes(t))) continue
                  }
                  return cors(request, JSON.stringify({
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

      return cors(request, JSON.stringify({ url: null, credit: null }))
    }

    // ── GET /apod ─────────────────────────────────────────────────────────
    // Proxies NASA APOD and caches the result for 1 hour via CF Cache API.
    // API key stays server-side — never exposed to the browser.
    if (request.method === 'GET' && url.pathname === '/apod') {
      const cacheKey = new Request('https://nasa-apod-cache/apod')
      const cache    = caches.default

      const cached = await cache.match(cacheKey)
      if (cached) {
        const data = await cached.json()
        return cors(request, JSON.stringify(data))
      }

      const apiKey = env.NASA_API_KEY || 'DEMO_KEY'
      const res    = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`)
      if (!res.ok) {
        return cors(request, JSON.stringify({ error: `NASA ${res.status}` }), 502)
      }
      const data = await res.json()

      await cache.put(cacheKey, new Response(JSON.stringify(data), {
        headers: { 'Cache-Control': 'public, max-age=3600', 'Content-Type': 'application/json' },
      }))

      return cors(request, JSON.stringify(data))
    }

    // ── GET /weather?lat=52.37&lon=4.90 ──────────────────────────────────
    // Proxies Open-Meteo and caches the result for 30 minutes via CF Cache API
    // so individual browser visits don't each hit Open-Meteo directly.
    if (request.method === 'GET' && url.pathname === '/weather') {
      const lat    = url.searchParams.get('lat')    ?? '52.3676'
      const lon    = url.searchParams.get('lon')    ?? '4.9041'
      const days   = url.searchParams.get('days')   ?? '1'
      const fields = url.searchParams.get('fields') ?? 'cloud_cover,temperature_2m,relative_humidity_2m,wind_speed_10m'

      const cacheKey = new Request(`https://open-meteo-cache/weather?lat=${lat}&lon=${lon}&days=${days}&fields=${fields}`)
      const cache    = caches.default

      const cached = await cache.match(cacheKey)
      if (cached) {
        const data = await cached.json()
        return cors(request, JSON.stringify(data))
      }

      const upstream = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${fields}&forecast_days=${days}&timezone=auto`
      )
      if (!upstream.ok) {
        return cors(request, JSON.stringify({ error: 'upstream failed' }), 502)
      }
      const data = await upstream.json()

      // Store in CF cache for 30 minutes
      await cache.put(cacheKey, new Response(JSON.stringify(data), {
        headers: { 'Cache-Control': 'public, max-age=1800', 'Content-Type': 'application/json' },
      }))

      return cors(request, JSON.stringify(data))
    }

    // ── GET /image-proxy?url=... ──────────────────────────────────────────
    // Fetches an image server-side and re-serves it with proper CORS headers,
    // bypassing browser ORB restrictions on ESA/NASA cross-origin images.
    if (request.method === 'GET' && url.pathname === '/image-proxy') {
      const imageUrl = url.searchParams.get('url')
      if (!imageUrl) return cors(request, JSON.stringify({ error: 'No URL' }), 400)

      // Only allow http(s) URLs
      if (!/^https?:\/\//i.test(imageUrl)) {
        return cors(request, JSON.stringify({ error: 'Invalid URL' }), 400)
      }

      // Normalize URL: re-encode any non-ASCII / bare special characters
      let safeUrl = imageUrl
      try { safeUrl = new URL(imageUrl).href } catch { /* use as-is */ }

      try {
        const upstream = await fetch(safeUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NightGazerBot/1.0)',
            'Accept':     'image/webp,image/jpeg,image/png,image/*',
            'Referer':    new URL(safeUrl).origin + '/',
          },
          redirect: 'follow',
        })

        if (!upstream.ok) {
          return cors(request, JSON.stringify({ error: `Upstream ${upstream.status}` }), 502)
        }

        const ct = upstream.headers.get('Content-Type') || ''
        if (!ct.startsWith('image/')) {
          return cors(request, JSON.stringify({ error: 'Not an image' }), 415)
        }

        // Stream the body directly — avoids buffering large images into Worker memory
        return new Response(upstream.body, {
          status: 200,
          headers: {
            'Content-Type':                ct,
            'Cache-Control':               'public, max-age=86400, stale-while-revalidate=604800',
            'Access-Control-Allow-Origin': '*',
            'Vary':                        'Accept',
          },
        })
      } catch (e) {
        return cors(request, JSON.stringify({ error: 'Upstream fetch failed' }), 502)
      }
    }

    // ── GET /launches → Aankomende lanceringen (7 dagen, via Launch Library 2) ──
    // Cachet 1 uur in CF Cache API — LL2 free tier is max 15 req/uur.
    if (request.method === 'GET' && url.pathname === '/launches') {
      const cacheKey = new Request('https://ll2-launches-cache/launches-7d')
      const cache    = caches.default

      const cached = await cache.match(cacheKey)
      if (cached) {
        const data = await cached.json()
        return cors(request, JSON.stringify(data))
      }

      // Kleine lookup map: LL2 naam-prefix → missie-id op nightgazer.space
      const MISSION_ID_MAP = {
        'starship':       'starship',
        'artemis':        'artemis',
        'perseverance':   'perseverance',
        'james webb':     'jwst',
        'webb':           'jwst',
        'smile':          'smile',
        'juice':          'juice',
        'curiosity':      'curiosity',
        'voyager':        'voyager1',
        'europa clipper': 'europa-clipper',
      }

      function resolveMissionId(name) {
        const lower = (name || '').toLowerCase()
        for (const [key, id] of Object.entries(MISSION_ID_MAP)) {
          if (lower.includes(key)) return id
        }
        return null
      }

      try {
        const now    = new Date().toISOString()
        const plus7  = new Date(Date.now() + 7 * 86400 * 1000).toISOString()
        const ll2Res = await fetch(
          `https://ll.thespacedevs.com/2.3.0/launches/upcoming/?format=json&limit=10` +
          `&window_start__gte=${now}&window_start__lte=${plus7}&ordering=window_start`,
          { headers: { 'User-Agent': 'NightGazer/1.0 (nightgazer.space)' } }
        )

        if (!ll2Res.ok) {
          return cors(request, JSON.stringify({ error: `LL2 ${ll2Res.status}` }), 502)
        }

        const ll2Data = await ll2Res.json()
        const launches = (ll2Data.results || []).map(l => ({
          id:          l.id,
          name:        l.mission?.name || l.name || '',
          agency:      l.launch_service_provider?.name || '',
          vehicle:     l.rocket?.configuration?.name || '',
          pad:         l.pad?.name || '',
          windowStart: l.window_start,
          windowEnd:   l.window_end,
          status:      l.status?.name || 'Onbekend',
          missionId:   resolveMissionId(l.mission?.name || l.name || ''),
        }))

        const response = new Response(JSON.stringify(launches), {
          headers: {
            'Content-Type':  'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        })
        await cache.put(cacheKey, response.clone())
        return cors(request, JSON.stringify(launches))
      } catch (e) {
        return cors(request, JSON.stringify({ error: 'LL2 niet bereikbaar' }), 502)
      }
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
      return cors(request, JSON.stringify(data))
    }

    return cors(request, JSON.stringify({ error: 'Not found' }), 404)
  },
}
