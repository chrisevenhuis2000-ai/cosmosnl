import type { Metadata } from 'next'
import EducatieClient from './EducatieClient'

export const metadata: Metadata = {
  title:       'Educatie',
  description: 'Leer over astronomie op jouw niveau — van beginner tot expert. Interactieve lessen, quizzen en uitleg over het heelal.',
  openGraph: {
    title:       'Educatie — NightGazer',
    description: 'Astronomie-educatie op maat: interactieve lessen en quizzen voor elk niveau.',
  },
}

export default function Page() {
  return <EducatieClient />
}
