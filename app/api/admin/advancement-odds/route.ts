// app/api/admin/advancement-odds/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  entries: z.array(z.object({
    teamId: z.string(),
    value: z.number().min(1.01),
    adminId: z.string(),
  })),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await Promise.all(
    parsed.data.entries
      .filter((e) => !isNaN(e.value) && e.value > 0)
      .map((e) =>
        prisma.advancementOdds.upsert({
          where: { teamId: e.teamId },
          update: {
            avgValue: e.value,
            sources: [],
            recordedAt: new Date(),
            recordedBy: session.user.id,
          },
          create: {
            teamId: e.teamId,
            avgValue: e.value,
            sources: [],
            recordedBy: session.user.id,
          },
        })
      )
  );

  return NextResponse.json({ ok: true });
}
