import fs from 'fs'
import path from 'path'

export function getAllSlugs(): string[] {
  const dir = path.join(process.cwd(), 'content', 'articles')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''))
}
