// scripts/import-odds.ts
//
// Imports odds from three CSV files:
//   --matches   data/odds-matches.csv
//   --advancement data/odds-advancement.csv
//   --tournament  data/odds-tournament.csv
//
// Usage:
//   npx tsx scripts/import-odds.ts --matches data/odds-matches.csv
//   npx tsx scripts/import-odds.ts --advancement data/odds-advancement.csv
//   npx tsx scripts/import-odds.ts --tournament data/odds-tournament.csv
//   npx tsx scripts/import-odds.ts --all   (imports all three)
//   npx tsx scripts/import-odds.ts --all --dry-run
//   npx tsx scripts/import-odds.ts --all --force  (overwrites existing)
//
// CSV formats:
//   odds-matches.csv:     match_number,home_odds,draw_odds,away_odds,source
//   odds-advancement.csv: fifa_code,odds,source
//   odds-tournament.csv:  fifa_code,reach_final_odds,win_odds,source
//
// All odds are decimal (e.g. 2.10, not 210 or 110)

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const prisma = new PrismaClient({ log: [] });

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const ALL = process.argv.includes("--all");

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCsv(content: string): Record<string, string>[] {
  const lines = content
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2)
    throw new Error("CSV must have header + at least one row");

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line, i) => {
    const values = line.split(",").map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(
        `Row ${i + 2}: expected ${headers.length} columns, got ${values.length}\n  → ${line}`,
      );
    }
    return Object.fromEntries(headers.map((h, j) => [h, values[j]]));
  });
}

const MIN_ODDS = 1.01;
const MAX_ODDS = 99.0;

function parseOdds(val: string, field: string, row: number): number {
  const n = parseFloat(val);
  if (isNaN(n)) {
    throw new Error(`Row ${row}: '${field}' is not a number: '${val}'`);
  }
  if (n < MIN_ODDS) {
    console.info(`  info Row ${row}: ${field}=${n} clamped to MIN ${MIN_ODDS}`);
    return MIN_ODDS;
  }
  if (n > MAX_ODDS) {
    console.info(`  info Row ${row}: ${field}=${n} clamped to MAX ${MAX_ODDS}`);
    return MAX_ODDS;
  }

  return n;
}

// ─── Match odds ───────────────────────────────────────────────────────────────

async function importMatchOdds(file: string) {
  console.log(`\n📊 Importing match odds from ${file}...`);
  const rows = parseCsv(readFileSync(file, "utf-8"));

  // Validate
  for (const [i, row] of Array.from(rows.entries())) {
    for (const col of [
      "match_number",
      "home_odds",
      "draw_odds",
      "away_odds",
      "source",
    ]) {
      if (!row[col]) throw new Error(`Row ${i + 2}: missing '${col}'`);
    }
    parseOdds(row.home_odds, "home_odds", i + 2);
    parseOdds(row.draw_odds, "draw_odds", i + 2);
    parseOdds(row.away_odds, "away_odds", i + 2);
  }
  console.log(`  ✓ ${rows.length} rows validated`);

  if (DRY_RUN) return;

  let created = 0,
    updated = 0,
    skipped = 0;

  for (const [i, row] of Array.from(rows.entries())) {
    const matchNumber = Number(row.match_number);
    const match = await prisma.match.findFirst({
      where: { matchNumber, tournament: { slug: "wc2026" } },
    });
    if (!match) {
      console.warn(`  ⚠ Match #${matchNumber} not found — skipping`);
      skipped++;
      continue;
    }

    const entries: [string, number][] = [
      ["HOME", parseOdds(row.home_odds, "home_odds", i + 2)],
      ["DRAW", parseOdds(row.draw_odds, "draw_odds", i + 2)],
      ["AWAY", parseOdds(row.away_odds, "away_odds", i + 2)],
    ];

    for (const [outcome, avgValue] of entries) {
      const existing = await prisma.matchOdds.findUnique({
        where: {
          matchId_outcome: { matchId: match.id, outcome: outcome as any },
        },
      });

      if (existing && !FORCE) {
        skipped++;
        continue;
      }

      const sources = [{ name: row.source, value: avgValue }];

      if (existing) {
        await prisma.matchOdds.update({
          where: {
            matchId_outcome: { matchId: match.id, outcome: outcome as any },
          },
          data: {
            avgValue,
            sources,
            recordedAt: new Date(),
            recordedBy: "import-odds",
          },
        });
        updated++;
      } else {
        await prisma.matchOdds.create({
          data: {
            matchId: match.id,
            outcome: outcome as any,
            avgValue,
            sources,
            recordedBy: "import-odds",
          },
        });
        created++;
      }
    }
  }

  console.log(`  ✓ ${created} created, ${updated} updated, ${skipped} skipped`);
}

// ─── Advancement odds ─────────────────────────────────────────────────────────

async function importAdvancementOdds(file: string) {
  console.log(`\n🏅 Importing advancement odds from ${file}...`);
  const rows = parseCsv(readFileSync(file, "utf-8"));

  for (const [i, row] of Array.from(rows.entries())) {
    for (const col of ["fifa_code", "odds", "source"]) {
      if (!row[col]) throw new Error(`Row ${i + 2}: missing '${col}'`);
    }
    parseOdds(row.odds, "odds", i + 2);
  }
  console.log(`  ✓ ${rows.length} rows validated`);

  if (DRY_RUN) return;

  let created = 0,
    updated = 0,
    skipped = 0;

  for (const [i, row] of Array.from(rows.entries())) {
    const team = await prisma.team.findUnique({
      where: { fifaCode: row.fifa_code },
    });
    if (!team) {
      console.warn(`  ⚠ Team '${row.fifa_code}' not found — skipping`);
      skipped++;
      continue;
    }

    const avgValue = parseOdds(row.odds, "odds", i + 2);
    const sources = [{ name: row.source, value: avgValue }];

    const existing = await prisma.advancementOdds.findUnique({
      where: { teamId: team.id },
    });

    if (existing && !FORCE) {
      skipped++;
      continue;
    }

    if (existing) {
      await prisma.advancementOdds.update({
        where: { teamId: team.id },
        data: {
          avgValue,
          sources,
          recordedAt: new Date(),
          recordedBy: "import-odds",
        },
      });
      updated++;
    } else {
      await prisma.advancementOdds.create({
        data: { teamId: team.id, avgValue, sources, recordedBy: "import-odds" },
      });
      created++;
    }
  }

  console.log(`  ✓ ${created} created, ${updated} updated, ${skipped} skipped`);
}

// ─── Tournament odds ──────────────────────────────────────────────────────────

async function importTournamentOdds(file: string) {
  console.log(`\n🏆 Importing tournament odds from ${file}...`);
  const rows = parseCsv(readFileSync(file, "utf-8"));

  for (const [i, row] of Array.from(rows.entries())) {
    for (const col of ["fifa_code", "reach_final_odds", "win_odds", "source"]) {
      if (!row[col]) throw new Error(`Row ${i + 2}: missing '${col}'`);
    }
    parseOdds(row.reach_final_odds, "reach_final_odds", i + 2);
    parseOdds(row.win_odds, "win_odds", i + 2);
  }
  console.log(`  ✓ ${rows.length} rows validated`);

  if (DRY_RUN) return;

  let created = 0,
    updated = 0,
    skipped = 0;

  for (const [i, row] of Array.from(rows.entries())) {
    const team = await prisma.team.findUnique({
      where: { fifaCode: row.fifa_code },
    });
    if (!team) {
      console.warn(`  ⚠ Team '${row.fifa_code}' not found — skipping`);
      skipped++;
      continue;
    }

    const entries: [string, number][] = [
      [
        "REACH_FINAL",
        parseOdds(row.reach_final_odds, "reach_final_odds", i + 2),
      ],
      ["WIN", parseOdds(row.win_odds, "win_odds", i + 2)],
    ];

    for (const [type, avgValue] of entries) {
      const sources = [{ name: row.source, value: avgValue }];
      const existing = await prisma.tournamentOdds.findUnique({
        where: { teamId_type: { teamId: team.id, type: type as any } },
      });

      if (existing && !FORCE) {
        skipped++;
        continue;
      }

      if (existing) {
        await prisma.tournamentOdds.update({
          where: { teamId_type: { teamId: team.id, type: type as any } },
          data: {
            avgValue,
            sources,
            recordedAt: new Date(),
            recordedBy: "import-odds",
          },
        });
        updated++;
      } else {
        await prisma.tournamentOdds.create({
          data: {
            teamId: team.id,
            type: type as any,
            avgValue,
            sources,
            recordedBy: "import-odds",
          },
        });
        created++;
      }
    }
  }

  console.log(`  ✓ ${created} created, ${updated} updated, ${skipped} skipped`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n📥 Tipsy — Odds importer");
  if (DRY_RUN) console.log("   DRY RUN — no database writes");
  if (FORCE) console.log("   FORCE — existing odds will be overwritten");

  const matchesFile = ALL ? "data/odds-matches.csv" : getArg("matches");
  const advancementFile = ALL
    ? "data/odds-advancement.csv"
    : getArg("advancement");
  const tournamentFile = ALL
    ? "data/odds-tournament.csv"
    : getArg("tournament");

  if (!matchesFile && !advancementFile && !tournamentFile) {
    console.error(
      "\nUsage:\n" +
        "  npx tsx scripts/import-odds.ts --all [--dry-run] [--force]\n" +
        "  npx tsx scripts/import-odds.ts --matches data/odds-matches.csv\n" +
        "  npx tsx scripts/import-odds.ts --advancement data/odds-advancement.csv\n" +
        "  npx tsx scripts/import-odds.ts --tournament data/odds-tournament.csv\n",
    );
    process.exit(1);
  }

  try {
    if (matchesFile) await importMatchOdds(matchesFile);
    if (advancementFile) await importAdvancementOdds(advancementFile);
    if (tournamentFile) await importTournamentOdds(tournamentFile);
    console.log("\n✅ Done!\n");
  } catch (e: any) {
    console.error(`\n❌ ${e.message}\n`);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
