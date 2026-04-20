// lib/actions/competitions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("NOT_AUTHENTICATED");
  return session.user;
}

async function requireAdmin() {
  const user = await requireSession();
  if (user.role !== "ADMIN") throw new Error("NOT_AUTHORIZED");
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE COMPETITION (admin only)
// ─────────────────────────────────────────────────────────────────────────────

const createSchema = z.object({
  tournamentSlug: z.string(),
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  isPublic: z.coerce.boolean(),
  accessCode: z.string().max(40).optional(),
  simulationMode: z.coerce.boolean().default(false),
});

export type CreateCompetitionState = { success: boolean; slug?: string; error?: string };

export async function createCompetition(
  _prev: CreateCompetitionState,
  formData: FormData
): Promise<CreateCompetitionState> {
  const admin = await requireAdmin();

  const parsed = createSchema.safeParse({
    tournamentSlug: formData.get("tournamentSlug"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    isPublic: formData.get("isPublic") === "true",
    accessCode: formData.get("accessCode") || undefined,
    simulationMode: formData.get("simulationMode") === "true",
  });
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  const tournament = await prisma.tournament.findUnique({
    where: { slug: parsed.data.tournamentSlug },
  });
  if (!tournament) return { success: false, error: "TOURNAMENT_NOT_FOUND" };

  // Generate slug from name
  const slug = slugify(parsed.data.name) + "-" + Date.now().toString(36);

  const competition = await prisma.competition.create({
    data: {
      tournamentId: tournament.id,
      slug,
      name: parsed.data.name,
      description: parsed.data.description,
      isPublic: parsed.data.isPublic,
      accessCode: parsed.data.accessCode || null,
      simulationMode: parsed.data.simulationMode,
      createdBy: admin.id,
    },
  });

  // Auto-add admin as member with tipsPublic = true
  await prisma.competitionMember.create({
    data: {
      competitionId: competition.id,
      userId: admin.id,
      tipsPublic: true,
    },
  });

  revalidatePath("/[locale]/competitions", "page");
  revalidatePath("/[locale]/admin/competitions", "page");
  return { success: true, slug: competition.slug };
}

// ─────────────────────────────────────────────────────────────────────────────
// JOIN COMPETITION
// ─────────────────────────────────────────────────────────────────────────────

export type JoinState = { success: boolean; error?: string };

export async function joinCompetition(
  _prev: JoinState,
  formData: FormData
): Promise<JoinState> {
  const user = await requireSession();

  const competitionId = formData.get("competitionId") as string;
  const accessCode = (formData.get("accessCode") as string) || undefined;

  if (!competitionId) return { success: false, error: "INVALID_INPUT" };

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { id: true, isPublic: true, accessCode: true },
  });
  if (!competition) return { success: false, error: "NOT_FOUND" };

  // Check access code for private competitions
  if (!competition.isPublic) {
    if (!accessCode || accessCode !== competition.accessCode) {
      return { success: false, error: "INVALID_ACCESS_CODE" };
    }
  }

  // Idempotent join
  await prisma.competitionMember.upsert({
    where: { competitionId_userId: { competitionId, userId: user.id } },
    update: {},
    create: { competitionId, userId: user.id, tipsPublic: false },
  });

  revalidatePath("/[locale]/competitions", "page");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE OWN VISIBILITY IN A COMPETITION
// ─────────────────────────────────────────────────────────────────────────────

export async function updateTipsVisibility(
  competitionId: string,
  tipsPublic: boolean
): Promise<void> {
  const user = await requireSession();

  await prisma.competitionMember.update({
    where: { competitionId_userId: { competitionId, userId: user.id } },
    data: { tipsPublic },
  });

  revalidatePath("/[locale]/competitions/[slug]", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: ADD EXISTING USER TO COMPETITION
// ─────────────────────────────────────────────────────────────────────────────

export async function addUserToCompetition(formData: FormData): Promise<void> {
  await requireAdmin();

  const competitionId = formData.get("competitionId") as string;
  const email = formData.get("email") as string;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("USER_NOT_FOUND");

  await prisma.competitionMember.upsert({
    where: { competitionId_userId: { competitionId, userId: user.id } },
    update: {},
    create: { competitionId, userId: user.id },
  });

  revalidatePath("/[locale]/admin/competitions", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
