#!/usr/bin/env node
/**
 * scripts/backfill-images.js
 *
 * Run: npm run backfill-images
 *
 * Loops over every article in content/articles/ that has no imageUrl,
 * queries the NASA Images API with the article title, and writes the result
 * back into the frontmatter.
 */

const fs   = require('fs')
const path = require('path')

const ARTICLES_DIR = path.join(__dirname, '..', 'content', 'articles')

function parseFrontmatter(raw) {
  // Normalise line endings (Windows \r\n → \n)
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
  const lines = Object.entries(fm).map(([k, v]) => {
    // Preserve arrays like tags: []
    if (v === '[]' || (v.startsWith('[') && v.endsWith(']'))) return `${k}: ${v}`
    return `${k}: "${String(v).replace(/"/g, '\\"')}"`
  })
  return lines.join('\n')
}

async function fetchNasaImage(title, source) {
  const query  = title.slice(0, 80)
  const apiUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=5`
  try {
    const res   = await fetch(apiUrl)
    const data  = await res.json()
    const items = data?.collection?.items || []
    for (const item of items) {
      const href = item?.links?.[0]?.href ?? ''
      if (href && /\.(jpg|jpeg|png|webp)/i.test(href)) {
        const photographer = item?.data?.[0]?.photographer ?? ''
        const center       = item?.data?.[0]?.center ?? 'NASA'
        return {
          imageUrl:    href,
          imageAlt:    title,
          imageCredit: photographer ? `${photographer} / ${center}` : center,
        }
      }
    }
  } catch (e) {
    console.warn(`  ⚠ NASA API error for "${title}": ${e.message}`)
  }
  return null
}

async function main() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'))
  let updated = 0

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file)
    const raw      = fs.readFileSync(filePath, 'utf-8')
    const { fm, body } = parseFrontmatter(raw)

    // Skip if already has an imageUrl
    if (fm.imageUrl && fm.imageUrl.trim() !== '') {
      process.stdout.write('.')
      continue
    }

    const title  = fm.title || file.replace('.md', '').replace(/-/g, ' ')
    const source = fm.source || 'NASA'
    console.log(`\n  🔍 Zoeken afbeelding: ${title.slice(0, 60)}`)

    const img = await fetchNasaImage(title, source)
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
    console.log(`  ✅ ${img.imageUrl.slice(0, 60)}...`)

    // Avoid hammering the API
    await new Promise(r => setTimeout(r, 400))
  }

  console.log(`\n✨ Klaar! ${updated} artikelen bijgewerkt met afbeelding.`)
}

main().catch(console.error)
