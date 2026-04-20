// lib/actions/admin.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  scoreMatchTips,
  scoreGroupAdvancementTips,
  scoreTournamentTips,
} from "@/lib/scoring";

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("NOT_AUTHENTICATED");
  if (session.user.role !== "ADMIN") throw new Error("NOT_AUTHORIZED");
  return session.user;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH RESULT
// ─────────────────────────────────────────────────────────────────────────────

const matchResultSchema = z.object({
  matchId: z.string(),
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});

export async function setMatchResult(formData: FormData) {
  await requireAdmin();

  const parsed = matchResultSchema.safeParse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const { matchId, homeScore, awayScore } = parsed.data;

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: "FINISHED" },
  });

  await scoreMatchTips(matchId);

  revalidatePath("/[locale]/standings", "page");
  revalidatePath("/[locale]/admin/results", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP ACTUAL ADVANCEMENT
// ─────────────────────────────────────────────────────────────────────────────

const groupAdvancementSchema = z.object({
  groupId: z.string(),
  firstTeamId: z.string(),
  secondTeamId: z.string(),
}).refine((d) => d.firstTeamId !== d.secondTeamId);

export async function setGroupActualAdvancement(formData: FormData) {
  await requireAdmin();

  const parsed = groupAdvancementSchema.safeParse({
    groupId: formData.get("groupId"),
    firstTeamId: formData.get("firstTeamId"),
    secondTeamId: formData.get("secondTeamId"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const { groupId, firstTeamId, secondTeamId } = parsed.data;

  await prisma.$transaction([
    prisma.groupActualAdvancement.deleteMany({ where: { groupId } }),
    prisma.groupActualAdvancement.createMany({
      data: [
        { groupId, teamId: firstTeamId, position: 1 },
        { groupId, teamId: secondTeamId, position: 2 },
      ],
    }),
  ]);

  await scoreGroupAdvancementTips(groupId);

  revalidatePath("/[locale]/standings", "page");
  revalidatePath("/[locale]/admin/results", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT ACTUAL RESULT
// ─────────────────────────────────────────────────────────────────────────────

const tournamentResultSchema = z.object({
  tournamentId: z.string(),
  finalist1Id: z.string(),
  finalist2Id: z.string(),
  winnerId: z.string(),
}).refine((d) => d.finalist1Id !== d.finalist2Id)
  .refine((d) => [d.finalist1Id, d.finalist2Id].includes(d.winnerId));

export async function setTournamentActualResult(formData: FormData) {
  await requireAdmin();

  const parsed = tournamentResultSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    finalist1Id: formData.get("finalist1Id"),
    finalist2Id: formData.get("finalist2Id"),
    winnerId: formData.get("winnerId"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const { tournamentId, finalist1Id, finalist2Id, winnerId } = parsed.data;

  await prisma.tournamentActualResult.upsert({
    where: { tournamentId },
    update: { finalist1Id, finalist2Id, winnerId },
    create: { tournamentId, finalist1Id, finalist2Id, winnerId },
  });

  await scoreTournamentTips(tournamentId);
  revalidatePath("/[locale]/standings", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH ODDS
// ─────────────────────────────────────────────────────────────────────────────

const oddsEntrySchema = z.object({
  value: z.coerce.number().min(1.01),
  source: z.string().min(1),
});

const matchOddsSchema = z.object({
  matchId: z.string(),
  homeOdds: oddsEntrySchema,
  drawOdds: oddsEntrySchema,
  awayOdds: oddsEntrySchema,
  // Sources must match across all three outcomes
});

export async function setMatchOdds(formData: FormData) {
  const admin = await requireAdmin();

  // Parse per-source odds from form: home_source_0, home_value_0, etc.
  // For simplicity, we accept pre-averaged values from admin UI
  const sources = JSON.parse(formData.get("sources") as string);
  // sources = { HOME: [{name, value}, ...], DRAW: [...], AWAY: [...] }

  const matchId = formData.get("matchId") as string;
  if (!matchId) throw new Error("INVALID_INPUT");

  const outcomes = ["HOME", "DRAW", "AWAY"] as const;

  await prisma.$transaction(
    outcomes.map((outcome) => {
      const entries: { name: string; value: number }[] = sources[outcome] ?? [];
      const avg =
        entries.length > 0
          ? entries.reduce((s, e) => s + e.value, 0) / entries.length
          : 0;

      return prisma.matchOdds.upsert({
        where: { matchId_outcome: { matchId, outcome } },
        update: {
          avgValue: avg,
          sources: entries,
          recordedAt: new Date(),
          recordedBy: admin.id,
        },
        create: {
          matchId,
          outcome,
          avgValue: avg,
          sources: entries,
          recordedBy: admin.id,
        },
      });
    })
  );

  revalidatePath("/[locale]/admin/odds", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// INVITE USER
// ─────────────────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function inviteUser(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
  });
  if (!parsed.success) throw new Error("INVALID_EMAIL");

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) throw new Error("USER_EXISTS");

  // Create user without password — they'll use magic link to set up
  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      role: "USER",
      invitedBy: admin.id,
    },
  });

  revalidatePath("/[locale]/admin/users", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOCKOUT MATCH TEAMS (set after group stage)
// ─────────────────────────────────────────────────────────────────────────────

export async function setKnockoutMatchTeams(formData: FormData) {
  await requireAdmin();

  const matchId = formData.get("matchId") as string;
  const homeTeamId = formData.get("homeTeamId") as string;
  const awayTeamId = formData.get("awayTeamId") as string;

  if (!matchId || !homeTeamId || !awayTeamId) throw new Error("INVALID_INPUT");
  if (homeTeamId === awayTeamId) throw new Error("SAME_TEAM");

  await prisma.match.update({
    where: { id: matchId },
    data: { homeTeamId, awayTeamId },
  });

  revalidatePath("/[locale]/tips/knockout", "page");
  revalidatePath("/[locale]/admin/results", "page");
}
