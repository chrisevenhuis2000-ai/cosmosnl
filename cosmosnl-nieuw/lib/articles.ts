import fs   from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Article, Category } from '@/types'

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles')

// Ensure directory exists
if (!fs.existsSync(ARTICLES_DIR)) {
  fs.mkdirSync(ARTICLES_DIR, { recursive: true })
}

export async function getArticles(options: {
  category?: string
  limit?:    number
  featured?: boolean
} = {}): Promise<Article[]> {
  const { category, limit = 20, featured } = options

  if (!fs.existsSync(ARTICLES_DIR)) return []

  const files = fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))

  const articles = files.map(filename => {
    const filePath = path.join(ARTICLES_DIR, filename)
    const raw      = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)

    return {
      slug:        filename.replace(/\.mdx?$/, ''),
      title:       data.title       || 'Untitled',
      excerpt:     data.excerpt     || '',
      category:    data.category    as Category,
      author:      data.author      || 'Redactie CosmosNL',
      publishedAt: data.publishedAt || new Date().toISOString(),
      readTime:    data.readTime    || estimateReadTime(content),
      imageUrl:    data.imageUrl,
      imageAlt:    data.imageAlt,
      imageCredit: data.imageCredit,
      featured:    data.featured    || false,
      tags:        data.tags        || [],
      content,
    } satisfies Article
  })

  // Sort by date desc
  const sorted = articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  // Filter
  let result = sorted
  if (category)         result = result.filter(a => a.category === category)
  if (featured !== undefined) result = result.filter(a => a.featured === featured)

  return result.slice(0, limit)
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`)
  const mdxPath  = path.join(ARTICLES_DIR, `${slug}.mdx`)

  const targetPath = fs.existsSync(filePath) ? filePath
    : fs.existsSync(mdxPath) ? mdxPath
    : null

  if (!targetPath) return null

  const raw = fs.readFileSync(targetPath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    slug,
    title:       data.title       || 'Untitled',
    excerpt:     data.excerpt     || '',
    category:    data.category    as Category,
    author:      data.author      || 'Redactie CosmosNL',
    publishedAt: data.publishedAt || new Date().toISOString(),
    readTime:    data.readTime    || estimateReadTime(content),
    imageUrl:    data.imageUrl,
    imageAlt:    data.imageAlt,
    imageCredit: data.imageCredit,
    featured:    data.featured    || false,
    tags:        data.tags        || [],
    content,
  }
}

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200)) // ~200 wpm
}
