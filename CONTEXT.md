# Tipsify — Sessionsstatus

_Senast uppdaterad: 2026-05-27 (Session 9)_

## Nuvarande fas

Appen är live i produktion på Vercel. Testare inbjudna. Väntar på feedback.

## Infrastruktur ✅

- **Hosting:** Vercel (automatisk deploy vid push till main)
- **Databas:** AWS RDS PostgreSQL (eu-north-1, tipsy-prod)
- **E-post:** AWS SES (sandbox-läge, production access begärd)
- **Domän:** Custom domän kopplad, SSL via Vercel
- **Auth:** NextAuth v5, JWT-strategi, magic link + lösenord

## Vad som fungerar ✅

- Inloggning: magic link + lösenord
- Alla tipskategorier: gruppspel, avancemang, slutspel, finallag/vinnare
- Taktiktips: vinnare kan väljas oberoende av finallag
- Topplista med poängberäkning
- Grupptabeller under Resultat-fliken
- Kupongöversikt (allas tips i matris)
- Spelardetaljsida med fullständig kupong + poäng
- Admin: resultat (inkl. korrigering), odds, tävlingar, simulering
- Skicka om inbjudan till ej verifierade användare
- CSV-import: lag, matcher, odds
- Excel-export: topplista + allas tips
- Designsystem genomgående (Tipsify-branding, kupong-estetik)
- Mobilanpassning av kupongen
- Toast-bekräftelse vid sparade tips
- Felhantering vid nätverksfel
- Tillbaka-navigation på djupsidor

## Navigationsstruktur

```
Login → /competitions
/competitions                     ← lista turneringar
/competitions/[slug]              ← Ledartavla (CompetitionNav)
/competitions/[slug]/coupons      ← Allas tips
/competitions/[slug]/results      ← Resultat (matchlista + tabeller)
/competitions/[slug]/player/[id]  ← Spelardetaljsida
/tips/group-stage                 ← Mina tips (TipsNav med flikar)
/tips/advancement
/tips/knockout
/tips/tournament
/admin/*                          ← Separat, bara admin
```

## Miljövariabler (Vercel)

- DATABASE_URL — RDS connection string
- AUTH_SECRET + NEXTAUTH_SECRET — samma värde
- NEXTAUTH_URL — custom domän
- AUTH_TRUST_HOST — true
- EMAIL*SERVER*\* — SES SMTP-credentials
- EMAIL_FROM — verifierad SES-avsändare

## Lokalmiljö

```bash
docker compose up -d        # postgres + mailpit
npm run dev                 # localhost:3000
http://localhost:8025       # mailpit
docker compose down
```

## Scripts

```bash
npm run db:seed              # turnering, lag, matcher, admin, default-tävling
npm run db:studio            # Prisma Studio
npm run sim:seed             # odds + 5 testanvändare + tips
npm run sim:seed:reset       # rensa och generera om
npm run flags:download       # flaggor för 48 VM-lag
npm run tournament:import    # CSV-import lag + matcher
npm run tournament:export    # CSV-export
npm run odds:import          # importera odds från CSV (data/odds-*.csv)
npm run odds:import:dry      # validera utan att skriva
npm run odds:import:force    # skriv över befintliga odds
```

## Odds-import CSV-format

```
data/odds-matches.csv:      match_number,home_odds,draw_odds,away_odds,source
data/odds-advancement.csv:  fifa_code,odds,source
data/odds-tournament.csv:   fifa_code,reach_final_odds,win_odds,source
```

## Kända begränsningar / teknisk skuld

- SES i sandbox-läge — production access begärd, inväntar godkännande
- Next.js 14 (CVE) — uppgradering till 15/16 planerad efter VM
- React 18: useFormState (react-dom) istället för useActionState
- React 18: useState istället för useOptimistic
- Datum från Prisma konverteras till .toISOString() i page-komponenter
- Slutspelsbracket-seeding i simulering ej implementerad
- Ingen profilsida för lösenordsbyte (magic link används istället)

## Kvarvarande features (efter feedback)

- Exhibition-spelare (AI/medier/folkets tips)
- Statistiksida
- Next.js 15/16-uppgradering
- Tidszonkonvertering i UI
- Admin-sidor: simulering, tävlingar (lägre prioritet)

## VM 2026

- Turneringsstart: 11 juni 2026
- Tipslåsning gruppspel/avancemang/final: 9 juni 2026 (oddsLockDate)
- 48 lag, 12 grupper (A-L), 104 matcher (72 grupp + 32 slutspel)
- Alla tider UTC
