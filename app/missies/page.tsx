import type { Metadata } from 'next'
import MissiesClient from './MissiesClient'

export const metadata: Metadata = {
  title:       'Ruimtemissies',
  description: 'Volg actieve ruimtemissies van NASA, ESA en meer. Live status, interactieve zonnestelselkaart en lanceertijdlijn.',
  openGraph: {
    title:       'Ruimtemissies — NightGazer',
    description: 'Live status van Starship, JWST, Perseverance en meer — met interactieve kaart en tijdlijn.',
  },
}

export default function Page() {
  return <MissiesClient />
}
