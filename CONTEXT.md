# Tipsy — Sessionsstatus
_Senast uppdaterad: 2026-05-16 (Session 8)_

## Nuvarande fas
Appen körs lokalt. Designsystem applicerat (Fas 1–3). Grundläggande flöden fungerar.
Fokus: buggfixar, polish och förberedelse för produktion.

## Vad som fungerar ✅
- Lokal utvecklingsmiljö: Docker (Postgres + Mailpit), npm run dev
- Inloggning: Magic link via Mailpit + lösenord (credentials)
- Gruppspelstips: kupongestetik med 1X2-celler och bläckcirklar
- Avancemangstips: välj 2 lag per grupp
- Slutspelstips: öppnas löpande per match
- Turneringstips: finallag + vinnare
- Admin: mata in resultat (inkl. korrigering), hantera odds, bjuda in
- Competitions: skapa, gå med, topplista per tävling
- Simulering: skapa bottar, stega dagar, auto-grupptabell
- Tipskuponger: översikt alla deltagares tips per tävling
- Spelardetaljsida: /competitions/[slug]/player/[userId]
- Grupptabeller: visas under tävlingsställningen
- CSV-import/export av lag och matcher
- Flaggnedladdning: 48 lag med korrekt FIFA→ISO-mappning
- Designsystem: Tipsy-branding med kupongestetik genomgående
- Styrkebaserad odds-seeding + 5 testanvändare med viktade tips
- Tvåspråkigt: svenska + engelska (next-intl)

## Designsystem — Tipsy
Källa: Tipsy_Design_System.zip (Claude Design)
Tema: retro stryktipskupong × varm modern palett
- Bakgrund: cream (#f2f0eb), coupon-bg (#f4ecd8)
- Primär: green-deep (#1E3932), green-cta (#00754a)
- Accent: gold (#cba258), stamp-red (#9c2a1f)
- Typsnitt: Newsreader (display/serif), Inter (body), JetBrains Mono (metadata), Caveat (handskrivet)
- Komponenter: .coupon (perforerade kanter, kulspetspenna-cirklar), .stamp, .eyebrow, .pill
- Tokens i CSS-variabler (globals.css), mappade till Tailwind (tailwind.config.ts)

## Arkitektur
Stack:        Next.js 14.2.5 · TypeScript · Prisma · PostgreSQL · NextAuth v5 (JWT)
Hosting:      AWS Amplify + RDS + SES (ej uppsatt än)
i18n:         next-intl (sv/en)
Auth:         lib/auth.config.ts (edge/middleware) + lib/auth.ts (server, JWT-strategi)
Styling:      Tailwind + designsystem-tokens i CSS-variabler
UI:           components/ui/index.tsx (Button, Card, Badge, Input, Label, Toaster)

Datamodell:
  Tournament → Competition → CompetitionMember ↔ User
  Match → MatchOdds (Float), MatchTip
  Group → Team, GroupAdvancementTip, GroupActualAdvancement
  TournamentTip, TournamentActualResult, AdvancementOdds, TournamentOdds

Tips-låsning:
  Gruppspel/avancemang/finallag = oddsLockDate (2 dagar före turnering)
  Slutspelsmatcher = tipDeadline per match (24h innan)

Synlighet:
  CompetitionMember.tipsPublic — styr om tips syns före deadline

Simulering:
  Competition.simulationMode — SimBots, dag-stegning, auto-grupptabell

## Kända problem / teknisk skuld
- Next.js 14.2.5 har säkerhetshål (CVE) — uppgradering till 15/16 krävs
  men innebär async params i alla page-komponenter + React 19-migration
- React 18 saknar useActionState och useOptimistic — vi använder
  useFormState (react-dom) och useState som ersättning
- Datum i Prisma (Date) kan inte passeras direkt till Client Components —
  konverteras till string i page-komponenter (toISOString)
- Decimal ersattes med Float i schema — serialize() borttagen
- Lagdata i prisma/data/wc2026.ts är korrigerad mot officiella FIFA-dragningen
- Matchdatum i UTC — användare ser UTC-tider (tidszonkonvertering ej implementerad)
- Knockout bracket-seeding i simulering ej implementerad

## Lokalmiljö
docker compose up -d        # starta postgres + mailpit
npm run dev                 # starta Next.js
http://localhost:3000       # appen
http://localhost:8025       # mailpit (magic links)
docker compose down         # stäng ner (behåller data)
docker compose down -v      # stäng ner + radera data

## Admin-inloggning (seed)
Email:    värdet av ADMIN_EMAIL i .env.local
Lösenord: värdet av ADMIN_PASSWORD i .env.local

## Testanvändare (sim:seed)
Lösenord för alla: Test1234
- alice@test.tipsy  (skill 0.75 — sharp)
- bob@test.tipsy    (skill 0.50 — good)
- carla@test.tipsy  (skill 0.25 — random)
- david@test.tipsy  (skill 0.60 — good)
- eva@test.tipsy    (skill 0.40 — average)

## Scripts
npm run dev              # Starta Next.js dev server
npm run db:migrate       # Ny migration (dev)
npm run db:seed          # Seeda turnering, lag, matcher, default-tävling
npm run db:studio        # Prisma Studio (http://localhost:5555)
npm run sim:seed         # Generera odds + 5 testanvändare + tips
npm run sim:seed:reset   # Rensa sim-data och generera om
npm run flags:download   # Ladda ner flaggor (skippar befintliga)
npm run flags:download:force  # Ladda om alla flaggor
npm run tournament:import     # Importera lag/matcher från CSV
npm run tournament:export     # Exportera till CSV

## Filstruktur (viktiga filer)
app/
  globals.css                              ← designsystem-tokens + coupon CSS
  [locale]/
    page.tsx                               ← startsida (Fas 3 redesign)
    auth/login/page.tsx                    ← inloggning (kupong-stil)
    tips/
      layout.tsx + TipsNav                 ← sub-navigation
      group-stage/page.tsx                 ← gruppspelskupong (Fas 3)
      advancement/page.tsx                 ← avancemangstips
      knockout/page.tsx                    ← slutspelstips
      tournament/page.tsx                  ← finallag + vinnare
    competitions/
      page.tsx                             ← lista tävlingar
      [slug]/
        page.tsx                           ← topplista + grupptabeller (Fas 3)
        coupons/page.tsx                   ← alla kuponger
        player/[userId]/page.tsx           ← spelarens kupong (Fas 3)
    admin/
      results/page.tsx                     ← mata in/korrigera resultat
      odds/page.tsx                        ← hantera odds
      competitions/page.tsx                ← skapa tävlingar
      simulate/page.tsx                    ← simulering
      users/page.tsx                       ← användare + inbjudningar
components/
  ui/index.tsx                             ← Button, Card, Badge, Input, Toaster
  layout/Navbar.tsx                        ← navigation (Fas 2 redesign)
  tips/
    CouponMatchRow.tsx                     ← kupong-matchrad med bläckcirklar
    AdvancementCard.tsx                    ← avancemangstips (Fas 3)
    TipsNav.tsx, TournamentTipForm.tsx
  competitions/
    GroupTable.tsx                          ← grupptabeller (V/O/F/GM-IM/MS/P)
    PlayerCoupon.tsx                        ← spelarens resultat (Fas 3)
    CouponsView.tsx                        ← alla kuponger-matris
    VisibilityToggle.tsx, JoinCompetitionForm.tsx
  admin/
    AdminResultForm.tsx                    ← redigerbara resultat
    AdminNav, OddsForm, SimulationPanel, etc.
lib/
  auth.ts + auth.config.ts                ← NextAuth v5 (JWT, edge-split)
  db.ts                                   ← Prisma singleton
  utils.ts                                ← formatDate, outcomeLabel, etc.
  group-standings.ts                       ← grupptabellberäkning server-side
  scoring/index.ts                         ← poängberäkning + leaderboard
  actions/tips.ts                          ← server actions för tipsinmatning
  actions/admin.ts                         ← server actions för admin
  actions/competitions.ts                  ← skapa/gå med i tävlingar
  actions/simulate.ts                      ← simuleringsmotor
prisma/
  schema.prisma                            ← komplett datamodell (Float, ej Decimal)
  seed.ts                                  ← seeda turnering från wc2026.ts
  data/wc2026.ts                           ← korrekta VM 2026-grupper + 104 matcher
scripts/
  download-flags.ts                        ← flaggor för 48 VM-lag
  seed-simulation.ts                       ← odds + testanvändare + tips
  import-tournament.ts                     ← CSV import/export

## Kvarvarande features
- E-postpåminnelser 48h innan tips stängs
- Tidszonkonvertering i UI (visa lokal tid)
- Next.js 15/16-uppgradering (async params, React 19)
- AWS-deploy (RDS, SES, Amplify)
- Knockout auto-bracket i simulering
- Statistiksida (populäraste tipsen etc.)
- PWA-manifest för mobil
