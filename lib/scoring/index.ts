// lib/scoring/index.ts
//
// Scoring rules:
//   Match tip (1X2):       correct → average odds for that outcome; wrong → 0
//   Group advancement tip: each correctly tipped advancing team → their AdvancementOdds avg value
//   Tournament finalist:   each correctly tipped finalist → their TournamentOdds REACH_FINAL value
//   Tournament winner:     correctly tipped winner → their TournamentOdds WIN value
//
// All odds are stored as Decimal; we work with numbers here and convert at persist.

import { prisma } from "@/lib/db";
import { Outcome } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// MATCH TIPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate and persist points for all tips on a finished match.
 * Call this after admin sets homeScore/awayScore and status = FINISHED.
 */
export async function scoreMatchTips(matchId: string): Promise<void> {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      odds: true,
      matchTips: true,
    },
  });

  if (match.homeScore === null || match.awayScore === null) {
    throw new Error(`Match ${matchId} has no result yet`);
  }

  const actualOutcome = getOutcome(match.homeScore, match.awayScore);

  // Find odds for the correct outcome
  const oddsForOutcome = match.odds.find((o) => o.outcome === actualOutcome);
  const points = oddsForOutcome ? Number(oddsForOutcome.avgValue) : 0;

  // Update all tips
  await Promise.all(
    match.matchTips.map((tip) =>
      prisma.matchTip.update({
        where: { id: tip.id },
        data: {
          pointsEarned: tip.prediction === actualOutcome ? points : 0,
        },
      })
    )
  );
}

function getOutcome(homeScore: number, awayScore: number): Outcome {
  if (homeScore > awayScore) return "HOME";
  if (awayScore > homeScore) return "AWAY";
  return "DRAW";
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP ADVANCEMENT TIPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score group advancement tips for a group after admin sets actual advancements.
 * Each correctly tipped team earns their AdvancementOdds value.
 * Both teams must be correct for a "perfect" tip; partial credit is given.
 */
export async function scoreGroupAdvancementTips(groupId: string): Promise<void> {
  const [actualAdvancements, tips, teams] = await Promise.all([
    prisma.groupActualAdvancement.findMany({ where: { groupId } }),
    prisma.groupAdvancementTip.findMany({ where: { groupId } }),
    prisma.team.findMany({
      where: { groupId },
      include: { advancementOdds: true },
    }),
  ]);

  if (actualAdvancements.length < 2) {
    throw new Error(`Group ${groupId} does not have 2 advancing teams set`);
  }

  const advancingTeamIds = new Set(actualAdvancements.map((a) => a.teamId));

  // Build odds map: teamId → avgValue
  const oddsMap = new Map<string, number>();
  for (const team of teams) {
    if (team.advancementOdds) {
      oddsMap.set(team.id, Number(team.advancementOdds.avgValue));
    }
  }

  await Promise.all(
    tips.map((tip) => {
      let points = 0;
      if (advancingTeamIds.has(tip.firstTeamId)) {
        points += oddsMap.get(tip.firstTeamId) ?? 0;
      }
      if (advancingTeamIds.has(tip.secondTeamId)) {
        points += oddsMap.get(tip.secondTeamId) ?? 0;
      }
      return prisma.groupAdvancementTip.update({
        where: { id: tip.id },
        data: { pointsEarned: points },
      });
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT TIPS (finalists + winner)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score all tournament tips after admin sets actual finalists and winner.
 * Points:
 *   Each correct finalist → TournamentOdds.REACH_FINAL for that team
 *   Correct winner         → TournamentOdds.WIN for that team
 */
export async function scoreTournamentTips(tournamentId: string): Promise<void> {
  const [actual, tips] = await Promise.all([
    prisma.tournamentActualResult.findUnique({ where: { tournamentId } }),
    prisma.tournamentTip.findMany({ where: { tournamentId } }),
  ]);

  if (!actual) {
    throw new Error(`No actual result set for tournament ${tournamentId}`);
  }

  const actualFinalistIds = new Set([actual.finalist1Id, actual.finalist2Id]);

  // Fetch odds for all involved teams
  const oddsRecords = await prisma.tournamentOdds.findMany({
    where: {
      teamId: { in: [actual.finalist1Id, actual.finalist2Id, actual.winnerId] },
    },
  });

  const reachFinalOdds = new Map<string, number>();
  const winOdds = new Map<string, number>();
  for (const o of oddsRecords) {
    if (o.type === "REACH_FINAL") reachFinalOdds.set(o.teamId, Number(o.avgValue));
    if (o.type === "WIN") winOdds.set(o.teamId, Number(o.avgValue));
  }

  await Promise.all(
    tips.map((tip) => {
      let points = 0;
      if (actualFinalistIds.has(tip.finalist1Id)) {
        points += reachFinalOdds.get(tip.finalist1Id) ?? 0;
      }
      if (actualFinalistIds.has(tip.finalist2Id)) {
        points += reachFinalOdds.get(tip.finalist2Id) ?? 0;
      }
      if (tip.winnerId === actual.winnerId) {
        points += winOdds.get(actual.winnerId) ?? 0;
      }
      return prisma.tournamentTip.update({
        where: { id: tip.id },
        data: { pointsEarned: points },
      });
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

export type LeaderboardEntry = {
  userId: string;
  name: string | null;
  email: string;
  totalPoints: number;
  matchPoints: number;
  advancementPoints: number;
  tournamentPoints: number;
  tipsPublic: boolean;
  isSimBot: boolean;
  rank: number;
};

export async function getLeaderboard(competitionId: string): Promise<LeaderboardEntry[]> {
  // Fetch all members of this competition
  const members = await prisma.competitionMember.findMany({
    where: { competitionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          matchTips: { select: { pointsEarned: true } },
          groupAdvancementTips: { select: { pointsEarned: true } },
          tournamentTip: { select: { pointsEarned: true } },
        },
      },
    },
  });

  const entries: Omit<LeaderboardEntry, "rank">[] = members.map((member) => {
    const { user } = member;
    const matchPoints = sumPoints(user.matchTips.map((t) => t.pointsEarned));
    const advancementPoints = sumPoints(user.groupAdvancementTips.map((t) => t.pointsEarned));
    const tournamentPoints = user.tournamentTip?.pointsEarned
      ? Number(user.tournamentTip.pointsEarned)
      : 0;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      matchPoints,
      advancementPoints,
      tournamentPoints,
      totalPoints: matchPoints + advancementPoints + tournamentPoints,
      tipsPublic: member.tipsPublic,
      isSimBot: member.isSimBot,
    };
  });

  entries.sort((a, b) => b.totalPoints - a.totalPoints);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

/**
 * Check if a given user's tips should be visible to another user in a competition.
 * Tips are visible if:
 *  - The viewer is the owner of the tips
 *  - The tip's deadline has passed
 *  - The member has tipsPublic = true
 */
export async function areTipsVisible(
  ownerId: string,
  viewerId: string,
  competitionId: string,
  deadline: Date
): Promise<boolean> {
  if (ownerId === viewerId) return true;
  if (new Date() > deadline) return true;

  const member = await prisma.competitionMember.findUnique({
    where: { competitionId_userId: { competitionId, userId: ownerId } },
    select: { tipsPublic: true },
  });
  return member?.tipsPublic ?? false;
}

function sumPoints(values: (import("@prisma/client").Prisma.Decimal | null)[]): number {
  return values.reduce((sum, v) => sum + (v ? Number(v) : 0), 0);
}
