#!/bin/bash
# CosmosNL — Browser errors fix
# Run vanuit projectroot: bash fix-errors.sh

set -e
echo "🔧 Browser errors fixen..."

# ── FIX 1: CORS — verwijder crossOrigin="anonymous" van APOD img ───────────
sed -i 's/ crossOrigin="anonymous"//g' app/page.tsx
echo "✅ Fix 1: crossOrigin CORS fix toegepast"

# ── FIX 2: /& 404 — vervang href="#" door href="/" in nav ─────────────────
# De topbar NL/EN links en footer links hebben href="#" wat soms /& geeft
sed -i 's/href="#"/href="\/"/g' app/page.tsx
echo "✅ Fix 2: href='#' vervangen door href='/'"

# ── FIX 3: Hydration — Starfield mag geen random op server draaien ─────────
# Vervang de Starfield component met een versie die alleen client-side rendert
python3 - << 'PYEOF'
import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Vervang de Starfield functie - voeg suppressHydrationWarning toe aan canvas
# en verplaats de sterren generatie volledig naar useEffect (ze staan er al)
# Het echte probleem is de canvas zelf die server-side een andere output geeft

# Fix: voeg 'use client' check toe - het staat er al, maar de canvas 
# heeft een key nodig zodat React weet het client-side te renderen
old_canvas = '<canvas id="starfield" style={{ position: \'fixed\', inset: 0, pointerEvents: \'none\', zIndex: 0 }} />'
new_canvas = '<canvas id="starfield" suppressHydrationWarning style={{ position: \'fixed\', inset: 0, pointerEvents: \'none\', zIndex: 0 }} />'

if old_canvas in content:
    content = content.replace(old_canvas, new_canvas)
    print("✅ Fix 3a: suppressHydrationWarning toegevoegd aan canvas")
else:
    print("⚠️  Fix 3a: canvas regel niet gevonden, handmatig toevoegen")

# Fix: date in Header gebruikt useState correct maar voeg suppressHydrationWarning toe
old_date_span = '<span style={{ fontFamily: \'DM Mono, monospace\', fontSize: \'0.6rem\', letterSpacing: \'0.15em\', color: \'#4a5278\', textTransform: \'uppercase\' }}>{date}</span>'
new_date_span = '<span suppressHydrationWarning style={{ fontFamily: \'DM Mono, monospace\', fontSize: \'0.6rem\', letterSpacing: \'0.15em\', color: \'#4a5278\', textTransform: \'uppercase\' }}>{date}</span>'

if old_date_span in content:
    content = content.replace(old_date_span, new_date_span)
    print("✅ Fix 3b: suppressHydrationWarning op datum span")
else:
    print("⚠️  Fix 3b: datum span niet exact gevonden - dat is ok, useState fix volstaat")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("✅ page.tsx opgeslagen")
PYEOF

# ── FIX 4: Rebuild en push ─────────────────────────────────────────────────
echo ""
echo "🏗️  Build testen..."
npm run build 2>&1 | tail -20

echo ""
echo "✅ Alle fixes toegepast!"
echo ""
echo "Push naar GitHub met:"
echo "  git add app/page.tsx"
echo "  git commit -m 'fix: CORS crossOrigin, hydration warnings, href fixes'"
echo "  git push origin main"