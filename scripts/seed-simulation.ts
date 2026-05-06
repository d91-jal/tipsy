// scripts/seed-simulation.ts
//
// Generates realistic test data for end-to-end simulation:
//   - Strength-based odds for all matches, advancement, and tournament
//   - 5 test users added to the default competition
//   - Tips for each user, weighted toward likely outcomes
//
// Usage:
//   npx tsx scripts/seed-simulation.ts
//   npx tsx scripts/seed-simulation.ts --reset   (delete existing sim data first)
//
// Safe to re-run — uses upsert throughout.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ log: [] });

const DRY_RUN = process.argv.includes("--dry-run");
const RESET = process.argv.includes("--reset");

// ─────────────────────────────────────────────────────────────────────────────
// TEAM STRENGTH RATINGS  (1 = weakest, 10 = strongest)
// Used to derive realistic odds
// ─────────────────────────────────────────────────────────────────────────────
const TEAM_STRENGTH: Record<string, number> = {
  // Elite
  FRA: 9.5,
  BRA: 9.5,
  ARG: 9.5,
  ENG: 9.0,
  ESP: 9.0,
  GER: 8.5,
  POR: 8.5,
  NED: 8.5,
  BEL: 8.0,
  // Strong
  URU: 7.5,
  USA: 7.5,
  MEX: 7.5,
  CRO: 7.5,
  NOR: 7.0,
  SUI: 7.0,
  JPN: 7.0,
  KOR: 7.0,
  MAR: 7.0,
  SEN: 7.0,
  COL: 7.0,
  CAN: 7.0,
  // Mid
  CZE: 6.5,
  AUS: 6.5,
  TUR: 6.5,
  SWE: 6.5,
  SCO: 6.0,
  ECU: 6.0,
  EGY: 6.0,
  GHA: 6.0,
  CIV: 6.0,
  IRI: 6.0,
  AUT: 6.0,
  RSA: 5.5,
  BIH: 5.5,
  TUN: 5.5,
  ALG: 5.5,
  KSA: 5.5,
  PAR: 5.5,
  // Lower
  IRQ: 5.0,
  COD: 5.0,
  UZB: 5.0,
  QAT: 4.5,
  NZL: 4.5,
  CPV: 4.5,
  JOR: 4.5,
  PAN: 4.5,
  CUR: 4.0,
  HAI: 3.5,
};

function getStrength(fifaCode: string): number {
  return TEAM_STRENGTH[fifaCode] ?? 6.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// ODDS CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

/** Convert implied probability to decimal odds with margin */
function probToOdds(prob: number, margin = 0.08): number {
  const fair = 1 / prob;
  // Apply bookmaker margin and add small random variance
  const withMargin = fair * (1 - margin);
  const variance = 0.95 + Math.random() * 0.1; // ±5%
  return Math.round(withMargin * variance * 100) / 100;
}

/** Generate 1X2 odds from two team strengths */
function matchOdds(
  homeStrength: number,
  awayStrength: number,
): {
  home: number;
  draw: number;
  away: number;
} {
  const total = homeStrength + awayStrength + 4; // 4 = draw baseline
  const homeAdv = 0.5; // home advantage bonus

  const pHome = (homeStrength + homeAdv) / total;
  const pAway = awayStrength / total;
  const pDraw = 1 - pHome - pAway;

  return {
    home: Math.max(1.15, probToOdds(pHome)),
    draw: Math.max(2.5, probToOdds(Math.max(0.15, pDraw))),
    away: Math.max(1.15, probToOdds(pAway)),
  };
}

/** Advancement odds: probability of finishing top 2 in group */
function advancementOdds(
  teamStrength: number,
  groupStrengths: number[],
): number {
  const others = groupStrengths.filter((s) => s !== teamStrength);
  // Probability of beating at least 2 others = rough estimate
  const weaker = others.filter((s) => s < teamStrength).length;
  const prob = 0.35 + (weaker / others.length) * 0.5;
  return Math.max(1.1, probToOdds(Math.min(0.9, prob), 0.06));
}

/** Tournament winner odds from strength */
function winnerOdds(strength: number, maxStrength: number): number {
  const relativePower = strength / maxStrength;
  const prob = relativePower * relativePower * 0.25; // square to spread field
  return Math.max(1.2, probToOdds(Math.max(0.005, prob), 0.1));
}

/** Final reach odds */
function finalOdds(strength: number, maxStrength: number): number {
  const relativePower = strength / maxStrength;
  const prob = relativePower * relativePower * 0.45;
  return Math.max(1.1, probToOdds(Math.max(0.01, prob), 0.09));
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPS: weighted random selection based on odds
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pick an outcome weighted inversely to odds (lower odds = more likely = picked more).
 * skill: 0.0 = random, 1.0 = always picks favourite.
 */
function weightedTip(
  home: number,
  draw: number,
  away: number,
  skill: number,
): "HOME" | "DRAW" | "AWAY" {
  // Implied probability (inverse of odds)
  const pH = 1 / home;
  const pD = 1 / draw;
  const pA = 1 / away;
  const total = pH + pD + pA;

  // Blend with uniform distribution based on skill
  const blend = (p: number) => (1 - skill) * (1 / 3) + skill * (p / total);
  const wH = blend(pH);
  const wD = blend(pD);
  const wA = blend(pA);

  const r = Math.random() * (wH + wD + wA);
  if (r < wH) return "HOME";
  if (r < wH + wD) return "DRAW";
  return "AWAY";
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST USERS
// ─────────────────────────────────────────────────────────────────────────────

const TEST_USERS = [
  { name: "Alice Andersson", email: "alice@test.tipsy", skill: 0.75 },
  { name: "Bob Bergström", email: "bob@test.tipsy", skill: 0.5 },
  { name: "Carla Carlsson", email: "carla@test.tipsy", skill: 0.25 },
  { name: "David Dahl", email: "david@test.tipsy", skill: 0.6 },
  { name: "Eva Eriksson", email: "eva@test.tipsy", skill: 0.4 },
];

const TEST_PASSWORD = "Test1234";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Tipsy — Simulation seed");
  console.log(
    `   Mode: ${DRY_RUN ? "DRY RUN" : RESET ? "RESET + SEED" : "SEED"}\n`,
  );

  if (RESET) {
    console.log("🗑  Resetting simulation data...");
    await prisma.tournamentTip.deleteMany({
      where: { user: { email: { endsWith: "@test.tipsy" } } },
    });
    await prisma.groupAdvancementTip.deleteMany({
      where: { user: { email: { endsWith: "@test.tipsy" } } },
    });
    await prisma.matchTip.deleteMany({
      where: { user: { email: { endsWith: "@test.tipsy" } } },
    });
    await prisma.competitionMember.deleteMany({
      where: { user: { email: { endsWith: "@test.tipsy" } } },
    });
    await prisma.user.deleteMany({
      where: { email: { endsWith: "@test.tipsy" } },
    });
    await prisma.matchOdds.deleteMany({});
    await prisma.advancementOdds.deleteMany({});
    await prisma.tournamentOdds.deleteMany({});
    console.log("   ✓ Reset complete\n");
  }

  // ── Fetch tournament ───────────────────────────────────────────────────────
  const tournament = await prisma.tournament.findUnique({
    where: { slug: "wc2026" },
    include: {
      groups: {
        include: {
          teams: true,
          matches: {
            where: { stage: "GROUP" },
            include: { homeTeam: true, awayTeam: true },
          },
        },
        orderBy: { name: "asc" },
      },
      matches: {
        where: { stage: { not: "GROUP" } },
        include: { homeTeam: true, awayTeam: true },
      },
      competitions: { take: 1 },
    },
  });

  if (!tournament) {
    console.error("❌ Tournament wc2026 not found. Run npm run db:seed first.");
    process.exit(1);
  }

  const competition = tournament.competitions[0];
  if (!competition) {
    console.error("❌ No competition found. Run npm run db:seed first.");
    process.exit(1);
  }

  console.log(`✓ Tournament: ${tournament.nameEn}`);
  console.log(`✓ Competition: ${competition.name}`);

  const allTeams = tournament.groups.flatMap((g) => g.teams);
  const maxStrength = Math.max(...allTeams.map((t) => getStrength(t.fifaCode)));

  // ── 1. Match odds — group stage ────────────────────────────────────────────
  console.log("\n📊 Generating match odds...");
  let oddsCount = 0;

  for (const group of tournament.groups) {
    for (const match of group.matches) {
      if (!match.homeTeam || !match.awayTeam) continue;

      const hs = getStrength(match.homeTeam.fifaCode);
      const as_ = getStrength(match.awayTeam.fifaCode);
      const odds = matchOdds(hs, as_);

      if (!DRY_RUN) {
        for (const [outcome, value] of [
          ["HOME", odds.home],
          ["DRAW", odds.draw],
          ["AWAY", odds.away],
        ] as const) {
          await prisma.matchOdds.upsert({
            where: { matchId_outcome: { matchId: match.id, outcome } },
            update: {
              avgValue: value,
              sources: mockSources(value),
              recordedAt: new Date(),
            },
            create: {
              matchId: match.id,
              outcome,
              avgValue: value,
              sources: mockSources(value),
              recordedBy: "seed-script",
            },
          });
        }
      }
      oddsCount++;
    }
  }
  console.log(`   ✓ ${oddsCount} group matches`);

  // ── 2. Advancement odds ────────────────────────────────────────────────────
  let advCount = 0;
  for (const group of tournament.groups) {
    const groupStrengths = group.teams.map((t) => getStrength(t.fifaCode));
    for (const team of group.teams) {
      const odds = advancementOdds(getStrength(team.fifaCode), groupStrengths);
      if (!DRY_RUN) {
        await prisma.advancementOdds.upsert({
          where: { teamId: team.id },
          update: {
            avgValue: odds,
            sources: mockSources(odds),
            recordedAt: new Date(),
          },
          create: {
            teamId: team.id,
            avgValue: odds,
            sources: mockSources(odds),
            recordedBy: "seed-script",
          },
        });
      }
      advCount++;
    }
  }
  console.log(`   ✓ ${advCount} advancement odds`);

  // ── 3. Tournament odds (reach final + win) ─────────────────────────────────
  let tournCount = 0;
  for (const team of allTeams) {
    const strength = getStrength(team.fifaCode);
    const wOdds = winnerOdds(strength, maxStrength);
    const fOdds = finalOdds(strength, maxStrength);

    if (!DRY_RUN) {
      for (const [type, value] of [
        ["WIN", wOdds],
        ["REACH_FINAL", fOdds],
      ] as const) {
        await prisma.tournamentOdds.upsert({
          where: { teamId_type: { teamId: team.id, type } },
          update: {
            avgValue: value,
            sources: mockSources(value),
            recordedAt: new Date(),
          },
          create: {
            teamId: team.id,
            type,
            avgValue: value,
            sources: mockSources(value),
            recordedBy: "seed-script",
          },
        });
      }
    }
    tournCount++;
  }
  console.log(`   ✓ ${tournCount} teams × 2 tournament odds`);

  // ── 4. Create test users ───────────────────────────────────────────────────
  console.log("\n👥 Creating test users...");
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const userRecords: { id: string; email: string; skill: number }[] = [];

  for (const u of TEST_USERS) {
    if (!DRY_RUN) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name },
        create: {
          email: u.email,
          name: u.name,
          passwordHash,
          role: "USER",
          emailVerified: new Date(),
        },
      });

      // Add to default competition
      await prisma.competitionMember.upsert({
        where: {
          competitionId_userId: {
            competitionId: competition.id,
            userId: user.id,
          },
        },
        update: {},
        create: {
          competitionId: competition.id,
          userId: user.id,
          tipsPublic: false,
        },
      });

      userRecords.push({ id: user.id, email: u.email, skill: u.skill });
      console.log(`   ✓ ${u.name} (${u.email}) — skill: ${u.skill}`);
    } else {
      console.log(`   [dry] ${u.name}`);
    }
  }

  // ── 5. Generate tips per user ──────────────────────────────────────────────
  console.log("\n🎯 Generating tips...");

  for (const { id: userId, email, skill } of userRecords) {
    let tipCount = 0;

    // Group stage match tips
    for (const group of tournament.groups) {
      for (const match of group.matches) {
        if (!match.homeTeam || !match.awayTeam) continue;

        const hs = getStrength(match.homeTeam.fifaCode);
        const as_ = getStrength(match.awayTeam.fifaCode);
        const odds = matchOdds(hs, as_);
        const prediction = weightedTip(odds.home, odds.draw, odds.away, skill);

        await prisma.matchTip.upsert({
          where: { userId_matchId: { userId, matchId: match.id } },
          update: { prediction },
          create: { userId, matchId: match.id, prediction },
        });
        tipCount++;
      }
    }

    // Group advancement tips — pick top 2 by strength with some randomness
    for (const group of tournament.groups) {
      const teams = [...group.teams].sort((a, b) => {
        const aStr =
          getStrength(a.fifaCode) + (Math.random() - 0.5) * (1 - skill) * 4;
        const bStr =
          getStrength(b.fifaCode) + (Math.random() - 0.5) * (1 - skill) * 4;
        return bStr - aStr;
      });

      if (teams.length < 2) continue;

      await prisma.groupAdvancementTip.upsert({
        where: { userId_groupId: { userId, groupId: group.id } },
        update: { firstTeamId: teams[0].id, secondTeamId: teams[1].id },
        create: {
          userId,
          groupId: group.id,
          firstTeamId: teams[0].id,
          secondTeamId: teams[1].id,
        },
      });
    }

    // Tournament tip — finalist + winner weighted by strength
    const sortedTeams = [...allTeams].sort((a, b) => {
      const aS =
        getStrength(a.fifaCode) + (Math.random() - 0.5) * (1 - skill) * 3;
      const bS =
        getStrength(b.fifaCode) + (Math.random() - 0.5) * (1 - skill) * 3;
      return bS - aS;
    });

    const finalist1 = sortedTeams[0];
    const finalist2 = sortedTeams[1];
    const winner =
      Math.random() <
      getStrength(finalist1.fifaCode) /
        (getStrength(finalist1.fifaCode) + getStrength(finalist2.fifaCode))
        ? finalist1
        : finalist2;

    await prisma.tournamentTip.upsert({
      where: { userId },
      update: {
        finalist1Id: finalist1.id,
        finalist2Id: finalist2.id,
        winnerId: winner.id,
      },
      create: {
        userId,
        tournamentId: tournament.id,
        finalist1Id: finalist1.id,
        finalist2Id: finalist2.id,
        winnerId: winner.id,
      },
    });

    console.log(
      `   ✓ ${email}: ${tipCount} match tips + 12 advancement + 1 tournament`,
    );
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n✅ Done!");
  console.log(`\n   Test users (password: ${TEST_PASSWORD}):`);
  for (const u of TEST_USERS) {
    console.log(
      `   ${u.email.padEnd(25)} skill: ${u.skill} (${skillLabel(u.skill)})`,
    );
  }
  console.log(`\n   Competition: ${competition.name}`);
  console.log(
    `   → http://localhost:3000/sv/competitions/${competition.slug}\n`,
  );
  console.log("   Next step: use Admin → Resultat to enter match results");
  console.log("   and watch points accumulate in the leaderboard.\n");
}

function skillLabel(skill: number): string {
  if (skill >= 0.7) return "sharp";
  if (skill >= 0.5) return "good";
  if (skill >= 0.35) return "average";
  return "random";
}

/** Mock multi-source odds for realistic display */
function mockSources(avg: number): object {
  const sources = ["Unibet", "Betsson", "Bet365"];
  return sources.map((name) => ({
    name,
    value: Math.round((avg + (Math.random() - 0.5) * 0.15) * 100) / 100,
  }));
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
