// lib/group-standings.ts
// Calculates group table standings from match results.
// Called server-side — returns serialized data safe for Client Components.

import { prisma } from "@/lib/db";
import type {
  GroupTableData,
  GroupTableTeam,
} from "@/components/competitions/GroupTable";

export async function getGroupStandings(
  tournamentId: string,
): Promise<GroupTableData[]> {
  const groups = await prisma.group.findMany({
    where: { tournamentId },
    orderBy: { name: "asc" },
    include: {
      teams: true,
      actualAdvancements: { select: { teamId: true } },
      matches: {
        where: { stage: "GROUP" },
        select: {
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
          status: true,
        },
      },
    },
  });

  return groups.map((group) => {
    const advancingIds = new Set(group.actualAdvancements.map((a) => a.teamId));

    // Initialise table rows for all teams
    const rows = new Map<string, GroupTableTeam>();
    for (const team of group.teams) {
      rows.set(team.id, {
        teamId: team.id,
        fifaCode: team.fifaCode,
        nameSv: team.nameSv,
        nameEn: team.nameEn,
        flagUrl: team.flagUrl,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        goalDiff: 0,
        isActuallyAdvancing: advancingIds.has(team.id),
      });
    }

    // Process finished matches
    for (const match of group.matches) {
      if (
        match.status !== "FINISHED" ||
        match.homeScore === null ||
        match.awayScore === null ||
        !match.homeTeamId ||
        !match.awayTeamId
      )
        continue;

      const home = rows.get(match.homeTeamId);
      const away = rows.get(match.awayTeamId);
      if (!home || !away) continue;

      const hs = match.homeScore;
      const as_ = match.awayScore;

      home.played++;
      away.played++;
      home.goalsFor += hs;
      home.goalsAgainst += as_;
      away.goalsFor += as_;
      away.goalsAgainst += hs;

      if (hs > as_) {
        home.won++;
        home.points += 3;
        away.lost++;
      } else if (hs === as_) {
        home.drawn++;
        home.points += 1;
        away.drawn++;
        away.points += 1;
      } else {
        away.won++;
        away.points += 3;
        home.lost++;
      }
    }

    // Compute goal difference
    for (const row of rows.values()) {
      row.goalDiff = row.goalsFor - row.goalsAgainst;
    }

    // Sort: points → goal diff → goals scored → FIFA code (alphabetical tiebreak)
    const sorted = [...rows.values()].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.fifaCode.localeCompare(b.fifaCode);
    });

    return { groupName: group.name, teams: sorted };
  });
}
