// lib/actions/simulate.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, startOfDay, isSameDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { scoreMatchTips, scoreGroupAdvancementTips } from "@/lib/scoring";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("NOT_AUTHORIZED");
  return session.user;
}

// ─────────────────────────────────────────────────────────────────────────────
// RANDOM HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Simple Poisson-ish random goal count, weighted toward low scores */
function randomGoals(): number {
  const r = Math.random();
  if (r < 0.28) return 0;
  if (r < 0.58) return 1;
  if (r < 0.80) return 2;
  if (r < 0.92) return 3;
  if (r < 0.98) return 4;
  return 5;
}

function randomOutcome(): "HOME" | "DRAW" | "AWAY" {
  const r = Math.random();
  return r < 0.40 ? "HOME" : r < 0.65 ? "DRAW" : "AWAY";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const BOT_NAMES = [
  "Tipparen", "Goalmachine", "Oddsen", "Fotbollsexpert", "VM-Ninja",
  "Halvtidsanalytiker", "xG-Guru", "Straffspecialist", "Torbjörn Tipp",
  "Anita Analys", "Bert Bolltips", "Dora Deadline", "Erik Elva",
  "Frida Final", "Gustav Grupp", "Hanna Hattrick", "Ivan Insats",
  "Jenny Joker", "Karl Kvart", "Lisa Ligan",
];

// ─────────────────────────────────────────────────────────────────────────────
// CREATE SIMBOTS
// ─────────────────────────────────────────────────────────────────────────────

export type SimBotResult = { success: boolean; created: number; error?: string };

export async function createSimBots(
  competitionId: string,
  count: number
): Promise<SimBotResult> {
  await requireAdmin();

  if (count < 1 || count > 50) return { success: false, created: 0, error: "INVALID_COUNT" };

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      tournament: {
        include: {
          groups: {
            include: {
              teams: true,
              matches: { where: { stage: "GROUP" }, include: { odds: true } },
            },
          },
          matches: {
            where: { stage: { not: "GROUP" } },
            include: { odds: true },
          },
        },
      },
    },
  });
  if (!competition?.simulationMode) {
    return { success: false, created: 0, error: "NOT_SIMULATION_MODE" };
  }

  const allTeams = competition.tournament.groups.flatMap((g) => g.teams);
  let created = 0;

  for (let i = 0; i < count; i++) {
    const nameIdx = Math.floor(Math.random() * BOT_NAMES.length);
    const botEmail = `simbot-${competitionId.slice(-6)}-${Date.now()}-${i}@sim.internal`;

    const bot = await prisma.user.create({
      data: {
        email: botEmail,
        name: `${BOT_NAMES[nameIdx]} ${i + 1}`,
        role: "USER",
        emailVerified: new Date(),
      },
    });

    // Add as member
    await prisma.competitionMember.create({
      data: {
        competitionId,
        userId: bot.id,
        isSimBot: true,
        tipsPublic: false,
      },
    });

    // Generate random group-stage match tips (bypass deadline — simulation)
    const groupMatches = competition.tournament.groups.flatMap((g) => g.matches);
    for (const match of groupMatches) {
      if (!match.homeTeamId || !match.awayTeamId) continue;
      await prisma.matchTip.upsert({
        where: { userId_matchId: { userId: bot.id, matchId: match.id } },
        update: {},
        create: {
          userId: bot.id,
          matchId: match.id,
          prediction: randomOutcome(),
        },
      });
    }

    // Generate random group advancement tips
    for (const group of competition.tournament.groups) {
      if (group.teams.length < 2) continue;
      const shuffled = [...group.teams].sort(() => Math.random() - 0.5);
      await prisma.groupAdvancementTip.upsert({
        where: { userId_groupId: { userId: bot.id, groupId: group.id } },
        update: {},
        create: {
          userId: bot.id,
          groupId: group.id,
          firstTeamId: shuffled[0].id,
          secondTeamId: shuffled[1].id,
        },
      });
    }

    // Generate random tournament tip
    if (allTeams.length >= 2) {
      const shuffled = [...allTeams].sort(() => Math.random() - 0.5);
      await prisma.tournamentTip.upsert({
        where: { userId: bot.id },
        update: {},
        create: {
          userId: bot.id,
          tournamentId: competition.tournamentId,
          finalist1Id: shuffled[0].id,
          finalist2Id: shuffled[1].id,
          winnerId: pick([shuffled[0].id, shuffled[1].id]),
        },
      });
    }

    created++;
  }

  revalidatePath("/[locale]/admin/simulate", "page");
  return { success: true, created };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCE ONE SIMULATION DAY
// ─────────────────────────────────────────────────────────────────────────────

export type AdvanceDayResult = {
  success: boolean;
  newDate: string;
  matchesResolved: number;
  groupsCompleted: number;
  error?: string;
};

export async function advanceSimDay(competitionId: string): Promise<AdvanceDayResult> {
  await requireAdmin();

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: { tournament: { select: { startDate: true, id: true } } },
  });
  if (!competition?.simulationMode) {
    return { success: false, newDate: "", matchesResolved: 0, groupsCompleted: 0, error: "NOT_SIMULATION_MODE" };
  }

  // Determine next simulated day
  const currentSimDate = competition.simulatedDate
    ? startOfDay(competition.simulatedDate)
    : startOfDay(addDays(competition.tournament.startDate, -1));

  const nextDay = addDays(currentSimDate, 1);

  // Find all scheduled matches on nextDay
  const matchesOnDay = await prisma.match.findMany({
    where: {
      tournamentId: competition.tournamentId,
      status: "SCHEDULED",
      homeTeamId: { not: null },
      awayTeamId: { not: null },
      scheduledAt: {
        gte: nextDay,
        lt: addDays(nextDay, 1),
      },
    },
  });

  let matchesResolved = 0;
  const affectedGroupIds = new Set<string>();

  // Set random results for each match
  for (const match of matchesOnDay) {
    const homeScore = randomGoals();
    const awayScore = randomGoals();

    await prisma.match.update({
      where: { id: match.id },
      data: { homeScore, awayScore, status: "FINISHED" },
    });

    await scoreMatchTips(match.id);
    if (match.groupId) affectedGroupIds.add(match.groupId);
    matchesResolved++;

    // For knockout simBots: generate a tip for any new match that opened up
    // (in simulation, knockout matches can be tipped at any time before the match)
    await generateSimBotKnockoutTips(competitionId, match.id);
  }

  // After resolving, check if any groups are now fully played
  let groupsCompleted = 0;
  for (const groupId of affectedGroupIds) {
    const allGroupMatches = await prisma.match.findMany({
      where: { groupId, stage: "GROUP" },
    });
    const allFinished = allGroupMatches.every((m) => m.status === "FINISHED");

    if (allFinished) {
      await autoSetGroupAdvancements(groupId);
      groupsCompleted++;
    }
  }

  // Update simulated date
  await prisma.competition.update({
    where: { id: competitionId },
    data: { simulatedDate: nextDay },
  });

  revalidatePath("/[locale]/admin/simulate", "page");
  revalidatePath("/[locale]/competitions", "page");

  return {
    success: true,
    newDate: nextDay.toISOString(),
    matchesResolved,
    groupsCompleted,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SET GROUP ADVANCEMENTS FROM SIMULATED RESULTS
// ─────────────────────────────────────────────────────────────────────────────

async function autoSetGroupAdvancements(groupId: string): Promise<void> {
  const matches = await prisma.match.findMany({
    where: { groupId, stage: "GROUP" },
    include: { homeTeam: true, awayTeam: true },
  });

  const teams = await prisma.team.findMany({ where: { groupId } });

  // Calculate group table
  const table: Record<string, { points: number; gd: number; gf: number }> = {};
  for (const t of teams) {
    table[t.id] = { points: 0, gd: 0, gf: 0 };
  }

  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) continue;
    if (!match.homeTeamId || !match.awayTeamId) continue;

    const h = match.homeTeamId;
    const a = match.awayTeamId;
    const hs = match.homeScore;
    const as_ = match.awayScore;

    table[h].gf += hs;
    table[h].gd += hs - as_;
    table[a].gf += as_;
    table[a].gd += as_ - hs;

    if (hs > as_) {
      table[h].points += 3;
    } else if (hs === as_) {
      table[h].points += 1;
      table[a].points += 1;
    } else {
      table[a].points += 3;
    }
  }

  // Sort by points → GD → GF → random
  const sorted = Object.entries(table).sort(([, a], [, b]) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return Math.random() - 0.5; // Random tiebreak for simulation
  });

  const [first, second] = sorted;
  if (!first || !second) return;

  // Upsert actual advancement
  await prisma.$transaction([
    prisma.groupActualAdvancement.deleteMany({ where: { groupId } }),
    prisma.groupActualAdvancement.createMany({
      data: [
        { groupId, teamId: first[0], position: 1 },
        { groupId, teamId: second[0], position: 2 },
      ],
    }),
  ]);

  await scoreGroupAdvancementTips(groupId);
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE SIMBOT TIPS FOR KNOCKOUT MATCHES
// ─────────────────────────────────────────────────────────────────────────────

async function generateSimBotKnockoutTips(
  competitionId: string,
  matchId: string
): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { stage: true, homeTeamId: true, awayTeamId: true },
  });
  if (!match || match.stage === "GROUP") return;

  // Get all SimBots in this competition
  const bots = await prisma.competitionMember.findMany({
    where: { competitionId, isSimBot: true },
    select: { userId: true },
  });

  for (const { userId } of bots) {
    await prisma.matchTip.upsert({
      where: { userId_matchId: { userId, matchId } },
      update: {},
      create: {
        userId,
        matchId,
        prediction: randomOutcome(),
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET SIMULATION
// ─────────────────────────────────────────────────────────────────────────────

export type ResetResult = { success: boolean; removed: number; error?: string };

export async function resetSimulation(competitionId: string): Promise<ResetResult> {
  await requireAdmin();

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { simulationMode: true, tournamentId: true },
  });
  if (!competition?.simulationMode) {
    return { success: false, removed: 0, error: "NOT_SIMULATION_MODE" };
  }

  // Get all SimBot userIds in this competition
  const bots = await prisma.competitionMember.findMany({
    where: { competitionId, isSimBot: true },
    select: { userId: true },
  });
  const botIds = bots.map((b) => b.userId);

  // Delete all their tips
  await prisma.matchTip.deleteMany({ where: { userId: { in: botIds } } });
  await prisma.groupAdvancementTip.deleteMany({ where: { userId: { in: botIds } } });
  await prisma.tournamentTip.deleteMany({ where: { userId: { in: botIds } } });

  // Delete bot users (cascade deletes CompetitionMember too)
  await prisma.user.deleteMany({ where: { id: { in: botIds } } });

  // Reset match results for this tournament
  await prisma.match.updateMany({
    where: { tournamentId: competition.tournamentId },
    data: { homeScore: null, awayScore: null, status: "SCHEDULED" },
  });

  // Reset match tip points
  await prisma.matchTip.updateMany({
    where: { match: { tournamentId: competition.tournamentId } },
    data: { pointsEarned: null },
  });

  // Reset group advancements
  const groups = await prisma.group.findMany({
    where: { tournamentId: competition.tournamentId },
    select: { id: true },
  });
  await prisma.groupActualAdvancement.deleteMany({
    where: { groupId: { in: groups.map((g) => g.id) } },
  });
  await prisma.groupAdvancementTip.updateMany({
    where: { userId: { in: botIds } },
    data: { pointsEarned: null },
  });

  // Reset tournament result
  await prisma.tournamentActualResult.deleteMany({
    where: { tournamentId: competition.tournamentId },
  });

  // Reset simulated date
  await prisma.competition.update({
    where: { id: competitionId },
    data: { simulatedDate: null },
  });

  revalidatePath("/[locale]/admin/simulate", "page");
  return { success: true, removed: botIds.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SIMULATION STATUS
// ─────────────────────────────────────────────────────────────────────────────

export type SimStatus = {
  competitionId: string;
  name: string;
  simulationMode: boolean;
  simulatedDate: Date | null;
  tournamentStartDate: Date;
  tournamentEndDate: Date;
  totalDays: number;
  currentDay: number;
  botCount: number;
  matchesFinished: number;
  matchesTotal: number;
};

export async function getSimStatus(competitionId: string): Promise<SimStatus | null> {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      tournament: {
        select: {
          startDate: true,
          matches: { select: { id: true, status: true } },
        },
      },
      members: { where: { isSimBot: true }, select: { id: true } },
    },
  });
  if (!competition) return null;

  const tournamentEndDate = addDays(competition.tournament.startDate, 47);
  const totalDays = 48;
  const currentDay = competition.simulatedDate
    ? Math.ceil(
        (startOfDay(competition.simulatedDate).getTime() -
          startOfDay(competition.tournament.startDate).getTime()) /
          86400000
      )
    : -1;

  return {
    competitionId,
    name: competition.name,
    simulationMode: competition.simulationMode,
    simulatedDate: competition.simulatedDate,
    tournamentStartDate: competition.tournament.startDate,
    tournamentEndDate,
    totalDays,
    currentDay,
    botCount: competition.members.length,
    matchesFinished: competition.tournament.matches.filter((m) => m.status === "FINISHED").length,
    matchesTotal: competition.tournament.matches.length,
  };
}
