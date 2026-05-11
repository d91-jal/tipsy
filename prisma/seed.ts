// prisma/seed.ts
import { PrismaClient, Stage } from "@prisma/client";
import { addHours } from "date-fns";
import { GROUPS, MATCHES, WC2026_START, WC2026_ODDS_LOCK } from "./data/wc2026";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Tournament ──────────────────────────────────────────────────────────────
  const tournament = await prisma.tournament.upsert({
    where: { slug: "wc2026" },
    update: { startDate: WC2026_START, oddsLockDate: WC2026_ODDS_LOCK },
    create: {
      slug: "wc2026",
      nameSv: "FIFA VM 2026",
      nameEn: "FIFA World Cup 2026",
      startDate: WC2026_START,
      oddsLockDate: WC2026_ODDS_LOCK,
      isActive: true,
    },
  });
  console.log(`✅ Tournament: ${tournament.nameEn}`);

  // ── Default competition ─────────────────────────────────────────────────────
  const defaultComp = await prisma.competition.upsert({
    where: { slug: "wc2026-main" },
    update: {},
    create: {
      tournamentId: tournament.id,
      slug: "wc2026-main",
      name: "VM 2026 — Huvudtävling",
      description: "Den officiella tippningsomgången för VM 2026",
      isPublic: true,
      simulationMode: false,
      createdBy: admin.id,
    },
  });

  await prisma.competitionMember.upsert({
    where: {
      competitionId_userId: { competitionId: defaultComp.id, userId: admin.id },
    },
    update: {},
    create: {
      competitionId: defaultComp.id,
      userId: admin.id,
      tipsPublic: true,
    },
  });
  console.log(`✅ Competition: ${defaultComp.name}`);

  // ── Groups & Teams ──────────────────────────────────────────────────────────
  const groupMap = new Map<string, string>(); // name → id
  const teamMap = new Map<string, string>(); // fifaCode → id

  for (const groupData of GROUPS) {
    const group = await prisma.group.upsert({
      where: {
        tournamentId_name: {
          tournamentId: tournament.id,
          name: groupData.name,
        },
      },
      update: {},
      create: { name: groupData.name, tournamentId: tournament.id },
    });
    groupMap.set(groupData.name, group.id);

    for (const teamData of groupData.teams) {
      const team = await prisma.team.upsert({
        where: { fifaCode: teamData.fifaCode },
        update: {
          nameSv: teamData.nameSv,
          nameEn: teamData.nameEn,
          groupId: group.id,
        },
        create: {
          nameSv: teamData.nameSv,
          nameEn: teamData.nameEn,
          fifaCode: teamData.fifaCode,
          flagUrl: `/flags/${teamData.fifaCode.toLowerCase()}.svg`,
          groupId: group.id,
        },
      });
      teamMap.set(teamData.fifaCode, team.id);
    }
    console.log(
      `  ✅ Group ${groupData.name}: ${groupData.teams.map((t) => t.fifaCode).join(", ")}`,
    );
  }

  // ── Matches ─────────────────────────────────────────────────────────────────
  let created = 0,
    updated = 0;

  for (const m of MATCHES) {
    const scheduledAt = new Date(m.scheduledAt);
    const isGroup = m.stage === "GROUP";
    const tipDeadline = isGroup ? WC2026_ODDS_LOCK : addHours(scheduledAt, -24);

    const data = {
      matchNumber: m.matchNumber,
      tournamentId: tournament.id,
      stage: m.stage as Stage,
      groupId: m.group ? (groupMap.get(m.group) ?? null) : null,
      homeTeamId: m.homeTeam ? (teamMap.get(m.homeTeam) ?? null) : null,
      awayTeamId: m.awayTeam ? (teamMap.get(m.awayTeam) ?? null) : null,
      scheduledAt,
      tipDeadline,
    };

    const existing = await prisma.match.findFirst({
      where: { matchNumber: m.matchNumber, tournamentId: tournament.id },
    });

    if (existing) {
      await prisma.match.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.match.create({ data });
      created++;
    }
  }
  console.log(`✅ Matches: ${created} created, ${updated} updated`);

  console.log("\n🎉 Seed complete!");
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log("   ⚠️  Run npm run db:seed again after any data corrections\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
