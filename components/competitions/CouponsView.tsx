// components/competitions/CouponsView.tsx
// "use client" — full interactive coupon matrix view.
//
// Layout inspired by classic Excel tipping sheets:
//   - Tabs: Group Stage | Advancement | Tournament
//   - Rows = matches / teams, Columns = participants
//   - Color coding: green = correct, red = wrong, yellow = pending

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Member = {
  userId: string;
  tipsPublic: boolean;
  isSimBot: boolean;
  user: { id: string; name: string | null; email: string };
};

type Team = {
  id: string;
  nameSv: string;
  nameEn: string;
  fifaCode: string;
  flagUrl: string | null;
};

type MatchTip = {
  userId: string;
  prediction: "HOME" | "DRAW" | "AWAY";
  pointsEarned: number | null;
};

type Match = {
  id: string;
  matchNumber: number;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  matchTips: MatchTip[];
};

type AdvancementTip = {
  userId: string;
  groupId: string;
  firstTeam: Team;
  secondTeam: Team;
  pointsEarned: number | null;
};

type ActualAdvancement = { teamId: string; position: number; team: Team };

type Group = {
  id: string;
  name: string;
  teams: Team[];
  matches: Match[];
  advancementTips: AdvancementTip[];
  actualAdvancements: ActualAdvancement[];
};

type TournamentTip = {
  userId: string;
  finalist1: Team;
  finalist2: Team;
  winner: Team;
  pointsEarned: number | null;
};

type TournamentActual = {
  finalist1: Team;
  finalist2: Team;
  winner: Team;
} | null;

type Props = {
  competition: { id: string; name: string; slug: string };
  members: Member[];
  groups: Group[];
  tournamentTips: TournamentTip[];
  tournamentActual: TournamentActual;
  currentUserId: string;
  isLocked: boolean;
  locale: string;
};

type Tab = "groups" | "advancement" | "tournament";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function outcomeLabel(o: "HOME" | "DRAW" | "AWAY"): string {
  return o === "HOME" ? "1" : o === "DRAW" ? "X" : "2";
}

function actualOutcome(match: Match): "HOME" | "DRAW" | "AWAY" | null {
  if (match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return "HOME";
  if (match.awayScore > match.homeScore) return "AWAY";
  return "DRAW";
}

function teamName(team: Team | null, locale: string): string {
  if (!team) return "?";
  return locale === "sv" ? team.nameSv : team.nameEn;
}

function userName(member: Member): string {
  return member.user.name ?? member.user.email.split("@")[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function CouponsView({
  competition,
  members,
  groups,
  tournamentTips,
  tournamentActual,
  currentUserId,
  isLocked,
  locale,
}: Props) {
  const [tab, setTab] = useState<Tab>("groups");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const isSv = locale === "sv";

  // Real members (non-bots), sorted: current user first
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "groups", label: isSv ? "⚽ Gruppspel" : "⚽ Group Stage" },
    { key: "advancement", label: isSv ? "🏅 Avancemang" : "🏅 Advancement" },
    { key: "tournament", label: isSv ? "🏆 Final" : "🏆 Final" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isSv ? "Tipskuponger" : "Tip Coupons"}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{competition.name}</p>
      </div>

      {!isLocked && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          🔒{" "}
          {isSv
            ? "Tips visas bara för spelare som valt att dela dem innan låsdatum."
            : "Tips only shown for players who chose to share them before the deadline."}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key
                ? "bg-white text-pitch-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GROUP STAGE TAB ─────────────────────────────────────────── */}
      {tab === "groups" && (
        <div className="space-y-3">
          {groups.map((group) => {
            const isExpanded =
              expandedGroup === group.id || expandedGroup === null;
            return (
              <div
                key={group.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Group header */}
                <button
                  onClick={() =>
                    setExpandedGroup(
                      expandedGroup === group.id ? null : group.id,
                    )
                  }
                  className="w-full flex items-center justify-between px-4 py-3
                             bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full
                                     bg-pitch-500 text-white text-xs font-bold"
                    >
                      {group.name}
                    </span>
                    {isSv ? `Grupp ${group.name}` : `Group ${group.name}`}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {/* Match column */}
                          <th
                            className="px-3 py-2 text-left font-medium text-slate-500 bg-slate-50
                                         sticky left-0 z-10 min-w-[180px] border-r border-slate-100"
                          >
                            {isSv ? "Match" : "Match"}
                          </th>
                          <th
                            className="px-2 py-2 text-center font-medium text-slate-500 bg-slate-50
                                         min-w-[60px] border-r border-slate-100"
                          >
                            {isSv ? "Facit" : "Result"}
                          </th>
                          {/* One column per participant */}
                          {sortedMembers.map((m) => (
                            <th
                              key={m.userId}
                              className={cn(
                                "px-2 py-2 text-center font-medium min-w-[80px]",
                                m.userId === currentUserId
                                  ? "bg-pitch-50 text-pitch-700"
                                  : "text-slate-500",
                              )}
                            >
                              <div
                                className="truncate max-w-[80px]"
                                title={userName(m)}
                              >
                                {userName(m).split(" ")[0]}
                              </div>
                              {m.isSimBot && (
                                <div className="text-[10px] text-slate-300">
                                  🤖
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.matches.map((match, idx) => {
                          const actual = actualOutcome(match);
                          const isFinished = match.status === "FINISHED";
                          const tipsByUser = Object.fromEntries(
                            match.matchTips.map((t) => [t.userId, t]),
                          );

                          return (
                            <tr
                              key={match.id}
                              className={cn(
                                "border-b border-slate-50",
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                              )}
                            >
                              {/* Match name */}
                              <td className="px-3 py-2 sticky left-0 bg-inherit border-r border-slate-100">
                                <div className="font-medium text-slate-800 text-xs">
                                  {teamName(match.homeTeam, locale)}
                                  <span className="text-slate-400 mx-1">
                                    vs
                                  </span>
                                  {teamName(match.awayTeam, locale)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  #{match.matchNumber}
                                </div>
                              </td>

                              {/* Actual result */}
                              <td className="px-2 py-2 text-center border-r border-slate-100">
                                {isFinished ? (
                                  <span className="font-bold text-slate-700 text-xs">
                                    {match.homeScore}–{match.awayScore}
                                    <div className="text-[10px] font-normal text-slate-400">
                                      {actual ? outcomeLabel(actual) : ""}
                                    </div>
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-xs">
                                    —
                                  </span>
                                )}
                              </td>

                              {/* Tips per user */}
                              {sortedMembers.map((m) => {
                                const tip = tipsByUser[m.userId];
                                const isMe = m.userId === currentUserId;
                                const correct =
                                  tip && actual && tip.prediction === actual;
                                const wrong =
                                  tip && actual && tip.prediction !== actual;

                                return (
                                  <td
                                    key={m.userId}
                                    className={cn(
                                      "px-2 py-2 text-center",
                                      isMe && "bg-pitch-50/50",
                                    )}
                                  >
                                    {tip ? (
                                      <span
                                        className={cn(
                                          "inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold",
                                          correct &&
                                            "bg-green-100 text-green-700",
                                          wrong && "bg-red-100 text-red-600",
                                          !actual &&
                                            isMe &&
                                            "bg-pitch-100 text-pitch-700",
                                          !actual &&
                                            !isMe &&
                                            "bg-slate-100 text-slate-600",
                                        )}
                                      >
                                        {outcomeLabel(tip.prediction)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-200 text-xs">
                                        –
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADVANCEMENT TAB ─────────────────────────────────────────── */}
      {tab === "advancement" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th
                    className="px-3 py-2 text-left font-medium text-slate-500
                                 sticky left-0 bg-slate-50 min-w-[100px] border-r border-slate-100"
                  >
                    {isSv ? "Grupp" : "Group"}
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium text-slate-500
                                 min-w-[160px] border-r border-slate-100"
                  >
                    {isSv ? "Facit" : "Actual"}
                  </th>
                  {sortedMembers.map((m) => (
                    <th
                      key={m.userId}
                      className={cn(
                        "px-2 py-2 text-center font-medium min-w-[100px]",
                        m.userId === currentUserId
                          ? "bg-pitch-50 text-pitch-700"
                          : "text-slate-500",
                      )}
                    >
                      <div
                        className="truncate max-w-[100px]"
                        title={userName(m)}
                      >
                        {userName(m).split(" ")[0]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group, idx) => {
                  const actualTeamIds = new Set(
                    group.actualAdvancements.map((a) => a.teamId),
                  );
                  const advTipsByUser = Object.fromEntries(
                    group.advancementTips.map((t) => [t.userId, t]),
                  );

                  return (
                    <tr
                      key={group.id}
                      className={cn(
                        "border-b border-slate-50",
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      )}
                    >
                      {/* Group name */}
                      <td className="px-3 py-2 sticky left-0 bg-inherit border-r border-slate-100">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full
                                         bg-pitch-500 text-white text-xs font-bold"
                        >
                          {group.name}
                        </span>
                      </td>

                      {/* Actual advancing teams */}
                      <td className="px-3 py-2 border-r border-slate-100">
                        {group.actualAdvancements.length >= 2 ? (
                          <div className="space-y-0.5">
                            {group.actualAdvancements
                              .sort((a, b) => a.position - b.position)
                              .map((adv) => (
                                <div
                                  key={adv.teamId}
                                  className="text-xs text-slate-700 flex items-center gap-1"
                                >
                                  <span className="text-slate-400">
                                    {adv.position}.
                                  </span>
                                  {teamName(adv.team, locale)}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Tips per user */}
                      {sortedMembers.map((m) => {
                        const tip = advTipsByUser[m.userId];
                        const isMe = m.userId === currentUserId;
                        const hasActual = group.actualAdvancements.length >= 2;

                        const score =
                          tip && hasActual
                            ? [tip.firstTeamId, tip.secondTeamId].filter((id) =>
                                actualTeamIds.has(id),
                              ).length
                            : null;

                        return (
                          <td
                            key={m.userId}
                            className={cn(
                              "px-2 py-2",
                              isMe && "bg-pitch-50/50",
                            )}
                          >
                            {tip ? (
                              <div className="space-y-0.5 text-xs">
                                {[tip.firstTeam, tip.secondTeam].map(
                                  (team, i) => {
                                    const isCorrect =
                                      hasActual && actualTeamIds.has(team.id);
                                    const isWrong =
                                      hasActual && !actualTeamIds.has(team.id);
                                    return (
                                      <div
                                        key={team.id}
                                        className={cn(
                                          "flex items-center gap-1 px-1.5 py-0.5 rounded",
                                          isCorrect &&
                                            "bg-green-100 text-green-700",
                                          isWrong && "bg-red-50 text-red-500",
                                          !hasActual && "text-slate-600",
                                        )}
                                      >
                                        <span className="text-slate-400">
                                          {i + 1}.
                                        </span>
                                        <span
                                          className="truncate max-w-[70px]"
                                          title={teamName(team, locale)}
                                        >
                                          {team.fifaCode}
                                        </span>
                                      </div>
                                    );
                                  },
                                )}
                                {score !== null && (
                                  <div className="text-center text-[10px] font-bold text-slate-500">
                                    {score}/2
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-200 text-xs">–</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TOURNAMENT TAB ─────────────────────────────────────────── */}
      {tab === "tournament" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th
                    className="px-3 py-2 text-left font-medium text-slate-500
                                 sticky left-0 bg-slate-50 min-w-[120px] border-r border-slate-100"
                  >
                    {isSv ? "Tips" : "Tip"}
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium text-slate-500
                                 min-w-[140px] border-r border-slate-100"
                  >
                    {isSv ? "Facit" : "Actual"}
                  </th>
                  {sortedMembers.map((m) => (
                    <th
                      key={m.userId}
                      className={cn(
                        "px-2 py-2 text-center font-medium min-w-[100px]",
                        m.userId === currentUserId
                          ? "bg-pitch-50 text-pitch-700"
                          : "text-slate-500",
                      )}
                    >
                      {userName(m).split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Finalists row */}
                <tr className="border-b border-slate-50 bg-white">
                  <td className="px-3 py-3 sticky left-0 bg-white border-r border-slate-100 font-medium text-slate-600 text-xs">
                    {isSv ? "Finallag" : "Finalists"}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100">
                    {tournamentActual ? (
                      <div className="text-xs space-y-0.5">
                        <div className="text-slate-700">
                          {teamName(tournamentActual.finalist1, locale)}
                        </div>
                        <div className="text-slate-400 text-[10px]">vs</div>
                        <div className="text-slate-700">
                          {teamName(tournamentActual.finalist2, locale)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  {sortedMembers.map((m) => {
                    const tip = tournamentTips.find(
                      (t) => t.userId === m.userId,
                    );
                    const isMe = m.userId === currentUserId;
                    const actualFinalistIds = tournamentActual
                      ? new Set([
                          tournamentActual.finalist1.id,
                          tournamentActual.finalist2.id,
                        ])
                      : null;

                    return (
                      <td
                        key={m.userId}
                        className={cn("px-2 py-3", isMe && "bg-pitch-50/50")}
                      >
                        {tip ? (
                          <div className="text-xs space-y-0.5">
                            {[tip.finalist1, tip.finalist2].map((team) => {
                              const correct = actualFinalistIds?.has(team.id);
                              const wrong =
                                actualFinalistIds &&
                                !actualFinalistIds.has(team.id);
                              return (
                                <div
                                  key={team.id}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded truncate max-w-[90px]",
                                    correct && "bg-green-100 text-green-700",
                                    wrong && "bg-red-50 text-red-500",
                                    !actualFinalistIds && "text-slate-600",
                                  )}
                                  title={teamName(team, locale)}
                                >
                                  {team.fifaCode}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-200 text-xs">–</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Winner row */}
                <tr className="bg-slate-50/30">
                  <td className="px-3 py-3 sticky left-0 bg-slate-50/30 border-r border-slate-100 font-medium text-slate-600 text-xs">
                    🏆 {isSv ? "Vinnare" : "Winner"}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-100">
                    {tournamentActual ? (
                      <span className="text-xs font-bold text-gold-500">
                        {teamName(tournamentActual.winner, locale)}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  {sortedMembers.map((m) => {
                    const tip = tournamentTips.find(
                      (t) => t.userId === m.userId,
                    );
                    const isMe = m.userId === currentUserId;
                    const correct =
                      tournamentActual &&
                      tip?.winner.id === tournamentActual.winner.id;
                    const wrong =
                      tournamentActual &&
                      tip &&
                      tip.winner.id !== tournamentActual.winner.id;

                    return (
                      <td
                        key={m.userId}
                        className={cn("px-2 py-3", isMe && "bg-pitch-50/50")}
                      >
                        {tip ? (
                          <span
                            className={cn(
                              "text-xs font-semibold px-1.5 py-0.5 rounded",
                              correct && "bg-green-100 text-green-700",
                              wrong && "bg-red-50 text-red-500",
                              !tournamentActual && "text-slate-600",
                            )}
                          >
                            {tip.winner.fifaCode}
                          </span>
                        ) : (
                          <span className="text-slate-200 text-xs">–</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-400 justify-end">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-green-100" />{" "}
          {isSv ? "Rätt" : "Correct"}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-red-50" />{" "}
          {isSv ? "Fel" : "Wrong"}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-slate-100" />{" "}
          {isSv ? "Väntar" : "Pending"}
        </span>
      </div>
    </div>
  );
}
