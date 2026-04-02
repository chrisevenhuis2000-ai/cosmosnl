const fs   = require('fs')
const path = require('path')

const DOMAIN       = 'https://nightgazer.space'
const ARTICLES_DIR = path.join(__dirname, '../content/articles')
const MISSIONS     = ['starship', 'artemis', 'perseverance', 'jwst', 'smile', 'juice', 'curiosity', 'voyager1', 'europa-clipper']
const OUTPUT       = path.join(__dirname, '../public/sitemap.xml')

const today = new Date().toISOString().slice(0, 10)

// Static pages
const pages = [
  { loc: '/',              changefreq: 'daily',   priority: '1.0' },
  { loc: '/missies',       changefreq: 'weekly',  priority: '0.8' },
  { loc: '/sterrenkijken', changefreq: 'weekly',  priority: '0.7' },
  { loc: '/educatie',      changefreq: 'monthly', priority: '0.6' },
]

// Mission detail pages
for (const id of MISSIONS) {
  pages.push({ loc: `/missies/${id}`, changefreq: 'monthly', priority: '0.6' })
}

// Article pages
if (fs.existsSync(ARTICLES_DIR)) {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))
  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    pages.push({ loc: `/nieuws/${slug}`, changefreq: 'monthly', priority: '0.5' })
  }
}

// Build XML
const urls = pages.map(p => `  <url>
    <loc>${DOMAIN}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

fs.writeFileSync(OUTPUT, xml)
console.log(`✓ Sitemap: ${pages.length} URLs → public/sitemap.xml`)
