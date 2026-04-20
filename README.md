# VM-Tipset 2026 ⚽

Webapplikation för att tippa FIFA VM 2026 med vänner. Poäng baseras på genomsnittliga odds från kommersiella bettingsajter.

---

## Funktioner

- 🔐 Inloggning via e-post + lösenord eller magic link (lösenordsfri)
- ⚽ Tips på 1X2 i gruppspel (72 matcher)
- 🏅 Tips på vilka lag som går vidare från varje grupp
- ⚔️ Tips på 1X2 i slutspel (32 matcher, låses 24h innan varje match)
- 🏆 Tips på finallag och VM-vinnare
- 📊 Topplista med poäng beräknade på verkliga odds
- 🌐 Svenska och engelska
- 👤 Admin-panel för resultat, odds och användare

---

## Tech Stack

| Del          | Teknik                      |
| ------------ | --------------------------- |
| Frontend/API | Next.js 14 (App Router, TS) |
| Databas      | PostgreSQL (AWS RDS)        |
| ORM          | Prisma                      |
| Auth         | NextAuth.js v5              |
| E-post       | AWS SES (via Nodemailer)    |
| Hosting      | AWS Amplify                 |
| Styling      | Tailwind CSS                |
| i18n         | next-intl (sv/en)           |

---

## Lokal utveckling

### Krav

- Node.js 20+
- PostgreSQL (lokalt eller Docker)
- AWS-konto (för SES, kan mockas lokalt med Mailpit/MailHog)

### Setup

```bash
# 1. Klona repo
git clone <repo-url>
cd tipsy

# 2. Installera beroenden
npm install

# 3. Konfigurera miljövariabler
cp .env.example .env.local
# Redigera .env.local — fyll i DATABASE_URL, NEXTAUTH_SECRET etc.

# 4. Skapa databas och kör migrationer
npx prisma migrate dev --name init

# 5. Generera Prisma-klient
npx prisma generate

# 6. Seed-data (grupper, lag, matcher, admin-användare)
npm run db:seed

# 7. Starta dev-server
npm run dev
```

Appen är nu tillgänglig på http://localhost:3000

### Lokal e-post (utan AWS SES)

Använd [Mailpit](https://mailpit.axllent.org/) för att fånga utgående mail lokalt:

```bash
# Starta Mailpit (Docker)
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit

# Uppdatera .env.local
EMAIL_SERVER_HOST="localhost"
EMAIL_SERVER_PORT="1025"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
```

Mailpit UI: http://localhost:8025

---

## Databaskommandon

```bash
npm run db:migrate       # Ny migration (dev)
npm run db:migrate:prod  # Kör migrationer (prod)
npm run db:seed          # Seed-data (VM 2026)
npm run db:studio        # Öppna Prisma Studio
npm run db:reset         # Återställ databas (dev only!)
```

---

## AWS-driftsättning

### Förutsättningar

1. AWS-konto med RDS och Amplify aktiverat
2. PostgreSQL-instans på RDS (rekommenderas: `db.t3.micro`, Multi-AZ för prod)
3. SES verifierad domän + SMTP-credentials
4. GitHub-repo kopplat till Amplify

### RDS-setup

```sql
-- Skapa databas
CREATE DATABASE vm_tippning;
CREATE USER vm_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE vm_tippning TO vm_user;
```

### Amplify-setup

1. Gå till AWS Amplify Console → New App → Host web app
2. Koppla till ditt GitHub-repo
3. Välj branch (t.ex. `main`)
4. `amplify.yml` finns i repot — bygg-konfigurationen hämtas automatiskt
5. Sätt miljövariabler under **Environment variables**:

| Variabel                | Beskrivning                                                |
| ----------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string (från RDS)                    |
| `NEXTAUTH_SECRET`       | Slumpmässig sträng (32+ bytes, base64)                     |
| `NEXTAUTH_URL`          | Din Amplify-URL, t.ex. `https://main.xxxxx.amplifyapp.com` |
| `EMAIL_SERVER_HOST`     | SES SMTP endpoint                                          |
| `EMAIL_SERVER_PORT`     | 587                                                        |
| `EMAIL_SERVER_SECURE`   | false                                                      |
| `EMAIL_SERVER_USER`     | SES SMTP IAM user                                          |
| `EMAIL_SERVER_PASSWORD` | SES SMTP password                                          |
| `EMAIL_FROM`            | Verifierad avsändaradress i SES                            |

6. Driftsätt — Amplify kör `prisma migrate deploy` och `npm run build` automatiskt

### Första seed i produktion

```bash
# Kör manuellt via Amplify SSH eller lokalt med prod DATABASE_URL
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=strongpassword npm run db:seed
```

---

## Admin-workflow

1. **Logga in** som admin → gå till `/sv/admin`
2. **Bjud in spelare** under Användare-fliken
3. **Lägg in odds** under Odds-fliken (minst 2 veckor innan turnering)
4. **Mata in resultat** under Resultat-fliken efter varje match
   - Poäng beräknas och sparas automatiskt
5. **Sätt avancemang** när gruppen är klar

---

## Poängregler

| Tips            | Poäng vid rätt                                      | Poäng vid fel |
| --------------- | --------------------------------------------------- | ------------- |
| Match 1X2       | Genomsnittliga odds för det utfallet (t.ex. 3.20 p) | 0             |
| Laget avancerar | Genomsnittliga odds för avancemang (t.ex. 1.50 p)   | 0             |
| Finallag        | Genomsnittliga odds för att nå finalen              | 0             |
| VM-vinnare      | Genomsnittliga odds för att vinna turneringen       | 0             |

Odds hämtas från Unibet, Betsson och Bet365 (eller valfria källor) ca 7 dagar innan turnering och sparas oföränderliga i databasen.

---

## Tipslåsning

| Tips-kategori            | Låses                            |
| ------------------------ | -------------------------------- |
| Gruppspelsresultat (1X2) | 2 dagar innan turneringsstart    |
| Avancemang per grupp     | 2 dagar innan turneringsstart    |
| Finallag + VM-vinnare    | 2 dagar innan turneringsstart    |
| Slutspelsmatcher (1X2)   | 24 timmar innan respektive match |

---

## ⚠️ Viktigt inför lansering

1. **Verifiera laguppställningar** mot officiellt FIFA-dragningsresultat — `prisma/data/wc2026.ts` innehåller preliminära data
2. **Uppdatera exakta matchdatum** baserat på officiellt matchschema
3. **Sätt odds-datum** i `.env` / admin innan VM-tips låses
4. **Testa SES** med en verifierad e-post innan du bjuder in användare
5. **Sätt `NEXTAUTH_URL`** till din faktiska produktions-URL

---

## Projektstruktur

```
vm-tippning/
├── app/
│   ├── [locale]/           # Alla sidor, locale-routing
│   │   ├── tips/           # Tips-sektioner (4 st)
│   │   ├── standings/      # Topplista
│   │   ├── admin/          # Admin-panel
│   │   └── auth/           # Login, verify, error
│   └── api/                # API routes (auth, admin)
├── components/
│   ├── admin/              # Admin-komponenter
│   ├── layout/             # Navbar etc.
│   ├── tips/               # Tips-komponenter
│   └── ui/                 # Grundläggande UI-komponenter
├── lib/
│   ├── actions/            # Server Actions (tips, admin)
│   ├── scoring/            # Poängberäkning
│   ├── auth.ts             # NextAuth-konfiguration
│   ├── db.ts               # Prisma-klient
│   └── utils.ts            # Hjälpfunktioner
├── prisma/
│   ├── schema.prisma       # Datamodell
│   ├── seed.ts             # Seed-script
│   └── data/wc2026.ts      # VM 2026-data
├── messages/               # Översättningar (sv.json, en.json)
├── i18n/                   # next-intl-konfiguration
├── .env.example            # Miljövariabler-mall
├── amplify.yml             # AWS Amplify build-konfiguration
└── README.md
```
