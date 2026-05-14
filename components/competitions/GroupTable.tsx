// components/competitions/GroupTable.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GroupTableTeam = {
  teamId: string;
  fifaCode: string;
  nameSv: string;
  nameEn: string;
  flagUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  goalDiff: number;
  isActuallyAdvancing: boolean; // set by admin
};

export type GroupTableData = {
  groupName: string;
  teams: GroupTableTeam[];
};

interface GroupTableProps {
  groups: GroupTableData[];
  locale: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Single group table
// ─────────────────────────────────────────────────────────────────────────────

function SingleGroupTable({
  group,
  locale,
}: {
  group: GroupTableData;
  locale: string;
}) {
  const isSv = locale === "sv";

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full
                         bg-pitch-500 text-white text-xs font-bold shrink-0"
        >
          {group.groupName}
        </span>
        <span className="font-semibold text-slate-700 text-sm">
          {isSv ? `Grupp ${group.groupName}` : `Group ${group.groupName}`}
        </span>
      </div>

      {/* Table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400">
            <th className="px-3 py-1.5 text-left w-6">#</th>
            <th className="px-2 py-1.5 text-left">{isSv ? "Lag" : "Team"}</th>
            <th
              className="px-2 py-1.5 text-center w-7"
              title={isSv ? "Spelade" : "Played"}
            >
              S
            </th>
            <th
              className="px-2 py-1.5 text-center w-7"
              title={isSv ? "Vinster" : "Won"}
            >
              V
            </th>
            <th
              className="px-2 py-1.5 text-center w-7"
              title={isSv ? "Oavgjorda" : "Drawn"}
            >
              O
            </th>
            <th
              className="px-2 py-1.5 text-center w-7"
              title={isSv ? "Förluster" : "Lost"}
            >
              F
            </th>
            <th
              className="px-2 py-1.5 text-center w-12"
              title={isSv ? "Gjorda-Insläppta" : "Goals For-Against"}
            >
              GM-IM
            </th>
            <th
              className="px-2 py-1.5 text-center w-8"
              title={isSv ? "Målskillnad" : "Goal Difference"}
            >
              MS
            </th>
            <th
              className="px-3 py-1.5 text-center w-8 font-semibold text-slate-500"
              title={isSv ? "Poäng" : "Points"}
            >
              P
            </th>
          </tr>
        </thead>
        <tbody>
          {group.teams.map((team, idx) => {
            const advances = idx < 2; // top 2 advance (simplified — actual set by admin)
            const actuallyAdvances = team.isActuallyAdvancing;

            return (
              <tr
                key={team.teamId}
                className={cn(
                  "border-b border-slate-50 last:border-0",
                  actuallyAdvances
                    ? "bg-green-50/40"
                    : advances && team.played > 0
                      ? "bg-pitch-50/30"
                      : "",
                )}
              >
                {/* Position */}
                <td className="px-3 py-2 text-slate-400 font-medium">
                  {idx + 1}
                </td>

                {/* Team name + flag */}
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    {team.flagUrl && (
                      <img
                        src={team.flagUrl}
                        alt={team.fifaCode}
                        className="w-5 h-3.5 object-cover rounded-sm shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span
                      className={cn(
                        "font-medium truncate max-w-[100px]",
                        actuallyAdvances ? "text-green-700" : "text-slate-700",
                      )}
                    >
                      {locale === "sv" ? team.nameSv : team.nameEn}
                    </span>
                    {actuallyAdvances && (
                      <span
                        className="text-green-500 text-[10px]"
                        title={isSv ? "Avancerar" : "Advances"}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </td>

                {/* Stats */}
                <td className="px-2 py-2 text-center text-slate-500">
                  {team.played}
                </td>
                <td className="px-2 py-2 text-center text-slate-500">
                  {team.won}
                </td>
                <td className="px-2 py-2 text-center text-slate-500">
                  {team.drawn}
                </td>
                <td className="px-2 py-2 text-center text-slate-500">
                  {team.lost}
                </td>
                <td className="px-2 py-2 text-center text-slate-500 font-mono text-[11px]">
                  {team.goalsFor}–{team.goalsAgainst}
                </td>
                <td
                  className={cn(
                    "px-2 py-2 text-center font-medium",
                    team.goalDiff > 0
                      ? "text-green-600"
                      : team.goalDiff < 0
                        ? "text-red-500"
                        : "text-slate-400",
                  )}
                >
                  {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                </td>
                <td className="px-3 py-2 text-center font-bold text-slate-800">
                  {team.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid of all groups
// ─────────────────────────────────────────────────────────────────────────────

export function GroupTablesGrid({ groups, locale }: GroupTableProps) {
  const isSv = locale === "sv";
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="space-y-3">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-slate-700">
          {isSv ? "Gruppställningar" : "Group Standings"}
        </h2>
        <span className="text-slate-400 text-sm">
          {collapsed ? "▼ Visa" : "▲ Dölj"}
        </span>
      </button>

      {!collapsed && (
        <>
          {/* Column legend */}
          <p className="text-xs text-slate-400">
            S = {isSv ? "Spelade" : "Played"} · V = {isSv ? "Vinster" : "Won"} ·
            O = {isSv ? "Oavgjorda" : "Drawn"} · F ={" "}
            {isSv ? "Förluster" : "Lost"} · GM-IM ={" "}
            {isSv ? "Gjorda-Insläppta" : "Goals For-Against"} · MS ={" "}
            {isSv ? "Målskillnad" : "Goal Diff"} · P ={" "}
            {isSv ? "Poäng" : "Points"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {groups.map((g) => (
              <SingleGroupTable key={g.groupName} group={g} locale={locale} />
            ))}
          </div>

          {/* Advancing indicator */}
          <div className="flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-green-50 border border-green-200" />
              {isSv
                ? "Avancerar (bekräftat av admin)"
                : "Advancing (confirmed by admin)"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-pitch-50 border border-pitch-200" />
              {isSv ? "Leder gruppen" : "Leading group"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
