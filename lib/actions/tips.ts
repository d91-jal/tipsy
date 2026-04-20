// lib/actions/tips.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// MATCH TIP
// ─────────────────────────────────────────────────────────────────────────────

const matchTipSchema = z.object({
  matchId: z.string(),
  prediction: z.enum(["HOME", "DRAW", "AWAY"]),
});

export type MatchTipState = { success: boolean; error?: string };

export async function submitMatchTip(
  _prev: MatchTipState,
  formData: FormData
): Promise<MatchTipState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "NOT_AUTHENTICATED" };

  const parsed = matchTipSchema.safeParse({
    matchId: formData.get("matchId"),
    prediction: formData.get("prediction"),
  });
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const { matchId, prediction } = parsed.data;

  // Check deadline
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { tipDeadline: true, status: true },
  });

  if (!match) return { success: false, error: "MATCH_NOT_FOUND" };
  if (match.status === "FINISHED") return { success: false, error: "MATCH_FINISHED" };
  if (new Date() > match.tipDeadline) return { success: false, error: "DEADLINE_PASSED" };

  await prisma.matchTip.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { prediction, updatedAt: new Date() },
    create: { userId: session.user.id, matchId, prediction },
  });

  revalidatePath("/[locale]/tips/group-stage", "page");
  revalidatePath("/[locale]/tips/knockout", "page");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP ADVANCEMENT TIP
// ─────────────────────────────────────────────────────────────────────────────

const advancementTipSchema = z.object({
  groupId: z.string(),
  firstTeamId: z.string(),
  secondTeamId: z.string(),
}).refine((d) => d.firstTeamId !== d.secondTeamId, {
  message: "Must select two different teams",
});

export async function submitGroupAdvancementTip(
  _prev: MatchTipState,
  formData: FormData
): Promise<MatchTipState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "NOT_AUTHENTICATED" };

  const parsed = advancementTipSchema.safeParse({
    groupId: formData.get("groupId"),
    firstTeamId: formData.get("firstTeamId"),
    secondTeamId: formData.get("secondTeamId"),
  });
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const { groupId, firstTeamId, secondTeamId } = parsed.data;

  // Get tournament to check lock date
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { tournament: { select: { oddsLockDate: true } } },
  });

  if (!group) return { success: false, error: "GROUP_NOT_FOUND" };
  if (new Date() > group.tournament.oddsLockDate) {
    return { success: false, error: "DEADLINE_PASSED" };
  }

  // Verify both teams belong to this group
  const teamsInGroup = await prisma.team.findMany({
    where: { groupId, id: { in: [firstTeamId, secondTeamId] } },
  });
  if (teamsInGroup.length !== 2) return { success: false, error: "INVALID_TEAMS" };

  await prisma.groupAdvancementTip.upsert({
    where: { userId_groupId: { userId: session.user.id, groupId } },
    update: { firstTeamId, secondTeamId, updatedAt: new Date() },
    create: { userId: session.user.id, groupId, firstTeamId, secondTeamId },
  });

  revalidatePath("/[locale]/tips/advancement", "page");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT TIP (finalists + winner)
// ─────────────────────────────────────────────────────────────────────────────

const tournamentTipSchema = z.object({
  tournamentId: z.string(),
  finalist1Id: z.string(),
  finalist2Id: z.string(),
  winnerId: z.string(),
}).refine((d) => d.finalist1Id !== d.finalist2Id, {
  message: "Finalists must be different teams",
}).refine((d) => [d.finalist1Id, d.finalist2Id].includes(d.winnerId), {
  message: "Winner must be one of the finalists",
});

export async function submitTournamentTip(
  _prev: MatchTipState,
  formData: FormData
): Promise<MatchTipState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "NOT_AUTHENTICATED" };

  const parsed = tournamentTipSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    finalist1Id: formData.get("finalist1Id"),
    finalist2Id: formData.get("finalist2Id"),
    winnerId: formData.get("winnerId"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message };

  const { tournamentId, finalist1Id, finalist2Id, winnerId } = parsed.data;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { oddsLockDate: true },
  });

  if (!tournament) return { success: false, error: "TOURNAMENT_NOT_FOUND" };
  if (new Date() > tournament.oddsLockDate) {
    return { success: false, error: "DEADLINE_PASSED" };
  }

  await prisma.tournamentTip.upsert({
    where: { userId: session.user.id },
    update: { finalist1Id, finalist2Id, winnerId, updatedAt: new Date() },
    create: { userId: session.user.id, tournamentId, finalist1Id, finalist2Id, winnerId },
  });

  revalidatePath("/[locale]/tips/tournament", "page");
  return { success: true };
}
