// ── Article ──────────────────────────────────────────────────────────────────
export interface Article {
  slug:        string
  title:       string
  excerpt:     string
  category:    Category
  author:      string
  publishedAt: string      // ISO date string
  readTime:    number      // minutes
  imageUrl?:   string
  imageAlt?:   string
  imageCredit?: string
  featured:    boolean
  tags:        string[]
  content?:    string      // MDX/markdown body
}

// ── Category ─────────────────────────────────────────────────────────────────
export type Category =
  | 'james-webb'
  | 'mars'
  | 'missies'
  | 'kosmologie'
  | 'sterrenkijken'
  | 'educatie'
  | 'zwarte-gaten'
  | 'exoplaneten'
  | 'maan'
  | 'kometen'

export interface CategoryMeta {
  label:  string
  color:  string         // Tailwind color class
  emoji:  string
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  'james-webb':    { label: 'James Webb',    color: 'text-blue-400',   emoji: '🔭' },
  'mars':          { label: 'Mars',          color: 'text-orange-400', emoji: '🔴' },
  'missies':       { label: 'Missies',       color: 'text-cyan-400',   emoji: '🚀' },
  'kosmologie':    { label: 'Kosmologie',    color: 'text-purple-400', emoji: '💫' },
  'sterrenkijken': { label: 'Sterrenkijken', color: 'text-yellow-400', emoji: '🌠' },
  'educatie':      { label: 'Educatie',      color: 'text-green-400',  emoji: '📚' },
  'zwarte-gaten':  { label: 'Zwarte Gaten',  color: 'text-blue-300',   emoji: '⚫' },
  'exoplaneten':   { label: 'Exoplaneten',   color: 'text-teal-400',   emoji: '🪐' },
  'maan':          { label: 'Maan',          color: 'text-slate-300',  emoji: '🌙' },
  'kometen':       { label: 'Kometen',       color: 'text-yellow-300', emoji: '☄️' },
}

// ── Reading Level ─────────────────────────────────────────────────────────────
export type ReadingLevel = 'original' | 'beginner' | 'amateur' | 'pro'

export interface LevelConfig {
  label:      string
  emoji:      string
  description: string
  prompt:     string
}

export const LEVELS: Record<ReadingLevel, LevelConfig> = {
  original: {
    label:       'Origineel',
    emoji:       '📄',
    description: 'Originele redactionele tekst',
    prompt:      '',
  },
  beginner: {
    label:       'Beginner',
    emoji:       '🌱',
    description: 'Geen jargon, heldere analogieën',
    prompt:      `Herschrijf deze alinea astronomisch nieuws in eenvoudig Nederlands voor absolute beginners. Geen vakjargon. Gebruik alledaagse analogieën. Schrijf voor een nieuwsgierige 14-jarige. Korte zinnen. Enthousiast. Geef ALLEEN de herschreven tekst terug.`,
  },
  amateur: {
    label:       'Amateur',
    emoji:       '🔭',
    description: 'Technische termen met uitleg',
    prompt:      `Herschrijf deze alinea voor amateur-astronomen in het Nederlands. Behoud technische termen maar leg ze kort uit. Schrijf informatief en boeiend voor iemand met basiskennis van sterrenkunde. Geef ALLEEN de herschreven tekst terug.`,
  },
  pro: {
    label:       'Pro',
    emoji:       '🎓',
    description: 'Volledige wetenschappelijke precisie',
    prompt:      `Herschrijf deze alinea in wetenschappelijk Nederlands voor astrofysici. Gebruik correcte terminologie. Voeg fysische context toe. Formele, precieze stijl. Geef ALLEEN de herschreven tekst terug.`,
  },
}

// ── NASA APOD ─────────────────────────────────────────────────────────────────
export interface APODResponse {
  date:        string
  title:       string
  explanation: string
  url:         string
  hdurl?:      string
  media_type:  'image' | 'video'
  copyright?:  string
}

// ── ISS ───────────────────────────────────────────────────────────────────────
export interface ISSPosition {
  latitude:   number
  longitude:  number
  altitude:   number
  velocity:   number
  visibility: string
  timestamp:  number
}
