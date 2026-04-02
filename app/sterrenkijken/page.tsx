import type { Metadata } from 'next'
import SterrenkijkenClient from './SterrenkijkenClient'

export const metadata: Metadata = {
  title:       'Sterrenkijken',
  description: 'Vind de donkerste plekken in Nederland, bekijk live hemelcondities en plan je sterrenkijkavond met onze interactieve kaart.',
  openGraph: {
    title:       'Sterrenkijken — NightGazer',
    description: 'Interactieve dark-sky kaart, weersverwachting en tips voor de beste sterrenkijkplekken in Nederland.',
  },
}

export default function Page() {
  return <SterrenkijkenClient />
}
