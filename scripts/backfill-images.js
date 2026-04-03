#!/usr/bin/env node
/**
 * scripts/backfill-images.js
 *
 * Run: npm run backfill-images
 * Run: npm run backfill-images -- --force   (re-fetch even if imageUrl already set)
 *
 * Voor elk artikel:
 *  1. Stuur de volledige inhoud naar Claude (via CF Worker) voor een gerichte EN zoekterm
 *  2. Haal een afbeelding op via de CF Worker (NASA + Pexels fallback)
 *  3. Sla imageUrl / imageAlt / imageCredit op in de frontmatter
 */

const fs   = require('fs')
const path = require('path')

const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles')
const PROXY        = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'
const FORCE        = process.argv.includes('--force')

// ── Fallback query building (gebruikt als Claude faalt) ───────────────────────

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

function buildFallbackQuery(title, category) {
  const lower = title.toLowerCase()
  const nouns = SPACE_NOUNS.filter(n => lower.includes(n))
  if (nouns.length >= 1) return nouns.slice(0, 3).join(' ')
  const words      = lower.replace(/[^a-z\s]/g, ' ').split(/\s+/)
  const translated = [...new Set(words.map(w => NL_EN[w]).filter(Boolean))].slice(0, 3)
  if (translated.length >= 1) return translated.join(' ')
  return CAT_QUERIES[(category || '').toLowerCase()] || 'space astronomy cosmos'
}

// ── Claude: genereer zoekterm op basis van volledige artikelinhoud ─────────────

function stripMarkdown(md) {
  return md
    .replace(/^---[\s\S]*?---\n?/, '')        // verwijder frontmatter
    .replace(/#{1,6}\s+/g, '')                // headings
    .replace(/\*\*?([^*\n]+)\*\*?/g, '$1')   // bold/italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/`[^`]+`/g, '')                  // inline code
    .replace(/^\s*[-*+>]\s+/gm, '')           // lijstitems / blockquotes
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function getQueryFromClaude(title, body) {
  const plainText = stripMarkdown(body).slice(0, 2500)

  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 25,
    system: [
      'You generate short English image search queries for NASA/Pexels.',
      'Reply with ONLY 3-6 English keywords — no explanation, no quotes, no punctuation.',
      'Focus on the most visually distinctive subject of the article (spacecraft name, celestial object, event).',
    ].join(' '),
    messages: [{
      role: 'user',
      content: `Article title (Dutch): ${title}\n\nContent:\n${plainText}`,
    }],
  }

  try {
    const res  = await fetch(PROXY, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data  = await res.json()
    const query = data?.content?.[0]?.text?.trim()
    if (query && query.length >= 3 && query.length <= 120) {
      return query
    }
  } catch (e) {
    console.warn(`  ⚠ Claude error: ${e.message}`)
  }
  return null
}

// ── Frontmatter helpers ───────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const normalised = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const match = normalised.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { fm: {}, body: normalised }
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
  return { fm, body }
}

function rebuildFrontmatter(fm) {
  return Object.entries(fm).map(([k, v]) => {
    if (v === '[]' || (v.startsWith('[') && v.endsWith(']'))) return `${k}: ${v}`
    return `${k}: "${String(v).replace(/"/g, '\\"')}"`
  }).join('\n')
}

// ── Image fetch via CF Worker ─────────────────────────────────────────────────

async function fetchImage(slug, query) {
  const hash = slugHash(slug)
  const page = (hash % 8) + 1
  const url  = `${PROXY}/image-search?q=${encodeURIComponent(query)}&hash=${hash}&page=${page}`
  try {
    const res  = await fetch(url)
    const data = await res.json()
    if (data.url) {
      return {
        imageUrl:    data.url,
        imageCredit: data.credit || 'NASA',
      }
    }
  } catch (e) {
    console.warn(`  ⚠ Worker error: ${e.message}`)
  }
  return null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))
  let updated = 0
  let skipped = 0

  console.log(`🔭 Backfill images — ${files.length} artikelen${FORCE ? ' (--force)' : ''}\n`)

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

    console.log(`\n  📄 ${title.slice(0, 60)}`)

    // Stap 1: Claude genereert een gerichte zoekterm op basis van volledige inhoud
    let query = await getQueryFromClaude(title, body)
    if (query) {
      console.log(`  🤖 Claude query: "${query}"`)
    } else {
      query = buildFallbackQuery(title, category)
      console.log(`  🔀 Fallback query: "${query}"`)
    }

    // Stap 2: Haal afbeelding op via CF Worker
    const img = await fetchImage(slug, query)
    if (!img) {
      console.log('  ✗ Geen afbeelding gevonden')
      continue
    }

    // Stap 3: Sla op in frontmatter
    fm.imageUrl    = img.imageUrl
    fm.imageAlt    = title
    fm.imageCredit = img.imageCredit

    const newContent = `---\n${rebuildFrontmatter(fm)}\n---\n${body}`
    fs.writeFileSync(filePath, newContent, 'utf-8')
    updated++
    console.log(`  ✅ ${img.imageUrl.slice(0, 70)}`)

    // Kleine pauze om de APIs niet te overbelasten
    await new Promise(r => setTimeout(r, 600))
  }

  console.log(`\n\n✨ Klaar! ${updated} bijgewerkt, ${skipped} overgeslagen.`)
}

main().catch(console.error)
