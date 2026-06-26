import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

async function main() {
  const fileArgIdx = process.argv.indexOf("--file");
  const filePath =
    fileArgIdx !== -1
      ? resolve(process.argv[fileArgIdx + 1])
      : resolve("scripts/data/advancement-tips.csv");

  console.log(`📂 Reading ${filePath}`);
  const rows = parseCsv(readFileSync(filePath, "utf-8"));
  console.log(`   ${rows.length} row(s) found\n`);

  let ok = 0;
  let failed = 0;

  for (const row of rows) {
    const { userEmail, groupName, tournamentSlug, firstTeamFifaCode, secondTeamFifaCode } = row;
    const label = `${userEmail} / group ${groupName} (${firstTeamFifaCode}, ${secondTeamFifaCode})`;

    try {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (!user) throw new Error(`User not found: ${userEmail}`);

      const tournament = await prisma.tournament.findUnique({ where: { slug: tournamentSlug } });
      if (!tournament) throw new Error(`Tournament not found: ${tournamentSlug}`);

      const group = await prisma.group.findUnique({
        where: { tournamentId_name: { tournamentId: tournament.id, name: groupName } },
      });
      if (!group) throw new Error(`Group not found: ${groupName} in ${tournamentSlug}`);

      const firstTeam = await prisma.team.findUnique({ where: { fifaCode: firstTeamFifaCode } });
      if (!firstTeam) throw new Error(`Team not found: ${firstTeamFifaCode}`);

      const secondTeam = await prisma.team.findUnique({ where: { fifaCode: secondTeamFifaCode } });
      if (!secondTeam) throw new Error(`Team not found: ${secondTeamFifaCode}`);

      await prisma.groupAdvancementTip.upsert({
        where: { userId_groupId: { userId: user.id, groupId: group.id } },
        update: { firstTeamId: firstTeam.id, secondTeamId: secondTeam.id },
        create: {
          userId: user.id,
          groupId: group.id,
          firstTeamId: firstTeam.id,
          secondTeamId: secondTeam.id,
        },
      });

      console.log(`✅ ${label}`);
      ok++;
    } catch (err) {
      console.error(`❌ ${label}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n${ok} upserted, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().finally(() => prisma.$disconnect());
