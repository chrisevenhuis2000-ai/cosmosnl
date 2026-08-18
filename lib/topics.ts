export interface Topic {
  slug:        string
  label:       string
  emoji:       string
  color:       string
  description: string
}

// Onderwerpen met genoeg artikelen voor een eigen pagina (/nieuws/onderwerp/[slug]).
// Categorieën met nauwelijks content (bv. zwarte-gaten, exoplaneten) krijgen bewust
// geen eigen pagina — dat zou een lege/dunne pagina opleveren.
export const TOPICS: Topic[] = [
  { slug: 'missies',    label: 'Missies',    emoji: '🚀', color: '#3dcfdf', description: 'Lanceringen, ruimtestations en de nieuwste ruimtemissies van NASA, ESA, SpaceX en meer.' },
  { slug: 'educatie',   label: 'Educatie',   emoji: '⭐', color: '#3ddf90', description: 'Achtergrondverhalen en uitleg over astronomie, van beginner tot professional.' },
  { slug: 'mars',       label: 'Mars',       emoji: '🔴', color: '#ff8a60', description: 'Rovers, missies en ontdekkingen op en rond de rode planeet.' },
  { slug: 'maan',       label: 'Maan',       emoji: '🌙', color: '#c9d2ea', description: 'Artemis, maanlandingen en alles wat er te ontdekken is op onze eigen maan.' },
  { slug: 'james-webb', label: 'James Webb', emoji: '🔭', color: '#7aadff', description: 'De nieuwste beelden en ontdekkingen van de James Webb-ruimtetelescoop.' },
  { slug: 'kosmologie', label: 'Kosmologie', emoji: '💫', color: '#c080ff', description: 'Zwarte gaten, sterrenstelsels en de grootste vragen over ons heelal.' },
  { slug: 'kometen',    label: 'Kometen',    emoji: '☄️', color: '#f4c26b', description: 'Kometen, asteroïden en andere bezoekers uit het buitenste zonnestelsel.' },
]

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find(t => t.slug === slug)
}
