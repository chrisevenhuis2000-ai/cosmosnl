// Alle bekende slugs voor statische export
export const KNOWN_SLUGS = [
  'james-webb-k2-18b-biosignatuur',
  'desi-donkere-energie',
  'starship-mechazilla',
  'perseverance-mars',
  'komeet-c2026-a1',
  'neutronenster-uitgelegd',
]

export function generateStaticParams() {
  return KNOWN_SLUGS.map(slug => ({ slug }))
}