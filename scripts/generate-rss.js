const fs   = require('fs')
const path = require('path')

const SITE_URL  = 'https://nightgazer.space'
const SITE_NAME = 'NightGazer'
const INDEX     = path.join(__dirname, '../public/content/articles-index.json')
const OUTPUT    = path.join(__dirname, '../public/rss.xml')

if (!fs.existsSync(INDEX)) {
  console.log('⚠ articles-index.json niet gevonden, RSS overgeslagen')
  process.exit(0)
}

const articles = JSON.parse(fs.readFileSync(INDEX, 'utf-8'))

// Neem de 20 meest recente
const recent = articles.slice(0, 20)

function escapeXml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfcDate(dateStr) {
  if (!dateStr) return new Date().toUTCString()
  try { return new Date(dateStr).toUTCString() } catch { return new Date().toUTCString() }
}

const items = recent.map(a => `
  <item>
    <title>${escapeXml(a.title)}</title>
    <link>${SITE_URL}/nieuws/${escapeXml(a.slug)}</link>
    <guid isPermaLink="true">${SITE_URL}/nieuws/${escapeXml(a.slug)}</guid>
    <description>${escapeXml(a.excerpt)}</description>
    <category>${escapeXml(a.category)}</category>
    <author>redactie@nightgazer.space (${escapeXml(a.author || 'Redactie')})</author>
    <pubDate>${toRfcDate(a.publishedAt || a.date)}</pubDate>
    ${a.imageUrl ? `<enclosure url="${escapeXml(a.imageUrl)}" type="image/jpeg" length="0" />` : ''}
  </item>`).join('')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} — Ruimtevaartnieuws</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Nederlandstalig ruimtevaartnieuws — van Mars-rovers tot telescopen aan de rand van het heelal.</description>
    <language>nl</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${SITE_URL}/logo-transparent.png</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, xml, 'utf-8')
console.log(`✅ rss.xml aangemaakt (${recent.length} artikelen)`)
