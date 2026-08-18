import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TOPICS, getTopic } from '@/lib/topics'
import NieuwsClient from '../../NieuwsClient'

export function generateStaticParams() {
  return TOPICS.map(t => ({ category: t.slug }))
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const topic = getTopic(params.category)
  if (!topic) return {}
  const title = `${topic.label} — Nieuws | NightGazer`
  return {
    title,
    description: topic.description,
    openGraph: { title, description: topic.description, type: 'website' },
  }
}

export default function TopicPage({ params }: { params: { category: string } }) {
  const topic = getTopic(params.category)
  if (!topic) notFound()
  return <NieuwsClient initialCategory={topic.slug} />
}
