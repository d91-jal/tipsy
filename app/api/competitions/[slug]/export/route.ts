// app/api/competitions/[slug]/export/route.ts
// Generates an Excel workbook with two sheets:
//   1. Topplista — leaderboard with points breakdown
//   2. Allas tips — match tips matrix (one column per participant)
//
// GET /api/competitions/[slug]/export
// GET /api/competitions/[slug]/export?sheet=leaderboard
// GET /api/competitions/[slug]/export?sheet=tips

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLeaderboard } from "@/lib/scoring";
import ExcelJS from "exceljs";

// ─── Colour palette (matches design system) ──────────────────────────────────
const C = {
  greenDeep: "1E3932",
  greenPale: "D4E9E2",
  gold: "CBA258",
  goldPale: "FAF6EE",
  cream: "F2F0EB",
  stampRed: "9C2A1F",
  stampPale: "FAE8E6",
  white: "FFFFFF",
  hairline: "E8E4DC",
  inkFaint: "B0ACA4",
};

function headerFill(color: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + color } };
}
function solidFill(color: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + color } };
}

const monoFont = { name: "Courier New", size: 10 };
const serifFont = { name: "Georgia", size: 11 };
const sansFont = { name: "Calibri", size: 11 };
const headerFont = {
  name: "Georgia",
  bold: true,
  color: { argb: "FF" + C.cream },
  size: 11,
};
const thinBorder: ExcelJS.Border = {
  style: "thin",
  color: { argb: "FF" + C.hairline },
};
const allBorders = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder,
};

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const competition = await prisma.competition.findUnique({
    where: { slug: params.slug },
    include: {
      tournament: {
        select: { id: true, nameSv: true, nameEn: true, oddsLockDate: true },
      },
    },
  });
  if (!competition) return new NextResponse("Not found", { status: 404 });

  // Verify membership
  const membership = await prisma.competitionMember.findUnique({
    where: {
      competitionId_userId: {
        competitionId: competition.id,
        userId: session.user.id,
      },
    },
  });
  if (!membership) return new NextResponse("Forbidden", { status: 403 });

  const locale = session.user.locale ?? "sv";
  const isSv = locale === "sv";

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const leaderboard = await getLeaderboard(competition.id);

  const members = await prisma.competitionMember.findMany({
    where: { competitionId: competition.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const groups = await prisma.group.findMany({
    where: { tournamentId: competition.tournament.id },
    orderBy: { name: "asc" },
    include: {
      matches: {
        where: { stage: "GROUP" },
        orderBy: { matchNumber: "asc" },
        include: {
          homeTeam: true,
          awayTeam: true,
          matchTips: {
            where: { userId: { in: members.map((m) => m.userId) } },
          },
        },
      },
    },
  });

  const isLocked =
    new Date() > new Date(competition.tournament.oddsLockDate ?? new Date());
  const visibleMemberIds = new Set(
    members
      .filter((m) => m.userId === session.user.id || isLocked || m.tipsPublic)
      .map((m) => m.userId),
  );

  // ── Build workbook ──────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "Tipsy";
  wb.created = new Date();

  buildLeaderboardSheet(wb, leaderboard, competition.name, isSv);
  buildTipsSheet(wb, groups, members, visibleMemberIds, competition.name, isSv);

  // ── Stream response ─────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const filename = `tipsy-${params.slug}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet 1: Leaderboard
// ─────────────────────────────────────────────────────────────────────────────

function buildLeaderboardSheet(
  wb: ExcelJS.Workbook,
  leaderboard: Awaited<ReturnType<typeof getLeaderboard>>,
  competitionName: string,
  isSv: boolean,
) {
  const ws = wb.addWorksheet(isSv ? "Topplista" : "Leaderboard", {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  // ── Title row ────────────────────────────────────────────────────────────
  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `${competitionName} — ${isSv ? "Topplista" : "Leaderboard"}`;
  titleCell.font = {
    name: "Georgia",
    bold: true,
    size: 16,
    color: { argb: "FF" + C.greenDeep },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 36;

  // ── Subtitle row ─────────────────────────────────────────────────────────
  ws.mergeCells("A2:F2");
  const subtitleCell = ws.getCell("A2");
  subtitleCell.value = `Tipsy · VM 2026 · ${new Date().toLocaleDateString(isSv ? "sv-SE" : "en-GB")}`;
  subtitleCell.font = {
    ...monoFont,
    color: { argb: "FF" + C.inkFaint },
    size: 9,
  };
  ws.getRow(2).height = 18;

  // ── Column headers ───────────────────────────────────────────────────────
  const headers = isSv
    ? ["#", "Spelare", "Matcher", "Avancemang", "Final", "Totalt"]
    : ["#", "Player", "Matches", "Advancement", "Final", "Total"];

  const headerRow = ws.getRow(3);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = headerFill(C.greenDeep);
    cell.alignment = {
      horizontal: i <= 1 ? "left" : "right",
      vertical: "middle",
    };
    cell.border = allBorders;
  });
  headerRow.height = 22;

  // ── Column widths ────────────────────────────────────────────────────────
  ws.columns = [
    { width: 5 }, // #
    { width: 24 }, // name
    { width: 10 }, // match
    { width: 14 }, // advancement
    { width: 8 }, // final
    { width: 10 }, // total
  ];

  // ── Data rows ────────────────────────────────────────────────────────────
  leaderboard.forEach((entry, idx) => {
    const row = ws.addRow([
      entry.rank,
      entry.name ?? entry.email.split("@")[0],
      entry.matchPoints > 0 ? +entry.matchPoints.toFixed(2) : 0,
      entry.advancementPoints > 0 ? +entry.advancementPoints.toFixed(2) : 0,
      entry.tournamentPoints > 0 ? +entry.tournamentPoints.toFixed(2) : 0,
      entry.totalPoints > 0 ? +entry.totalPoints.toFixed(2) : 0,
    ]);

    const isFirst = entry.rank === 1;
    const rowFill = isFirst
      ? solidFill(C.goldPale)
      : idx % 2 === 0
        ? solidFill(C.white)
        : solidFill(C.cream);

    row.eachCell((cell, colNum) => {
      cell.fill = rowFill;
      cell.border = allBorders;
      cell.font =
        colNum <= 2
          ? { ...serifFont, bold: isFirst }
          : { ...monoFont, bold: colNum === 7 };
      cell.alignment = {
        horizontal: colNum <= 2 ? "left" : "right",
        vertical: "middle",
      };
    });

    // Gold total for 1st place
    if (isFirst) {
      const totalCell = row.getCell(7);
      totalCell.font = {
        ...monoFont,
        bold: true,
        color: { argb: "FF" + C.gold },
      };
    }

    // Bold total column for all
    const totalCell = row.getCell(7);
    totalCell.font = { ...monoFont, bold: true };

    row.height = 20;
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  ws.addRow([]);
  const footerRow = ws.addRow([
    "",
    `${leaderboard.length} ${isSv ? "deltagare" : "participants"}`,
  ]);
  footerRow.getCell(2).font = {
    ...monoFont,
    color: { argb: "FF" + C.inkFaint },
    size: 9,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet 2: All tips matrix
// ─────────────────────────────────────────────────────────────────────────────

function buildTipsSheet(
  wb: ExcelJS.Workbook,
  groups: any[],
  members: any[],
  visibleMemberIds: Set<string>,
  competitionName: string,
  isSv: boolean,
) {
  const ws = wb.addWorksheet(isSv ? "Allas tips" : "All tips", {
    views: [{ state: "frozen", xSplit: 4, ySplit: 3 }],
  });

  const visibleMembers = members.filter((m) => visibleMemberIds.has(m.userId));
  const memberNames = visibleMembers.map(
    (m) => m.user.name?.split(" ")[0] ?? m.user.email.split("@")[0],
  );

  // ── Title ─────────────────────────────────────────────────────────────────
  const totalCols = 4 + visibleMembers.length;
  ws.mergeCells(1, 1, 1, Math.max(totalCols, 5));
  const titleCell = ws.getCell("A1");
  titleCell.value = `${competitionName} — ${isSv ? "Allas tips" : "All tips"}`;
  titleCell.font = {
    name: "Georgia",
    bold: true,
    size: 16,
    color: { argb: "FF" + C.greenDeep },
  };
  ws.getRow(1).height = 36;

  ws.mergeCells(2, 1, 2, Math.max(totalCols, 5));
  ws.getCell("A2").value =
    `Tipsy · VM 2026 · ${new Date().toLocaleDateString(isSv ? "sv-SE" : "en-GB")}`;
  ws.getCell("A2").font = {
    ...monoFont,
    color: { argb: "FF" + C.inkFaint },
    size: 9,
  };
  ws.getRow(2).height = 18;

  // ── Column headers ─────────────────────────────────────────────────────────
  const hRow = ws.getRow(3);
  const fixedHeaders = isSv
    ? ["#", "Grupp", "Match", "Facit"]
    : ["#", "Group", "Match", "Result"];

  [...fixedHeaders, ...memberNames].forEach((h, i) => {
    const cell = hRow.getCell(i + 1);
    cell.value = h;
    cell.font = headerFont;
    cell.fill = headerFill(i >= 4 ? C.greenDeep : C.greenDeep);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = allBorders;
  });
  hRow.height = 22;

  // ── Column widths ──────────────────────────────────────────────────────────
  ws.getColumn(1).width = 5; // #
  ws.getColumn(2).width = 8; // group
  ws.getColumn(3).width = 28; // match
  ws.getColumn(4).width = 8; // result
  for (let i = 5; i <= 4 + visibleMembers.length; i++) {
    ws.getColumn(i).width = 7;
  }

  // ── Data rows ──────────────────────────────────────────────────────────────
  let rowIdx = 4;

  groups.forEach((group) => {
    // Group section header
    const groupHeaderRow = ws.getRow(rowIdx++);
    ws.mergeCells(rowIdx - 1, 1, rowIdx - 1, Math.max(totalCols, 5));
    const ghCell = groupHeaderRow.getCell(1);
    ghCell.value = isSv ? `Grupp ${group.name}` : `Group ${group.name}`;
    ghCell.font = {
      name: "Georgia",
      bold: true,
      size: 11,
      color: { argb: "FF" + C.cream },
    };
    ghCell.fill = solidFill(C.greenDeep);
    ghCell.alignment = { horizontal: "left", indent: 1, vertical: "middle" };
    groupHeaderRow.height = 18;

    group.matches.forEach((match: any, mIdx: number) => {
      const homeName = isSv ? match.homeTeam?.nameSv : match.homeTeam?.nameEn;
      const awayName = isSv ? match.awayTeam?.nameSv : match.awayTeam?.nameEn;
      const matchName =
        homeName && awayName ? `${homeName} – ${awayName}` : "TBD";

      const isFinished = match.status === "FINISHED";
      const actualOutcome =
        match.homeScore !== null && match.awayScore !== null
          ? match.homeScore > match.awayScore
            ? "HOME"
            : match.awayScore > match.homeScore
              ? "AWAY"
              : "DRAW"
          : null;
      const resultStr = isFinished
        ? `${match.homeScore}–${match.awayScore}`
        : "";

      const dataRow = ws.getRow(rowIdx++);
      const rowFill = mIdx % 2 === 0 ? solidFill(C.white) : solidFill(C.cream);

      // Fixed columns: #, group, match, result
      [match.matchNumber, group.name, matchName, resultStr].forEach(
        (val, ci) => {
          const cell = dataRow.getCell(ci + 1);
          cell.value = val;
          cell.fill = rowFill;
          cell.border = allBorders;
          cell.font = ci === 2 ? serifFont : monoFont;
          cell.alignment = {
            horizontal: ci === 2 ? "left" : "center",
            vertical: "middle",
          };
        },
      );

      // Tip columns — one per visible member
      const tipsByUser: Record<string, string> = {};
      match.matchTips.forEach((t: any) => {
        tipsByUser[t.userId] =
          t.prediction === "HOME" ? "1" : t.prediction === "DRAW" ? "x" : "2";
      });

      const actualMark =
        actualOutcome === "HOME"
          ? "1"
          : actualOutcome === "DRAW"
            ? "X"
            : actualOutcome === "AWAY"
              ? "2"
              : "";

      visibleMembers.forEach((member, mi) => {
        const cell = dataRow.getCell(5 + mi);
        const pick = tipsByUser[member.userId] ?? "";
        cell.value = pick || "";
        cell.font = { name: "Georgia", bold: true, italic: true, size: 12 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = allBorders;

        if (!pick) {
          cell.fill = rowFill;
        } else if (isFinished && pick === actualMark) {
          // Correct — gold
          cell.fill = solidFill(C.gold);
          cell.font = { ...cell.font, color: { argb: "FF" + C.greenDeep } };
        } else if (isFinished && pick !== actualMark) {
          // Wrong — light red
          cell.fill = solidFill("F5D5D2");
          cell.font = { ...cell.font, color: { argb: "FF" + C.stampRed } };
        } else {
          // Pending
          cell.fill = solidFill(C.greenPale);
          cell.font = { ...cell.font, color: { argb: "FF" + C.greenDeep } };
        }
      });

      dataRow.height = 18;
    });
  });

  // ── Legend ─────────────────────────────────────────────────────────────────
  rowIdx++;
  const legendRow = ws.getRow(rowIdx);
  legendRow.getCell(1).value = isSv ? "Förklaring:" : "Legend:";
  legendRow.getCell(1).font = { ...monoFont, bold: true };

  [
    { col: 2, fill: C.gold, text: isSv ? "Rätt" : "Correct" },
    { col: 4, fill: "F5D5D2", text: isSv ? "Fel" : "Wrong" },
    { col: 6, fill: C.greenPale, text: isSv ? "Ej avgjort" : "Pending" },
  ].forEach(({ col, fill, text }) => {
    const cell = legendRow.getCell(col);
    cell.value = text;
    cell.fill = solidFill(fill);
    cell.font = monoFont;
    cell.alignment = { horizontal: "center" };
    cell.border = allBorders;
  });
}
