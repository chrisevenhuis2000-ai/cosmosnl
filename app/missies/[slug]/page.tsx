import { MISSIONS } from '@/lib/missions-data'
import MissionDetailClient from './MissionDetailClient'

export function generateStaticParams() {
  return MISSIONS.map(m => ({ slug: m.id }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const m = MISSIONS.find(x => x.id === params.slug)
  return {
    title: m ? `${m.name} — NightGazer Ruimtemissies` : 'Missie — NightGazer',
    description: m?.objective ?? '',
  }
}

export default function MissionPage({ params }: { params: { slug: string } }) {
  return <MissionDetailClient slug={params.slug} />
}
