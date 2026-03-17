import ArticleClient from './ArticleClient'
import { getAllSlugs } from './generateParams'

export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return <ArticleClient slug={params.slug} />
}
