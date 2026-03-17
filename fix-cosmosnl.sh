#!/bin/bash
# CosmosNL — Fix script
# Run vanuit de root van het project: bash fix-cosmosnl.sh

set -e
echo "🔧 CosmosNL fixes toepassen..."

# ── FIX 1: Markdown artikelen aanmaken ─────────────────────────────────────
mkdir -p content/articles

cat > content/articles/desi-donkere-energie.md << 'MDEOF'
---
title: "DESI: donkere energie verzwakt al 4,5 miljard jaar"
excerpt: "De grootste 3D kaart van het heelal toont dat de kracht van donkere energie niet constant is — een potentiële revolutie in de kosmologie."
category: "kosmologie"
author: "Redactie CosmosNL"
publishedAt: "2026-03-09T10:00:00.000Z"
readTime: 5
featured: false
tags: ["donkere energie", "DESI", "kosmologie", "heelal"]
---

# DESI: donkere energie verzwakt al 4,5 miljard jaar

De Dark Energy Spectroscopic Instrument (DESI) heeft de grootste 3D-kaart van het heelal gemaakt — en de resultaten schudden de kosmologie wakker.

## Wat is DESI?

DESI is gemonteerd op de Nicholas U. Mayall Telescoop in Arizona en kan gelijktijdig het licht van meer dan 5.000 sterrenstelsels meten. In drie jaar zijn meer dan 40 miljoen sterrenstelsels in kaart gebracht.

## De ontdekking

Donkere energie — de kracht die de uitdijing van het heelal versnelt — lijkt niet constant te zijn. Ongeveer 4,5 miljard jaar geleden was de kracht zwakker dan vandaag. Dit daagt de **kosmologische constante** (Λ) van Einstein rechtstreeks uit.

## Wat betekent dit?

Als donkere energie verandert over de tijd, dan moet het standaard kosmologische model (ΛCDM) herzien worden. Sommige theoretici spreken al van **quintessence** — een dynamisch veld dat evolueert met de tijd.

## Hoe zeker zijn we?

De statistische zekerheid ligt op 3,9 sigma — net onder de gouden standaard van 5 sigma. Verdere observaties met DESI én de Euclid-telescoop van ESA moeten uitsluitsel geven.
MDEOF

cat > content/articles/starship-mechazilla.md << 'MDEOF'
---
title: "Starship IFT-7: booster gevangen door Mechazilla"
excerpt: "SpaceX' mechanische arm ving opnieuw de Super Heavy booster op — een mijlpaal voor volledig herbruikbare ruimtevaart."
category: "missies"
author: "Redactie CosmosNL"
publishedAt: "2026-03-07T14:00:00.000Z"
readTime: 4
featured: false
tags: ["SpaceX", "Starship", "Mechazilla", "ruimtevaart"]
---

# Starship IFT-7: booster gevangen door Mechazilla

SpaceX heeft opnieuw een historische mijlpaal bereikt: de Super Heavy booster werd perfect opgevangen door de "Mechazilla" armen op het lanceerplatform in Boca Chica, Texas.

## Wat gebeurde er?

Bij de zevende vluchttest steeg het complete Starship-systeem op, vloog een suborbitale baan en keerde terug. De Super Heavy booster werd op enkele meters hoogte gevangen door de mechanische armen van de lanceerttoren.

## Waarom is dit zo belangrijk?

- **Geen landingspoten** → minder gewicht → meer lading
- **Directe herstart** → booster kan binnen uren opnieuw worden gelanceerd  
- **Kostenreductie** → herbruikbaarheid is de sleutel tot goedkope ruimtevaart

## Volgende stap

IFT-8 richt zich op het opvangen van ook het Starship-schip (bovenste deel) met Mechazilla. Als dat lukt, is het systeem vrijwel volledig herbruikbaar — een revolutie in de ruimtevaart.
MDEOF

cat > content/articles/perseverance-mars.md << 'MDEOF'
---
title: "Perseverance vindt 'luipaardvlekken' in Jezero krater"
excerpt: "Vreemde geologische patronen op Mars verbazen wetenschappers wereldwijd."
category: "mars"
author: "Redactie CosmosNL"
publishedAt: "2026-03-05T09:00:00.000Z"
readTime: 3
featured: false
tags: ["Mars", "Perseverance", "geologie", "NASA"]
---

# Perseverance vindt 'luipaardvlekken' in Jezero krater

De NASA-rover Perseverance heeft vreemde donkere, afgeronde vlekken gefotografeerd op de bodem van de Jezero krater — intern al "luipaardvlekken" genoemd.

## Drie hypotheses

**1. Chemische neerslag** — mineraalrijke vloeistoffen sloegen donker mineraal neer in cirkelvormige patronen.

**2. Biologische oorsprong?** — Op Aarde zijn vergelijkbare patronen soms geassocieerd met endolithische microben. De meest speculatieve maar opwindende hypothese.

**3. Impact-gerelateerd** — kleine impactjes verplaatsten lokaal mineralen.

## Wat nu?

Perseverance heeft monsterbuisjes gevuld met materiaal van de vlekken. De Mars Sample Return-missie brengt ze naar de Aarde voor definitieve analyse.
MDEOF

cat > content/articles/komeet-c2026-a1.md << 'MDEOF'
---
title: "Komeet C/2026 A1 mogelijk zichtbaar met blote oog"
excerpt: "Astronomen zijn enthousiast over een heldere komeet die in april zichtbaar wordt."
category: "sterrenkijken"
author: "Redactie CosmosNL"
publishedAt: "2026-03-03T08:00:00.000Z"
readTime: 3
featured: false
tags: ["komeet", "sterrenkijken", "blote oog"]
---

# Komeet C/2026 A1 mogelijk zichtbaar met blote oog

Een nieuw ontdekte komeet trekt in april 2026 dicht langs de zon en kan dan met het blote oog zichtbaar worden vanuit Nederland.

## Wanneer kijken?

- **Beste periode:** 5–20 april 2026
- **Richting:** Westelijke hemel, kort na zonsondergang
- **Verwachte helderheid:** Magnitude 2–4

## Tips

Met blote oog: zoek een donkere plek, geef je ogen 20 minuten om te wennen. Met verrekijker (7×50): prachtige details van de coma en staart. Met telescoop: gebruik lage vergroting (25–50×).

## Let op

Kometen zijn grillig. Komeet Kohoutek (1973) werd "de komeet van de eeuw" genoemd — en stelde zwaar teleur. Maar als C/2026 A1 houdt wat de vroege metingen beloven, wordt april onvergetelijk.
MDEOF

cat > content/articles/neutronenster-uitgelegd.md << 'MDEOF'
---
title: "Wat is een neutronenster? Uitleg in 3 niveaus"
excerpt: "Van makkelijk naar technisch — ons AI-systeem legt het uit op jouw niveau."
category: "educatie"
author: "Redactie CosmosNL"
publishedAt: "2026-03-01T10:00:00.000Z"
readTime: 5
featured: false
tags: ["neutronenster", "educatie", "uitleg"]
---

# Wat is een neutronenster? Uitleg in 3 niveaus

## 🌙 Beginner

Stel je een reusachtige ster voor die explodeert — een supernova. Wat overblijft is een neutronenster: zo groot als een stad (20 km doorsnede), maar zwaarder dan 1,5 keer onze zon. Een theelepel neutronenstermateriaal weegt een miljard ton. Sommige draaien honderden keren per seconde rond — die noemen we **pulsars**.

## 🔭 Amateur

Neutronensterren ontstaan na de implosie van een sterkern met 8–20 zonsmassa's. De korst bestaat uit gelaagde kristalstructuren. Pulsars zenden radiobundels uit langs hun magnetische polen — als kosmische vuurtorens. Hun timingprecisie overtreft atoomklokken.

## 🌌 Pro

Neutronensterren zijn laboratoria voor exotische toestandsvergelijkingen (EOS) bij nucleaire dichtheid (ρ ~ 10¹⁴–¹⁵ g/cm³). Massa–straal relaties worden bepaald door de EOS; waarnemingen van PSR J0740+6620 (M > 2 M☉) sluiten zachte EOS-modellen uit. GW170817 leverde directe meting van de tidaldeformeerbaarheid (Λ̃ ≈ 300) en bevestigde r-procesnucleosynthese als bron van Au en Pt.
MDEOF

echo "✅ Fix 1: 5 markdown artikelen aangemaakt in content/articles/"

# ── FIX 2: APOD env variabele ──────────────────────────────────────────────
# Check of .env.local bestaat
if [ ! -f .env.local ]; then
  cp .env.example .env.local 2>/dev/null || touch .env.local
fi

# Voeg NASA key toe als die er nog niet in zit
if ! grep -q "NEXT_PUBLIC_NASA_API_KEY" .env.local; then
  echo "" >> .env.local
  echo "# NASA API key - gratis aanvragen op https://api.nasa.gov/" >> .env.local
  echo "NEXT_PUBLIC_NASA_API_KEY=DEMO_KEY" >> .env.local
  echo "✅ Fix 2: NEXT_PUBLIC_NASA_API_KEY toegevoegd aan .env.local"
  echo "   ⚠️  Vervang DEMO_KEY door je eigen key op https://api.nasa.gov/"
else
  echo "✅ Fix 2: NASA key al aanwezig in .env.local"
fi

# ── FIX 3: Verifieer resultaat ─────────────────────────────────────────────
echo ""
echo "📁 content/articles/ bevat nu:"
ls content/articles/
echo ""
echo "🎯 Nog te doen (handmatig):"
echo "   1. Vervang in app/page.tsx:"
echo "      fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')"
echo "      door:"
echo "      fetch(\`https://api.nasa.gov/planetary/apod?api_key=\${process.env.NEXT_PUBLIC_NASA_API_KEY || 'DEMO_KEY'}\`)"
echo ""
echo "   2. Haal een gratis NASA API key op: https://api.nasa.gov/"
echo "      Zet hem in .env.local als: NEXT_PUBLIC_NASA_API_KEY=jouw_key"
echo ""
echo "   3. De ISS worldmap — zie de instructies hiervoor in de chat."
echo ""
echo "✅ Script klaar! Run 'npm run dev' om te testen."
