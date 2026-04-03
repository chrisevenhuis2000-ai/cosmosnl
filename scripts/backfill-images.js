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
 *     - Poging 1: Claude-query, pagina 1
 *     - Poging 2: eerste 3 woorden van Claude-query, pagina 1
 *     - Poging 3: categorie-fallback, pagina 1
 *  3. Sla imageUrl / imageAlt / imageCredit op in de frontmatter
 */

const fs   = require('fs')
const path = require('path')

const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles')
const PROXY        = 'https://cosmosnl-proxy.chrisevenhuis2000.workers.dev'
const FORCE        = process.argv.includes('--force')

// ── Fallback queries per categorie ────────────────────────────────────────────

const CAT_QUERIES = {
  'missies':       'rocket launch spacecraft',
  'james-webb':    'james webb space telescope infrared',
  'kosmologie':    'galaxy nebula deep space cosmos',
  'mars':          'mars red planet surface rover',
  'sterrenkijken': 'night sky stars milky way',
  'educatie':      'astronaut earth orbit space station',
  'maan':          'moon lunar surface craters',
  'kometen':       'comet astronomy solar system',
  'komeet':        'comet astronomy solar system',
  'zon':           'sun solar flare corona',
  'planeten':      'planet solar system',
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

// ── Claude: genereer zoekterm op basis van volledige artikelinhoud ─────────────

function stripMarkdown(md) {
  return md
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*?([^*\n]+)\*\*?/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/^\s*[-*+>]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Zorg dat de query één regel is en niet te lang
function sanitizeQuery(raw) {
  return raw
    .split(/[\n\r]/)[0]   // alleen de eerste regel
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

async function getQueryFromClaude(title, body) {
  const plainText = stripMarkdown(body).slice(0, 2500)

  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 20,
    system: [
      'You generate English image search queries for NASA or Pexels.',
      'Reply with ONLY 3-5 keywords on a single line — no explanation, no quotes, no newlines.',
      'Focus on the most visually distinctive subject: spacecraft name, celestial object, or event.',
    ].join(' '),
    messages: [{
      role: 'user',
      content: `Dutch article title: ${title}\n\nContent:\n${plainText}`,
    }],
  }

  try {
    const res  = await fetch(PROXY, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data  = await res.json()
    const raw   = data?.content?.[0]?.text
    if (raw) {
      const query = sanitizeQuery(raw)
      if (query.length >= 3) return query
    }
  } catch (e) {
    console.warn(`  ⚠ Claude error: ${e.message}`)
  }
  return null
}

// ── Image fetch via CF Worker (3 pogingen) ────────────────────────────────────

async function tryWorker(q, hash) {
  const url = `${PROXY}/image-search?q=${encodeURIComponent(q)}&hash=${hash}&page=1`
  try {
    const res  = await fetch(url)
    const data = await res.json()
    if (data.url) return { imageUrl: data.url, imageCredit: data.credit || 'NASA' }
  } catch (e) {
    console.warn(`  ⚠ Worker error (q="${q}"): ${e.message}`)
  }
  return null
}

async function fetchImage(slug, claudeQuery, category) {
  const hash = Math.abs(slug.split('').reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0))

  const catQuery  = CAT_QUERIES[(category || '').toLowerCase()] || 'space astronomy cosmos stars'
  // Kortere versie van de Claude-query (eerste 3 woorden)
  const shortQuery = claudeQuery ? claudeQuery.split(' ').slice(0, 3).join(' ') : null

  const attempts = [
    claudeQuery,   // Poging 1: volledige Claude-query
    shortQuery,    // Poging 2: eerste 3 woorden
    catQuery,      // Poging 3: categorie-fallback
  ].filter(Boolean)

  for (const q of attempts) {
    const result = await tryWorker(q, hash)
    if (result) return { ...result, usedQuery: q }
    await new Promise(r => setTimeout(r, 300))
  }
  return null
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))
  let updated = 0
  let skipped = 0
  let failed  = 0

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
    const claudeQuery = await getQueryFromClaude(title, body)
    if (claudeQuery) {
      console.log(`  🤖 Claude: "${claudeQuery}"`)
    } else {
      console.log(`  🤖 Claude: (mislukt, direct naar fallback)`)
    }

    // Stap 2: Haal afbeelding op (3 pogingen)
    const img = await fetchImage(slug, claudeQuery, category)

    if (!img) {
      console.log('  ✗ Geen afbeelding gevonden')
      failed++
      continue
    }

    const label = img.usedQuery === claudeQuery ? '🎯' : img.usedQuery === claudeQuery?.split(' ').slice(0, 3).join(' ') ? '✂️' : '🔀'
    console.log(`  ${label} Query gebruikt: "${img.usedQuery}"`)

    // Stap 3: Sla op in frontmatter
    fm.imageUrl    = img.imageUrl
    fm.imageAlt    = title
    fm.imageCredit = img.imageCredit

    const newContent = `---\n${rebuildFrontmatter(fm)}\n---\n${body}`
    fs.writeFileSync(filePath, newContent, 'utf-8')
    updated++
    console.log(`  ✅ ${img.imageUrl.slice(0, 70)}`)

    await new Promise(r => setTimeout(r, 400))
  }

  console.log(`\n\n✨ Klaar! ${updated} bijgewerkt, ${skipped} overgeslagen, ${failed} mislukt.`)
}

main().catch(console.error)
