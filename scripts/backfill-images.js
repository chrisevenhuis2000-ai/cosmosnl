#!/usr/bin/env node
/**
 * scripts/backfill-images.js
 *
 * Run: npm run backfill-images
 * Run: npm run backfill-images -- --force   (re-fetch even if imageUrl already set)
 *
 * Loops over every article in content/articles/ that has no imageUrl,
 * queries the CF Worker (NASA + Pexels fallback) using a smart English query
 * built from the Dutch article title + category, and writes the result
 * back into the frontmatter.
 */

const fs   = require('fs')
const path = require('path')

const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles')
const PROXY        = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'
const FORCE        = process.argv.includes('--force')

// ── Query building ────────────────────────────────────────────────────────────

const CAT_QUERIES = {
  'missies':       'rocket launch spacecraft',
  'james-webb':    'james webb space telescope infrared',
  'kosmologie':    'galaxy nebula deep space cosmos',
  'mars':          'mars red planet surface',
  'sterrenkijken': 'night sky stars milky way',
  'educatie':      'astronaut earth orbit space station',
  'maan':          'moon lunar surface craters',
  'kometen':       'comet astronomy solar system',
  'komeet':        'comet astronomy solar system',
  'zon':           'sun solar flare corona',
  'planeten':      'planet solar system',
}

const SPACE_NOUNS = [
  'starship','falcon','artemis','starlink','spacex','hubble','webb','jwst',
  'perseverance','curiosity','ingenuity','voyager','cassini','landsat',
  'starliner','dragon','orion','sls','iss','juice','clipper','ariel',
  'saturn','jupiter','venus','mercury','neptune','uranus','pluto',
  'mars','moon','lunar','comet','asteroid','nebula','galaxy','aurora',
  'rocket','launch','orbit','astronaut','satellite','telescope','solar',
]

const NL_EN = {
  'lancering':'launch', 'lanceert':'launch', 'gelanceerd':'launch',
  'raket':'rocket', 'satelliet':'satellite', 'ruimtestation':'space station',
  'maan':'moon', 'maansverduistering':'lunar eclipse',
  'zon':'sun', 'zonsverduistering':'solar eclipse',
  'sterrenstelsel':'galaxy', 'melkweg':'milky way',
  'komeet':'comet', 'meteorenregen':'meteor shower',
  'astronaut':'astronaut', 'telescoop':'telescope',
  'nevel':'nebula', 'planeet':'planet', 'missie':'mission',
  'booster':'booster', 'vlucht':'flight', 'baan':'orbit',
  'oppervlak':'surface', 'dampkring':'atmosphere', 'heelal':'cosmos',
}

function slugHash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function buildQuery(title, category) {
  const lower = title.toLowerCase()

  // Step 1: English proper nouns / space terms already in the title
  const nouns = SPACE_NOUNS.filter(n => lower.includes(n))
  if (nouns.length >= 1) return nouns.slice(0, 3).join(' ')

  // Step 2: translate Dutch words
  const words      = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/)
  const translated = [...new Set(words.map(w => NL_EN[w]).filter(Boolean))].slice(0, 3)
  if (translated.length >= 1) return translated.join(' ')

  // Step 3: category fallback
  return CAT_QUERIES[(category || '').toLowerCase()] || 'space astronomy cosmos'
}

// ── Frontmatter helpers ───────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const normalised = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const match = normalised.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { fm: {}, body: normalised, fmRaw: '' }
  const fmRaw = match[1]
  const body  = match[2]
  const fm    = {}
  fmRaw.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
    fm[key] = val
  })
  return { fm, body, fmRaw }
}

function rebuildFrontmatter(fm) {
  return Object.entries(fm).map(([k, v]) => {
    if (v === '[]' || (v.startsWith('[') && v.endsWith(']'))) return `${k}: ${v}`
    return `${k}: "${String(v).replace(/"/g, '\\"')}"`
  }).join('\n')
}

// ── Image fetch via CF Worker ─────────────────────────────────────────────────

async function fetchImage(slug, title, category) {
  const q    = buildQuery(title, category)
  const hash = slugHash(slug)
  const page = (hash % 8) + 1
  const url  = `${PROXY}/image-search?q=${encodeURIComponent(q)}&hash=${hash}&page=${page}`
  try {
    const res  = await fetch(url)
    const data = await res.json()
    if (data.url) {
      return {
        imageUrl:    data.url,
        imageAlt:    title,
        imageCredit: data.credit || 'NASA',
      }
    }
  } catch (e) {
    console.warn(`  ⚠ Worker error for "${title}": ${e.message}`)
  }
  return null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const files   = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))
  let updated   = 0
  let skipped   = 0

  console.log(`🔭 Backfill images — ${files.length} artikelen${FORCE ? ' (--force: alles opnieuw)' : ''}\n`)

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file)
    const raw      = fs.readFileSync(filePath, 'utf-8')
    const { fm, body } = parseFrontmatter(raw)

    if (!FORCE && fm.imageUrl && fm.imageUrl.trim() !== '') {
      process.stdout.write('.')
      skipped++
      continue
    }

    const slug     = file.replace('.md', '')
    const title    = fm.title || slug.replace(/-/g, ' ')
    const category = fm.category || ''
    const query    = buildQuery(title, category)
    console.log(`\n  🔍 [${category || '?'}] ${title.slice(0, 55)} → query: "${query}"`)

    const img = await fetchImage(slug, title, category)
    if (!img) {
      console.log('  ✗ Geen afbeelding gevonden')
      continue
    }

    fm.imageUrl    = img.imageUrl
    fm.imageAlt    = img.imageAlt
    fm.imageCredit = img.imageCredit

    const newContent = `---\n${rebuildFrontmatter(fm)}\n---\n${body}`
    fs.writeFileSync(filePath, newContent, 'utf-8')
    updated++
    console.log(`  ✅ ${img.imageUrl.slice(0, 70)}`)

    // Avoid hammering the API
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\n\n✨ Klaar! ${updated} artikelen bijgewerkt, ${skipped} overgeslagen.`)
}

main().catch(console.error)
