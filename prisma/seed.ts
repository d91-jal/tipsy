// prisma/seed.ts
import { PrismaClient, Stage } from "@prisma/client";
import { addDays, addHours } from "date-fns";
import {
  GROUPS,
  GROUP_MATCH_TEMPLATE,
  KNOCKOUT_MATCHES,
  WC2026_START,
  WC2026_ODDS_LOCK,
} from "./data/wc2026";
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
  console.log(`✅ Admin user: ${admin.email}`);

  // ── Tournament ──────────────────────────────────────────────────────────────
  const tournament = await prisma.tournament.upsert({
    where: { slug: "wc2026" },
    update: {},
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

  // ── Default Competition ─────────────────────────────────────────────────────
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

  // Add admin as first member
  await prisma.competitionMember.upsert({
    where: { competitionId_userId: { competitionId: defaultComp.id, userId: admin.id } },
    update: {},
    create: {
      competitionId: defaultComp.id,
      userId: admin.id,
      tipsPublic: true, // Admin's tips are public by default
    },
  });
  console.log(`✅ Default competition: ${defaultComp.name}`);

  // ── Groups & Teams ──────────────────────────────────────────────────────────
  let matchNumber = 1;
  const groupRecords: Record<string, { id: string; teams: { id: string; fifaCode: string }[] }> = {};

  for (const groupData of GROUPS) {
    // Upsert group
    const group = await prisma.group.upsert({
      where: { tournamentId_name: { tournamentId: tournament.id, name: groupData.name } },
      update: {},
      create: {
        name: groupData.name,
        tournamentId: tournament.id,
      },
    });

    // Upsert teams
    const teamRecords: { id: string; fifaCode: string }[] = [];
    for (const teamData of groupData.teams) {
      const team = await prisma.team.upsert({
        where: { fifaCode: teamData.fifaCode },
        update: { groupId: group.id },
        create: {
          nameSv: teamData.nameSv,
          nameEn: teamData.nameEn,
          fifaCode: teamData.fifaCode,
          flagUrl: `/flags/${teamData.fifaCode.toLowerCase()}.svg`,
          groupId: group.id,
        },
      });
      teamRecords.push({ id: team.id, fifaCode: team.fifaCode });
    }
    groupRecords[groupData.name] = { id: group.id, teams: teamRecords };

    // ── Group stage matches (6 per group, 3 matchdays) ───────────────────────
    // Matchday offsets (days after tournament start, approximate)
    const groupIndex = GROUPS.indexOf(groupData);
    const md1Day = Math.floor(groupIndex / 4);      // Groups spread over days 0-2
    const md2Day = md1Day + 6;
    const md3Day = md1Day + 12;                      // MD3 simultaneous

    const matchdays = [md1Day, md2Day, md3Day];
    const pairings = GROUP_MATCH_TEMPLATE;

    for (let md = 0; md < 3; md++) {
      const matchDate = addHours(addDays(WC2026_START, matchdays[md]), groupIndex % 4 < 2 ? 14 : 17);
      const tipDeadline = WC2026_ODDS_LOCK; // All group tips lock 2 days before tournament

      // Match A for this matchday
      const [h1, a1, h2, a2] = pairings[md];
      await upsertGroupMatch({
        matchNumber: matchNumber++,
        tournamentId: tournament.id,
        groupId: group.id,
        homeTeamId: teamRecords[h1].id,
        awayTeamId: teamRecords[a1].id,
        scheduledAt: matchDate,
        tipDeadline,
      });

      await upsertGroupMatch({
        matchNumber: matchNumber++,
        tournamentId: tournament.id,
        groupId: group.id,
        homeTeamId: teamRecords[h2].id,
        awayTeamId: teamRecords[a2].id,
        scheduledAt: addHours(matchDate, 3),
        tipDeadline,
      });
    }

    console.log(`  ✅ Group ${groupData.name}: ${teamRecords.length} teams, 6 matches`);
  }

  // ── Knockout matches (teams TBD, filled by admin after groups) ─────────────
  for (const km of KNOCKOUT_MATCHES) {
    const scheduledAt = addDays(WC2026_START, km.scheduledOffset);
    // Knockout tip deadline = 24h before match
    const tipDeadline = addHours(scheduledAt, -24);

    await prisma.match.upsert({
      where: {
        // Use a stable unique key
        id: `knockout-${km.matchNumber}`,
      },
      update: { scheduledAt, tipDeadline },
      create: {
        id: `knockout-${km.matchNumber}`,
        matchNumber: km.matchNumber,
        tournamentId: tournament.id,
        stage: km.stage as Stage,
        scheduledAt,
        tipDeadline,
        // homeTeamId & awayTeamId are null until admin sets them
      },
    });
  }
  console.log(`✅ ${KNOCKOUT_MATCHES.length} knockout match slots created`);

  console.log("\n🎉 Seed complete!");
  console.log(`   Total matches: ${matchNumber - 1} group + ${KNOCKOUT_MATCHES.length} knockout`);
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log("   ⚠️  Remember to verify team assignments against official FIFA draw!\n");
}

async function upsertGroupMatch(data: {
  matchNumber: number;
  tournamentId: string;
  groupId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledAt: Date;
  tipDeadline: Date;
}) {
  // Use matchNumber as stable identifier for group matches
  const existingMatch = await prisma.match.findFirst({
    where: { matchNumber: data.matchNumber, tournamentId: data.tournamentId },
  });

  if (existingMatch) {
    return prisma.match.update({
      where: { id: existingMatch.id },
      data: { scheduledAt: data.scheduledAt, tipDeadline: data.tipDeadline },
    });
  }

  return prisma.match.create({
    data: {
      matchNumber: data.matchNumber,
      tournamentId: data.tournamentId,
      groupId: data.groupId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      stage: "GROUP",
      scheduledAt: data.scheduledAt,
      tipDeadline: data.tipDeadline,
    },
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
