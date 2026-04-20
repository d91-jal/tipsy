# VM-Tippning 2026 — Sessionsstatus
_Senast uppdaterad: 2026-04-16 (Session 3)_

## Nuvarande fas
Sprint 0–4 klara. Komplett kodbas inklusive Competition-lager, tip-synlighet och simuleringsmotor.

## Arkitekturella beslut (session 3)

### Competition-lager
- Tips (MatchTip, GroupAdvancementTip, TournamentTip) förblir globala per användare
- Competition är ett pool-lager ovanpå Tournament
- CompetitionMember kopplar User <> Competition med tipsPublic och isSimBot
- getLeaderboard(competitionId) är competition-scopad

### Tip-synlighet (tipsPublic)
- Per användare per tävling via CompetitionMember.tipsPublic
- Visas om: ägare === tittare ELLER deadline passerad ELLER tipsPublic === true
- Toggle i tävlingens standings-vy

### Simulering
- Per Competition (simulationMode: Boolean, simulatedDate: DateTime?)
- SimBots: User med email @sim.internal, isSimBot=true på CompetitionMember
- advanceSimDay() sätter slumpmässiga resultat för nästa dags matcher + triggar scoring
- Grupp-tabell beräknas automatiskt när alla 6 matcher är klara
- Reset tar bort bottar, resultat och poäng

## Setup
npm install
cp .env.example .env.local
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
npm run dev

## Öppna risker
- Lagdata i seed är preliminär (verifiera mot FIFA-schema)
- Knockout bracket-seeding i simulering ej implementerad
- TournamentTip.userId är @unique — ok för en turnering, kan behöva utökas

## Kvarvarande (Sprint 5)
- E-postpåminnelser
- Detaljvy per spelare
- Statistiksida
- Admin: sätt finalresultat
- Knockout auto-bracket i simulering
