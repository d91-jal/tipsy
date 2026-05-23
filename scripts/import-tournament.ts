// scripts/import-tournament.ts
//
// Imports teams and matches from CSV files into a tournament.
//
// Usage:
//   npx tsx scripts/import-tournament.ts \
//     --tournament wc2026 \
//     --teams data/wc2026-teams.csv \
//     --matches data/wc2026-matches.csv
//
//   --dry-run   Validate files without writing to database
//   --force     Overwrite existing teams/matches (default: skip existing)
//
// CSV formats:
//   teams.csv:   group,fifa_code,name_sv,name_en
//   matches.csv: match_number,stage,group,home_team,away_team,scheduled_at,venue
//
// scheduled_at: ISO 8601, e.g. 2026-06-11T20:00:00Z
// stage values: GROUP | ROUND_OF_32 | ROUND_OF_16 | QUARTER_FINAL |
//               SEMI_FINAL | THIRD_PLACE | FINAL
// Knockout matches may have empty home_team/away_team — set by admin later.

import { PrismaClient, Stage } from "@prisma/client";
import { readFileSync } from "fs";
import { addHours } from "date-fns";

const prisma = new PrismaClient({ log: [] });

// ─────────────────────────────────────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────────────────────────────────────

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const TOURNAMENT_SLUG = getArg("tournament") ?? "wc2026";
const TEAMS_FILE = getArg("teams");
const MATCHES_FILE = getArg("matches");
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const VALID_STAGES = new Set([
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
]);

// ─────────────────────────────────────────────────────────────────────────────
// CSV parser (no dependencies)
// ─────────────────────────────────────────────────────────────────────────────

function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2)
    throw new Error("CSV must have header + at least one data row");

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line, i) => {
    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i + 2}: expected ${headers.length} columns, got ${values.length}`,
      );
    }
    return Object.fromEntries(headers.map((h, j) => [h, values[j]]));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

type TeamRow = {
  group: string;
  fifa_code: string;
  name_sv: string;
  name_en: string;
};
type MatchRow = {
  match_number: string;
  stage: string;
  group: string;
  home_team: string;
  away_team: string;
  scheduled_at: string;
  venue: string;
};

function validateTeams(rows: Record<string, string>[]): TeamRow[] {
  const required = ["group", "fifa_code", "name_sv", "name_en"];
  const errors: string[] = [];

  for (const row of rows) {
    for (const col of required) {
      if (!row[col])
        errors.push(`Row missing '${col}': ${JSON.stringify(row)}`);
    }
    if (row.group && !/^[A-L]$/.test(row.group)) {
      errors.push(`Invalid group '${row.group}' — must be A–L`);
    }
    if (row.fifa_code && !/^[A-Z]{2,4}$/.test(row.fifa_code)) {
      errors.push(
        `Invalid FIFA code '${row.fifa_code}' — must be 2–4 uppercase letters`,
      );
    }
  }

  if (errors.length)
    throw new Error(`Team validation errors:\n  ${errors.join("\n  ")}`);
  return rows as TeamRow[];
}

function validateMatches(
  rows: Record<string, string>[],
  teamCodes: Set<string>,
): MatchRow[] {
  const required = ["match_number", "stage", "scheduled_at"];
  const errors: string[] = [];

  for (const row of rows) {
    for (const col of required) {
      if (!row[col])
        errors.push(`Match ${row.match_number || "?"}: missing '${col}'`);
    }
    if (row.stage && !VALID_STAGES.has(row.stage)) {
      errors.push(`Match ${row.match_number}: invalid stage '${row.stage}'`);
    }
    if (row.match_number && isNaN(Number(row.match_number))) {
      errors.push(`Invalid match_number '${row.match_number}'`);
    }
    if (row.scheduled_at && isNaN(Date.parse(row.scheduled_at))) {
      errors.push(
        `Match ${row.match_number}: invalid scheduled_at '${row.scheduled_at}'`,
      );
    }
    if (row.home_team && !teamCodes.has(row.home_team)) {
      errors.push(
        `Match ${row.match_number}: unknown home_team '${row.home_team}'`,
      );
    }
    if (row.away_team && !teamCodes.has(row.away_team)) {
      errors.push(
        `Match ${row.match_number}: unknown away_team '${row.away_team}'`,
      );
    }
    if (row.stage === "GROUP" && !row.group) {
      errors.push(
        `Match ${row.match_number}: GROUP match missing group column`,
      );
    }
  }

  if (errors.length)
    throw new Error(`Match validation errors:\n  ${errors.join("\n  ")}`);
  return rows as MatchRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Import logic
// ─────────────────────────────────────────────────────────────────────────────

async function importTeams(rows: TeamRow[], tournamentId: string) {
  console.log(`\n📋 Importing ${rows.length} teams...`);
  let created = 0,
    skipped = 0,
    updated = 0;

  // Ensure all groups exist
  const groupNames = Array.from(new Set(rows.map((r) => r.group)));
  const groupMap = new Map<string, string>(); // name → id

  for (const name of groupNames) {
    const group = await prisma.group.upsert({
      where: { tournamentId_name: { tournamentId, name } },
      update: {},
      create: { tournamentId, name },
    });
    groupMap.set(name, group.id);
  }

  for (const row of rows) {
    const groupId = groupMap.get(row.group)!;
    const existing = await prisma.team.findUnique({
      where: { fifaCode: row.fifa_code },
    });

    if (existing && !FORCE) {
      skipped++;
      continue;
    }

    if (existing && FORCE) {
      await prisma.team.update({
        where: { fifaCode: row.fifa_code },
        data: {
          nameSv: row.name_sv,
          nameEn: row.name_en,
          groupId,
          flagUrl: `/flags/${row.fifa_code.toLowerCase()}.svg`,
        },
      });
      updated++;
    } else {
      await prisma.team.create({
        data: {
          nameSv: row.name_sv,
          nameEn: row.name_en,
          fifaCode: row.fifa_code,
          flagUrl: `/flags/${row.fifa_code.toLowerCase()}.svg`,
          groupId,
        },
      });
      created++;
    }
  }

  console.log(
    `   ✓ ${created} created, ${updated} updated, ${skipped} skipped`,
  );
  return groupMap;
}

async function importMatches(
  rows: MatchRow[],
  tournamentId: string,
  groupMap: Map<string, string>,
) {
  console.log(`\n📋 Importing ${rows.length} matches...`);

  // Build team lookup: fifaCode → id
  const allTeams = await prisma.team.findMany({
    select: { id: true, fifaCode: true },
  });
  const teamMap = new Map(allTeams.map((t) => [t.fifaCode, t.id]));

  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id: tournamentId },
    select: { oddsLockDate: true, startDate: true },
  });

  let created = 0,
    skipped = 0,
    updated = 0;

  for (const row of rows) {
    const matchNumber = Number(row.match_number);
    const scheduledAt = new Date(row.scheduled_at);
    const isGroup = row.stage === "GROUP";

    // Tip deadline: group = oddsLockDate, knockout = 24h before match
    const tipDeadline = isGroup
      ? tournament.oddsLockDate
      : addHours(scheduledAt, -24);

    const data = {
      matchNumber,
      tournamentId,
      stage: row.stage as Stage,
      groupId: row.group ? (groupMap.get(row.group) ?? null) : null,
      homeTeamId: row.home_team ? (teamMap.get(row.home_team) ?? null) : null,
      awayTeamId: row.away_team ? (teamMap.get(row.away_team) ?? null) : null,
      scheduledAt,
      tipDeadline,
      venue: row.venue || null,
    };

    const existing = await prisma.match.findFirst({
      where: { matchNumber, tournamentId },
    });

    if (existing && !FORCE) {
      skipped++;
      continue;
    }

    if (existing && FORCE) {
      await prisma.match.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.match.create({ data });
      created++;
    }
  }

  console.log(
    `   ✓ ${created} created, ${updated} updated, ${skipped} skipped`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export current data to CSV
// ─────────────────────────────────────────────────────────────────────────────

export async function exportTournamentCsv(tournamentSlug: string): Promise<{
  teams: string;
  matches: string;
}> {
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug: tournamentSlug },
    include: {
      groups: {
        include: { teams: true },
        orderBy: { name: "asc" },
      },
      matches: {
        orderBy: { matchNumber: "asc" },
        include: { homeTeam: true, awayTeam: true, group: true },
      },
    },
  });

  // Teams CSV
  const teamRows = tournament.groups.flatMap((g) =>
    g.teams.map((t) => `${g.name},${t.fifaCode},${t.nameSv},${t.nameEn}`),
  );
  const teamsCsv = ["group,fifa_code,name_sv,name_en", ...teamRows].join("\n");

  // Matches CSV
  const matchRows = tournament.matches.map((m) =>
    [
      m.matchNumber,
      m.stage,
      m.group?.name ?? "",
      m.homeTeam?.fifaCode ?? "",
      m.awayTeam?.fifaCode ?? "",
      m.scheduledAt.toISOString(),
      (m as any).venue ?? "",
    ].join(","),
  );
  const matchesCsv = [
    "match_number,stage,group,home_team,away_team,scheduled_at,venue",
    ...matchRows,
  ].join("\n");

  return { teams: teamsCsv, matches: matchesCsv };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n📥 Tipsy — Tournament CSV importer");

  // Export mode
  if (process.argv.includes("--export")) {
    const { writeFileSync } = await import("fs");
    const { teams, matches } = await exportTournamentCsv(TOURNAMENT_SLUG);
    writeFileSync(`${TOURNAMENT_SLUG}-teams-export.csv`, teams);
    writeFileSync(`${TOURNAMENT_SLUG}-matches-export.csv`, matches);
    console.log(
      `✅ Exported to ${TOURNAMENT_SLUG}-teams-export.csv and ${TOURNAMENT_SLUG}-matches-export.csv`,
    );
    return;
  }

  if (!TEAMS_FILE || !MATCHES_FILE) {
    console.error(
      "Usage: npx tsx scripts/import-tournament.ts --tournament <slug> --teams <file> --matches <file>",
    );
    console.error(
      "       npx tsx scripts/import-tournament.ts --tournament <slug> --export",
    );
    process.exit(1);
  }

  // Fetch tournament
  const tournament = await prisma.tournament.findUnique({
    where: { slug: TOURNAMENT_SLUG },
  });
  if (!tournament) {
    console.error(
      `❌ Tournament '${TOURNAMENT_SLUG}' not found. Create it first via admin UI.`,
    );
    process.exit(1);
  }
  console.log(`✓ Tournament: ${tournament.nameEn} (${TOURNAMENT_SLUG})`);
  if (DRY_RUN) console.log("   DRY RUN — no database writes\n");
  if (FORCE) console.log("   FORCE — existing records will be overwritten\n");

  // Parse and validate
  const teamRows = validateTeams(parseCsv(readFileSync(TEAMS_FILE, "utf-8")));
  console.log(`✓ Teams file valid: ${teamRows.length} rows`);

  const teamCodes = new Set(teamRows.map((r) => r.fifa_code));
  const matchRows = validateMatches(
    parseCsv(readFileSync(MATCHES_FILE, "utf-8")),
    teamCodes,
  );
  console.log(`✓ Matches file valid: ${matchRows.length} rows`);

  if (DRY_RUN) {
    console.log("\n✅ Dry run complete — files are valid");
    return;
  }

  // Import
  const groupMap = await importTeams(teamRows, tournament.id);
  await importMatches(matchRows, tournament.id, groupMap);

  console.log("\n✅ Import complete!");
  console.log(`   Run 'npx prisma studio' to verify the data.`);
}

main()
  .catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
