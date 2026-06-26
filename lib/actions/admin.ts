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

const groupAdvancementSchema = z
  .object({
    groupId: z.string(),
    firstTeamId: z.string(),
    secondTeamId: z.string(),
  })
  .refine((d) => d.firstTeamId !== d.secondTeamId);

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
  revalidatePath("/[locale]/admin/advancement", "page");
  revalidatePath("/[locale]/tips/advancement", "page");
}

export type AdvancementResult = {
  processed: number;
  skipped: number;
  groups: { name: string; first: string; second: string }[];
  errors: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT ACTUAL RESULT
// ─────────────────────────────────────────────────────────────────────────────

const tournamentResultSchema = z
  .object({
    tournamentId: z.string(),
    finalist1Id: z.string(),
    finalist2Id: z.string(),
    winnerId: z.string(),
  })
  .refine((d) => d.finalist1Id !== d.finalist2Id)
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

const matchOddsSchema = z.object({
  matchId: z.string().min(1),
  homeOdds: z.coerce.number().min(1.01),
  drawOdds: z.coerce.number().min(1.01),
  awayOdds: z.coerce.number().min(1.01),
  source: z.string().min(1),
});

export async function setMatchOdds(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = matchOddsSchema.safeParse({
    matchId: formData.get("matchId"),
    homeOdds: formData.get("homeOdds"),
    drawOdds: formData.get("drawOdds"),
    awayOdds: formData.get("awayOdds"),
    source: formData.get("source"),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const { matchId, homeOdds, drawOdds, awayOdds, source } = parsed.data;

  const byOutcome = {
    HOME: homeOdds,
    DRAW: drawOdds,
    AWAY: awayOdds,
  } as const;
  const outcomes = ["HOME", "DRAW", "AWAY"] as const;

  await prisma.$transaction(
    outcomes.map((outcome) => {
      const value = byOutcome[outcome];
      const entries = [{ name: source, value }];

      return prisma.matchOdds.upsert({
        where: { matchId_outcome: { matchId, outcome } },
        update: {
          avgValue: value,
          sources: entries,
          recordedAt: new Date(),
          recordedBy: admin.id,
        },
        create: {
          matchId,
          outcome,
          avgValue: value,
          sources: entries,
          recordedBy: admin.id,
        },
      });
    }),
  );

  revalidatePath("/[locale]/admin/odds", "page");
  revalidatePath("/[locale]/admin/knockout", "page");
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
  revalidatePath("/[locale]/admin/knockout", "page");
  revalidatePath("/[locale]/admin/results", "page");
}
