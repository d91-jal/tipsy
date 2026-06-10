# Tipsify ⚽

Webapplikation för att tippa FIFA VM 2026 med vänner. Poäng baseras på
genomsnittliga odds från kommersiella bettingsajter. Retro stryktipskupong-estetik.

---

## Funktioner

- 🔐 Inloggning via e-post + lösenord eller magic link (lösenordsfri)
- ⚽ Tips på 1X2 i gruppspel (72 matcher) — interaktiv kupong med bläckcirklar
- 🏅 Tips på vilka lag som går vidare från varje grupp (12 grupper)
- ⚔️ Tips på 1X2 i slutspel (32 matcher, låses 24h per match)
- 🏆 Tips på finallag och VM-vinnare
- 📊 Topplista per tävling med poäng baserade på verkliga odds
- 🏟️ Grupptabeller (V/O/F/GM-IM/MS/P) under tävlingsvy
- 👤 Spelardetaljsida med fullständig kupong + intjänade poäng
- 🃏 Kupongöversikt — alla deltagares tips i en vy
- 🤖 Simuleringsläge: generera bottar, stega dagar, auto-grupptabell
- 🌐 Svenska och engelska (next-intl)
- 🎨 Designsystem: Tipsify-branding, kupong-estetik, Newsreader serif

---

## Tech Stack

| Del          | Teknik                                    |
| ------------ | ----------------------------------------- |
| Frontend/API | Next.js 14 (App Router, TypeScript)       |
| Databas      | PostgreSQL (AWS RDS / lokal Docker)       |
| ORM          | Prisma (Float, ej Decimal)                |
| Auth         | NextAuth.js v5 (JWT + magic link via SES) |
| E-post       | AWS SES / Mailpit (lokalt)                |
| Hosting      | AWS Amplify (ej driftsatt än)             |
| Styling      | Tailwind CSS + designsystem-tokens        |
| i18n         | next-intl (sv/en)                         |
| Typsnitt     | Newsreader, Inter, JetBrains Mono, Caveat |

---

## Kom igång

### Krav

- Node.js 20+
- Docker Desktop (PostgreSQL + Mailpit)
- Git

### Setup

```bash
# 1. Klona
git clone https://github.com/DITT_REPO/tipsy.git
cd tipsy

# 2. Installera beroenden
npm install

# 3. Miljövariabler
cp .env.example .env.local
# Redigera .env.local — se avsnittet Miljövariabler nedan

# 4. Starta Docker-tjänster
docker compose up -d

# 5. Skapa databas och kör migrationer
npx prisma migrate dev --name init

# 6. Seeda turnering, lag och matcher
npm run db:seed

# 7. Ladda ner flaggor för alla 48 lag
npm run flags:download

# 8. (Valfritt) Seeda simuleringsdata — odds + testanvändare
npm run sim:seed

# 9. Starta dev-server
npm run dev
```

Appen: http://localhost:3000
Mailpit (magic links): http://localhost:8025
Prisma Studio: `npm run db:studio` → http://localhost:5555

---

## Miljövariabler

Kopiera `.env.example` till `.env.local` och fyll i:

```bash
# Databas
DATABASE_URL="postgresql://tipsy:localdev@localhost:5432/tipsy?schema=public"

# NextAuth v5 — generera med:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET="REPLACE_WITH_RANDOM_SECRET"
NEXTAUTH_SECRET="REPLACE_WITH_RANDOM_SECRET"   # samma värde som AUTH_SECRET
NEXTAUTH_URL="http://localhost:3000"

# E-post (lokalt: Mailpit, produktion: AWS SES)
EMAIL_SERVER_HOST="localhost"
EMAIL_SERVER_PORT="1025"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM="Tipsify <noreply@localhost>"

# Admin-konto (används av db:seed)
ADMIN_EMAIL="admin@test.se"
ADMIN_PASSWORD="VäljEttStarktLösenord"
```

> **OBS:** Sätt `AUTH_SECRET` och `NEXTAUTH_SECRET` till **exakt samma värde**.
> NextAuth v5 läser `AUTH_SECRET` primärt; äldre delar av stacken läser `NEXTAUTH_SECRET`.

---

## Scripts

```bash
# Databas
npm run db:migrate          # Ny Prisma-migration (dev)
npm run db:migrate:prod     # Kör migrationer i produktion
npm run db:seed             # Seeda turnering, lag, matcher, admin, default-tävling
npm run db:studio           # Öppna Prisma Studio

# Simulering
npm run sim:seed            # Generera odds + 5 testanvändare + tips
npm run sim:seed:reset      # Rensa och generera om

# Flaggor
npm run flags:download      # Ladda ner flaggor (skippar befintliga)
npm run flags:download:force  # Ladda om alla 48 flaggor

# CSV-import/export
npm run tournament:import   # Se användning nedan
npm run tournament:export   # Exportera nuvarande data till CSV
```

### CSV-import

```bash
# Validera filer utan att skriva till databas
npx tsx scripts/import-tournament.ts \
  --tournament wc2026 \
  --teams data/wc2026-teams.csv \
  --matches data/wc2026-matches.csv \
  --dry-run

# Importera
npx tsx scripts/import-tournament.ts \
  --tournament wc2026 \
  --teams data/wc2026-teams.csv \
  --matches data/wc2026-matches.csv

# Skriv över befintliga poster
npx tsx scripts/import-tournament.ts \
  --tournament wc2026 \
  --teams data/wc2026-teams.csv \
  --matches data/wc2026-matches.csv \
  --force
```

CSV-format — `teams.csv`:

```
group,fifa_code,name_sv,name_en
A,MEX,Mexiko,Mexico
```

CSV-format — `matches.csv`:

```
match_number,stage,group,home_team,away_team,scheduled_at,venue
1,GROUP,A,MEX,RSA,2026-06-11T19:00:00Z,Estadio Azteca
73,ROUND_OF_32,,,, 2026-06-29T20:00:00Z,
```

Alla tider i UTC.

---

## Admin-workflow

1. Logga in som admin → `/sv/admin`
2. **Tävlingar** — skapa tävling (publik/privat/simulering), bjud in deltagare
3. **Odds** — lägg in odds per match (1X2) och per lag (avancemang/turnering)
4. **Resultat** — mata in matchresultat → poäng räknas om automatiskt
5. **Simulering** — skapa bottar, stega dagar dag för dag för testning

---

## Poängregler

| Tips          | Poäng vid rätt                                | Poäng vid fel |
| ------------- | --------------------------------------------- | ------------- |
| Match 1X2     | Genomsnittliga odds för utfallet (t.ex. 3.20) | 0             |
| Lag avancerar | Genomsnittliga avancemangodds för laget       | 0             |
| Finallag      | Genomsnittliga odds för att nå finalen        | 0             |
| VM-vinnare    | Genomsnittliga odds för att vinna             | 0             |

Odds registreras av admin från t.ex. Unibet, Betsson, Bet365.
Snittet beräknas automatiskt och fryses vid registreringstillfället.

---

## Tipslåsning

| Kategori                   | Låses                            |
| -------------------------- | -------------------------------- |
| Gruppspel 1X2 (72 matcher) | 2 dagar innan turneringsstart    |
| Avancemang per grupp       | 2 dagar innan turneringsstart    |
| Finallag + VM-vinnare      | 2 dagar innan turneringsstart    |
| Slutspelsmatcher 1X2       | 24 timmar innan respektive match |

Slutspel 1X2 gäller resultatet efter 90 minuter.

---

## Tip-synlighet

Tips är dolda för andra deltagare tills låsdatum passerat — **med undantag** för
spelare som aktivt valt att göra sina tips synliga (toggle i tävlingens vy).
Admin kan konfigureras med `tipsPublic: true` som standard.

---

## Designsystem

Baserat på `Tipsy_Design_System.zip` (Claude Design).

**Palett:**

| Token          | Färg      | Användning                     |
| -------------- | --------- | ------------------------------ |
| `--cream`      | `#f2f0eb` | Sidbackground                  |
| `--coupon-bg`  | `#f4ecd8` | Kupongbackground               |
| `--green-deep` | `#1E3932` | Headers, navbar, mörka element |
| `--green-cta`  | `#00754a` | Knappar, CTA                   |
| `--gold`       | `#cba258` | Accenter, korrekta svar        |
| `--stamp-red`  | `#9c2a1f` | Fel svar, MISS-stämpel         |

**CSS-klasser:**

- `.coupon` — kupong med perforerade kanter
- `.coupon-head` — mörk header med guldlinje
- `.match-row` — matchrad med 1/X/2-celler
- `.match-row .cell.picked` — vald cell med bläckcirkel
- `.stamp` / `.stamp-green` — stämpeleffekt
- `.eyebrow` — versaler i mono, kategorirubriker
- `.pill-gold` / `.pill-red` — resultatpills

---

## AWS-driftsättning

### Förutsättningar

1. AWS-konto med RDS PostgreSQL + Amplify + SES
2. GitHub-repo kopplat till Amplify
3. `amplify.yml` finns i repot (kör `prisma migrate deploy` + `next build`)

### Miljövariabler i Amplify Console

| Variabel                | Beskrivning                    |
| ----------------------- | ------------------------------ |
| `DATABASE_URL`          | RDS connection string          |
| `AUTH_SECRET`           | Slumpmässig sträng (32+ bytes) |
| `NEXTAUTH_SECRET`       | Samma värde som AUTH_SECRET    |
| `NEXTAUTH_URL`          | Din Amplify-URL                |
| `EMAIL_SERVER_HOST`     | SES SMTP endpoint              |
| `EMAIL_SERVER_PORT`     | 587                            |
| `EMAIL_SERVER_SECURE`   | false                          |
| `EMAIL_SERVER_USER`     | SES SMTP IAM user              |
| `EMAIL_SERVER_PASSWORD` | SES SMTP password              |
| `EMAIL_FROM`            | Verifierad SES-avsändare       |

### Första deploy

```bash
# 1. Koppla GitHub-repo i Amplify Console
# 2. Sätt alla env-variabler i Console
# 3. Trigga deploy — Amplify kör automatiskt:
#    npm install → prisma generate → prisma migrate deploy → next build

# 4. Seed-data i produktion (kör lokalt med prod DATABASE_URL)
ADMIN_EMAIL=admin@yourdomain.com \
ADMIN_PASSWORD=StarktLösenord \
DATABASE_URL="postgresql://..." \
npm run db:seed
```

---

## Projektstruktur

```
tipsy/
├── app/
│   ├── globals.css              ← designsystem + kupong-CSS
│   ├── layout.tsx
│   └── [locale]/
│       ├── layout.tsx           ← Navbar, Toaster, fonts
│       ├── page.tsx             ← Startsida
│       ├── auth/                ← login, verify, error
│       ├── tips/                ← 4 tipskategorier
│       ├── competitions/        ← lista, topplista, kuponger, spelare
│       └── admin/               ← resultat, odds, tävlingar, simulering
├── components/
│   ├── ui/index.tsx             ← Button, Card, Badge, Input, Toaster
│   ├── layout/Navbar.tsx
│   ├── tips/                    ← CouponMatchRow, AdvancementCard, TipsNav
│   ├── competitions/            ← GroupTable, PlayerCoupon, CouponsView
│   └── admin/                   ← ResultForm, OddsForm, SimulationPanel
├── lib/
│   ├── auth.ts + auth.config.ts ← NextAuth v5 (JWT, edge-split)
│   ├── db.ts                    ← Prisma singleton
│   ├── utils.ts                 ← formatDate, stageLabel, etc.
│   ├── group-standings.ts       ← grupptabellberäkning
│   ├── serialize.ts             ← (borttagen — Float ersatte Decimal)
│   ├── scoring/index.ts         ← poängberäkning + leaderboard
│   └── actions/                 ← tips, admin, competitions, simulate
├── prisma/
│   ├── schema.prisma            ← datamodell (Float, ej Decimal)
│   ├── seed.ts                  ← seed-script
│   └── data/wc2026.ts           ← officiella VM 2026-data (48 lag, 104 matcher)
├── scripts/
│   ├── download-flags.ts        ← 48 lag, FIFA→ISO mappning
│   ├── seed-simulation.ts       ← odds + testanvändare + tips
│   └── import-tournament.ts     ← CSV import/export
├── messages/
│   ├── sv.json                  ← svenska
│   └── en.json                  ← engelska
├── public/
│   ├── flags/                   ← SVG-flaggor per FIFA-kod
│   ├── logo.svg
│   ├── logo-dark.svg
│   └── brand-mark.svg
├── data/
│   ├── wc2026-teams.csv         ← officiella lagdata
│   └── wc2026-matches.csv       ← officiellt matchschema (UTC)
├── docker-compose.yml           ← PostgreSQL + Mailpit
├── .env.example                 ← miljövariabelmall
├── amplify.yml                  ← AWS Amplify build-config
└── tailwind.config.ts           ← designsystem-tokens → Tailwind-klasser
```

---

## Kända begränsningar

- **Next.js 14** — Uppgradering till 15/16 krävs för säkerhetsfix.
  Bryter async params i page-komponenter + kräver React 19.
- **React 18** — `useActionState` och `useOptimistic` saknas.
  Vi använder `useFormState` (react-dom) och `useState` istället.
- **Tidszon** — Alla tider lagras i UTC. UI visar UTC utan konvertering.
- **Slutspelsbracket** — Lag måste sättas manuellt av admin efter gruppspelet.
  Simulering sätter inte lag automatiskt i slutspelet.
- **En turnering åt gången** — `TournamentTip.userId` är `@unique`,
  vilket begränsar en användare till ett finallagstips totalt.
