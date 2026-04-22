#!/usr/bin/env tsx
/**
 * scripts/download-flags.ts
 *
 * Downloads SVG flags for all 48 WC 2026 teams from flagcdn.com (free, no API key).
 * Saves to public/flags/<FIFA_CODE>.svg  (e.g. public/flags/SWE.svg)
 *
 * Usage:
 *   npx tsx scripts/download-flags.ts
 *   npx tsx scripts/download-flags.ts --dry-run   # show URLs without downloading
 *   npx tsx scripts/download-flags.ts --force      # re-download even if file exists
 *
 * Requirements: Node 18+ (uses native fetch). No extra dependencies.
 */

import { mkdir, writeFile, access } from "fs/promises";
import { join } from "path";

// ─────────────────────────────────────────────────────────────────────────────
// FIFA code → flagcdn.com ISO alpha-2 (or subdivision) code
// flagcdn.com reference: https://flagcdn.com  (uses ISO 3166-1 alpha-2)
// ─────────────────────────────────────────────────────────────────────────────
const FIFA_TO_ISO: Record<string, string> = {
  ALG: "dz", // Algeria         — ISO: DZ
  ARG: "ar", // Argentina
  AUS: "au", // Australia
  AUT: "at", // Austria
  BEL: "be", // Belgium
  BIH: "ba", // Bosnia & Herzegovina
  BLR: "by", // Belarus
  BOL: "bo", // Bolivia
  BRA: "br", // Brazil
  CAN: "ca", // Canada
  CHI: "cl", // Chile           — FIFA uses CHI, ISO uses CL
  CIV: "ci", // Côte d'Ivoire   — ISO: CI
  CMR: "cm", // Cameroon        — ISO: CM
  COD: "cd", // DR Congo        — ISO: CD (Congo, Democratic Republic)
  COL: "co", // Colombia
  CPV: "cv", // Cape Verde      — ISO: CV
  CRC: "cr", // Costa Rica      — FIFA uses CRC, ISO uses CR
  CRO: "hr", // Croatia         — FIFA uses CRO, ISO uses HR
  CUR: "cw", // Curaçao         — FIFA uses CUR, ISO uses CW
  CZE: "cz", // Czech Republic
  ECU: "ec", // Ecuador         — FIFA uses ECU, ISO uses EC
  EGY: "eg", // Egypt           — FIFA uses EGY, ISO uses EG
  ENG: "gb-eng", // England     — not sovereign; flagcdn subdivision code
  ESP: "es", // Spain
  FRA: "fr", // France
  GER: "de", // Germany         — FIFA uses GER, ISO uses DE
  GHA: "gh", // Ghana
  HAI: "ht", // Haiti           — FIFA uses HAI, ISO uses HT
  HON: "hn", // Honduras        — FIFA uses HON, ISO uses HN
  IRI: "ir", // Iran            — FIFA uses IRI, ISO uses IR
  IRQ: "iq", // Iraq            — FIFA uses IRA, ISO uses IQ
  JOR: "jo", // Jordan          — FIFA uses JOR, ISO uses JO
  JPN: "jp", // Japan           — FIFA uses JPN, ISO uses JP
  KOR: "kr", // South Korea     — FIFA uses KOR, ISO uses KR
  KSA: "sa", // Saudi Arabia    — FIFA uses KSA, ISO uses SA
  MAR: "ma", // Morocco         — FIFA uses MAR, ISO uses MA
  MEX: "mx", // Mexico          — FIFA uses MEX, ISO uses MX
  NED: "nl", // Netherlands     — FIFA uses NED, ISO uses NL
  NOR: "no", // Norway          — FIFA uses NOR, ISO uses NO
  NZL: "nz", // New Zealand     — FIFA uses NZL, ISO uses NZ
  NGA: "ng", // Nigeria         — FIFA uses NGA, ISO uses NG
  PAN: "pa", // Panama          — FIFA uses PAN, ISO uses PA
  PAR: "py", // Paraguay        — FIFA uses PAR, ISO uses PY
  PER: "pe", // Peru
  POR: "pt", // Portugal        — FIFA uses POR, ISO uses PT
  QAT: "qa", // Qatar           — FIFA uses QAT, ISO uses QA
  ROU: "ro", // Romania         — FIFA uses ROU, ISO uses RO
  RSA: "za", // South Africa    — FIFA uses RSA, ISO uses ZA
  SCO: "gb-sct", // Scotland     — not sovereign; flagcdn subdivision code
  SEN: "sn", // Senegal         — FIFA uses SEN, ISO uses SN
  SRB: "rs", // Serbia          — FIFA uses SRB, ISO uses RS
  SUI: "ch", // Switzerland     — FIFA uses SUI, ISO uses CH
  SWE: "se", // Sweden          — FIFA uses SWE, ISO uses SE
  TUN: "tn", // Tunisia         — FIFA uses TUN, ISO uses TN
  TUR: "tr", // Turkey          — FIFA uses TUR, ISO uses TR
  UKR: "ua", // Ukraine         — FIFA uses UKR, ISO uses UA
  URU: "uy", // Uruguay         — FIFA uses URU, ISO uses UY
  UZB: "uz", // Uzbekistan      — FIFA uses UZB, ISO uses UZ
  USA: "us", // United States
  VEN: "ve", // Venezuela
};

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const OUTPUT_DIR = join(process.cwd(), "public", "flags");
const BASE_URL = "https://flagcdn.com";
// w80 = 80px wide PNG (crisp on retina). Use /sv.svg for pure vector.
// SVG preferred: smaller, scales perfectly, no pixelation at any size.
const FORMAT: "svg" | "png" = "svg";
const PNG_WIDTH = 80; // only used if FORMAT = "png"

const isDryRun = process.argv.includes("--dry-run");
const isForce = process.argv.includes("--force");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildUrl(isoCode: string): string {
  if (FORMAT === "svg") {
    return `${BASE_URL}/${isoCode}.svg`;
  }
  return `${BASE_URL}/w${PNG_WIDTH}/${isoCode}.png`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadFlag(
  fifaCode: string,
  isoCode: string,
): Promise<{ status: "downloaded" | "skipped" | "error"; detail?: string }> {
  const url = buildUrl(isoCode);
  const ext = FORMAT === "svg" ? "svg" : "png";
  const outPath = join(OUTPUT_DIR, `${fifaCode}.${ext}`);

  if (!isForce && (await fileExists(outPath))) {
    return { status: "skipped" };
  }

  const response = await fetch(url);
  if (!response.ok) {
    return {
      status: "error",
      detail: `HTTP ${response.status} for ${url}`,
    };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, buffer);
  return { status: "downloaded" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏳️  Tipsy — Flag downloader`);
  console.log(
    `   Format : ${FORMAT.toUpperCase()}${FORMAT === "png" ? ` (${PNG_WIDTH}px)` : ""}`,
  );
  console.log(`   Output : ${OUTPUT_DIR}`);
  console.log(`   Teams  : ${Object.keys(FIFA_TO_ISO).length}`);
  if (isDryRun) console.log(`   Mode   : DRY RUN — no files written\n`);
  else if (isForce) console.log(`   Mode   : FORCE — re-downloading all\n`);
  else console.log(`   Mode   : Skip existing (use --force to re-download)\n`);

  if (!isDryRun) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const results = { downloaded: 0, skipped: 0, errors: 0 };

  for (const [fifaCode, isoCode] of Object.entries(FIFA_TO_ISO)) {
    const url = buildUrl(isoCode);

    if (isDryRun) {
      console.log(`  ${fifaCode.padEnd(4)} → ${url}`);
      continue;
    }

    const result = await downloadFlag(fifaCode, isoCode);

    if (result.status === "downloaded") {
      console.log(`  ✓ ${fifaCode.padEnd(4)} (${isoCode})`);
      results.downloaded++;
    } else if (result.status === "skipped") {
      console.log(`  – ${fifaCode.padEnd(4)} already exists`);
      results.skipped++;
    } else {
      console.error(`  ✗ ${fifaCode.padEnd(4)} ERROR: ${result.detail}`);
      results.errors++;
    }

    // Small delay to be polite to the CDN
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!isDryRun) {
    console.log(`\n✅ Done`);
    console.log(`   Downloaded : ${results.downloaded}`);
    console.log(`   Skipped    : ${results.skipped}`);
    if (results.errors > 0) {
      console.log(`   Errors     : ${results.errors}  ← check mappings above`);
      process.exit(1);
    }
    console.log(
      `\n   Flags saved to public/flags/ — reference in code as /flags/SWE.svg\n`,
    );
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
