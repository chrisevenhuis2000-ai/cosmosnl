# 🔭 CosmosNL

> Astronomie voor iedereen — van beginners tot professionals, in Nederlands én Engels.

Het Nederlandse astronomie-platform met AI-aangedreven uitleg op jouw niveau.

## ✨ Features

- **AI Niveau-Toggle** — elk artikel herschreven door Claude voor Beginner / Amateur / Pro
- **Live NASA APOD** — dagelijkse astronomische foto automatisch in de hero
- **Live ISS Tracker** — realtime positie van het internationale ruimtestation
- **Auto-publicatie** — GitHub Actions haalt dagelijks nieuws op van NASA, ESA en SpaceflightNow
- **Meertalig** — Nederlands + Engels
- **AdSense ready** — geoptimaliseerd voor monetisatie

---

## 🚀 Lokaal starten

### 1. Vereisten
- Node.js 18+
- Een gratis [Anthropic API key](https://console.anthropic.com/)
- (Optioneel) Gratis [NASA API key](https://api.nasa.gov/)

### 2. Installeren

```bash
git clone https://github.com/jouwnaam/cosmosnl.git
cd cosmosnl
npm install
```

### 3. Environment variabelen instellen

```bash
cp .env.example .env.local
# Vul je API keys in .env.local
```

### 4. Dev server starten

```bash
npm run dev
# Open http://localhost:3000
```

---

## 📁 Projectstructuur

```
cosmosnl/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Homepage
│   ├── nieuws/[slug]/          # Artikel pagina (met niveau-toggle)
│   ├── sterrenkijken/          # Sterrenkijken sectie
│   ├── missies/                # Ruimtemissies sectie
│   ├── educatie/               # Educatie sectie
│   ├── tools/herschrijver/     # Standalone AI Herschrijver tool
│   └── api/
│       ├── apod/               # NASA APOD proxy (gecacht)
│       ├── iss/                # ISS positie proxy
│       ├── rewrite/            # Claude AI rewrite endpoint (streaming)
│       └── articles/           # Artikelen API
│
├── components/
│   ├── layout/                 # Header, Footer, TopBar
│   ├── article/                # ArticleCard, ArticleGrid, LevelToggle
│   ├── widgets/                # ISSTracker, APODWidget, NewsletterForm
│   └── ui/                     # Button, Badge, Skeleton, etc.
│
├── lib/
│   └── articles.ts             # Markdown artikel loader
│
├── types/
│   └── index.ts                # TypeScript types + LEVELS/CATEGORIES config
│
├── content/
│   └── articles/               # Markdown bestanden (auto-gegenereerd + handmatig)
│       └── *.md
│
├── scripts/
│   └── fetch-articles.js       # Auto-fetch script (RSS → Claude → Markdown)
│
├── .github/
│   └── workflows/
│       └── fetch-articles.yml  # Dagelijkse GitHub Action
│
├── .env.example                # Environment variabelen template
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🤖 Automatisch artikelen ophalen

```bash
# Handmatig uitvoeren
ANTHROPIC_API_KEY=sk-... npm run fetch-articles

# Of stel GitHub Secrets in voor de dagelijkse Action:
# ANTHROPIC_API_KEY = jouw Anthropic key
```

De script haalt artikelen op van:
- 🚀 **NASA Breaking News** RSS
- 🛸 **SpaceflightNow** RSS
- 🌍 **ESA Space Science** RSS

Elk artikel wordt automatisch vertaald naar het Nederlands door Claude.

---

## 🌐 Deployen

### Cloudflare Pages (aanbevolen — gratis)

```bash
# 1. Push naar GitHub
git push origin main

# 2. Verbind repo in Cloudflare Pages dashboard
# 3. Build command: npm run build
# 4. Output dir: .next
# 5. Voeg environment variabelen toe in Cloudflare dashboard
```

### Vercel (alternatief)

```bash
npx vercel --prod
# Vercel detecteert Next.js automatisch
```

---

## 💰 AdSense instellen

1. Vraag AdSense aan op [adsense.google.com](https://adsense.google.com) (vereist ~20 artikelen)
2. Voeg je Publisher ID toe aan `.env.local`:
   ```
   NEXT_PUBLIC_ADSENSE_ID=ca-pub-xxxxxxxxxxxxxxxxx
   ```
3. AdSense componenten zijn al klaar in `components/ui/AdSense.tsx`

---

## 📊 Verdienmodel

| Bron | Geschat bij 10k bezoekers/maand |
|------|----------------------------------|
| Google AdSense | €30–80 |
| Telescoop affiliates (bol.com) | €20–60 |
| Sterrenkijken apps affiliates | €10–30 |
| **Totaal** | **€60–170/maand** |

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Claude claude-sonnet-4-20250514 (Anthropic)
- **Content**: Markdown + gray-matter
- **Automatisering**: GitHub Actions + RSS Parser
- **APIs**: NASA APOD, wheretheiss.at, JPL Horizons
- **Hosting**: Cloudflare Pages (gratis) of Vercel

---

*Gebouwd met ❤️ voor de Nederlandse astronomiegemeenschap*
