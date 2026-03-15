import ArticleClient from './ArticleClient'

export function generateStaticParams() {
  return [
    'james-webb-k2-18b-biosignatuur',
    'desi-donkere-energie',
    'starship-mechazilla',
    'perseverance-mars',
    'komeet-c2026-a1',
    'neutronenster-uitgelegd',
  ].map(slug => ({ slug }))
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return <ArticleClient slug={params.slug} />
}
