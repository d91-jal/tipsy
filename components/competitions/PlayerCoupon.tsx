// components/competitions/PlayerCoupon.tsx
// Displays a single player's full tip coupon with earned points.
"use client";

import { useState } from "react";
import { cn, formatPoints, stageLabel } from "@/lib/utils";

type Team = {
  id: string;
  nameSv: string;
  nameEn: string;
  fifaCode: string;
  flagUrl: string | null;
};
type Odds = { outcome: "HOME" | "DRAW" | "AWAY"; avgValue: number };
type MatchTip = {
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
  odds: Odds[];
  matchTips: MatchTip[];
};

type Group = {
  id: string;
  name: string;
  matches: Match[];
};

type AdvancementTip = {
  groupId: string;
  group: { name: string };
  firstTeam: Team;
  secondTeam: Team;
  pointsEarned: number | null;
};

type TournamentTip = {
  finalist1: Team;
  finalist2: Team;
  winner: Team;
  pointsEarned: number | null;
} | null;

type Props = {
  groups: Group[];
  knockoutMatches: Match[];
  advancementTips: AdvancementTip[];
  tournamentTip: TournamentTip;
  locale: string;
};

type Tab = "group" | "knockout" | "advancement" | "tournament";

function outcomeLabel(o: "HOME" | "DRAW" | "AWAY") {
  return o === "HOME" ? "1" : o === "DRAW" ? "X" : "2";
}

function actualOutcome(m: Match): "HOME" | "DRAW" | "AWAY" | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return "HOME";
  if (m.awayScore > m.homeScore) return "AWAY";
  return "DRAW";
}

function tn(team: Team | null, locale: string) {
  if (!team) return "?";
  return locale === "sv" ? team.nameSv : team.nameEn;
}

function MatchRow({ match, locale }: { match: Match; locale: string }) {
  const tip = match.matchTips[0];
  const actual = actualOutcome(match);
  const correct = tip && actual && tip.prediction === actual;
  const wrong = tip && actual && tip.prediction !== actual;
  const finished = match.status === "FINISHED";

  const oddsForTip = tip
    ? match.odds.find((o) => o.outcome === tip.prediction)?.avgValue
    : null;

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 text-sm">
      {/* Match */}
      <td className="px-3 py-2 text-slate-400 text-xs w-10">
        #{match.matchNumber}
      </td>
      <td className="px-2 py-2">
        <span className="font-medium text-slate-700">
          {tn(match.homeTeam, locale)}
        </span>
        <span className="text-slate-400 mx-1.5 text-xs">vs</span>
        <span className="font-medium text-slate-700">
          {tn(match.awayTeam, locale)}
        </span>
      </td>

      {/* Result */}
      <td className="px-2 py-2 text-center text-xs font-mono text-slate-500 w-14">
        {finished ? `${match.homeScore}–${match.awayScore}` : "–"}
      </td>

      {/* Tip */}
      <td className="px-2 py-2 text-center w-12">
        {tip ? (
          <span
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold",
              correct && "bg-green-100 text-green-700",
              wrong && "bg-red-100 text-red-600",
              !actual && "bg-slate-100 text-slate-600",
            )}
          >
            {outcomeLabel(tip.prediction)}
          </span>
        ) : (
          <span className="text-slate-200">–</span>
        )}
      </td>

      {/* Odds */}
      <td className="px-2 py-2 text-center text-xs text-slate-400 w-12">
        {oddsForTip ? oddsForTip.toFixed(2) : "–"}
      </td>

      {/* Points */}
      <td className="px-3 py-2 text-right w-16">
        {tip?.pointsEarned != null ? (
          <span
            className={cn(
              "text-sm font-semibold",
              tip.pointsEarned > 0 ? "text-pitch-600" : "text-slate-300",
            )}
          >
            {tip.pointsEarned > 0 ? `+${formatPoints(tip.pointsEarned)}` : "0"}
          </span>
        ) : (
          <span className="text-slate-200 text-xs">–</span>
        )}
      </td>
    </tr>
  );
}

export function PlayerCoupon({
  groups,
  knockoutMatches,
  advancementTips,
  tournamentTip,
  locale,
}: Props) {
  const [tab, setTab] = useState<Tab>("group");
  const isSv = locale === "sv";

  const tabs: { key: Tab; label: string }[] = [
    { key: "group", label: isSv ? "⚽ Gruppspel" : "⚽ Group Stage" },
    { key: "advancement", label: isSv ? "🏅 Avancemang" : "🏅 Advancement" },
    { key: "knockout", label: isSv ? "⚔️ Slutspel" : "⚔️ Knockout" },
    { key: "tournament", label: isSv ? "🏆 Final" : "🏆 Final" },
  ];

  const tableHead = (
    <thead>
      <tr className="border-b border-slate-100 text-xs text-slate-400 bg-slate-50">
        <th className="px-3 py-2 text-left w-10">#</th>
        <th className="px-2 py-2 text-left">{isSv ? "Match" : "Match"}</th>
        <th className="px-2 py-2 text-center w-14">
          {isSv ? "Facit" : "Result"}
        </th>
        <th className="px-2 py-2 text-center w-12">{isSv ? "Tips" : "Tip"}</th>
        <th className="px-2 py-2 text-center w-12">{isSv ? "Odds" : "Odds"}</th>
        <th className="px-3 py-2 text-right w-16">
          {isSv ? "Poäng" : "Points"}
        </th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all",
              tab === t.key
                ? "bg-white text-pitch-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Group stage */}
      {tab === "group" && (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full
                                 bg-pitch-500 text-white text-[10px] font-bold"
                >
                  {group.name}
                </span>
                <span className="text-sm font-semibold text-slate-600">
                  {isSv ? `Grupp ${group.name}` : `Group ${group.name}`}
                </span>
              </div>
              <table className="w-full">
                {tableHead}
                <tbody>
                  {group.matches.map((m) => (
                    <MatchRow key={m.id} match={m} locale={locale} />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Advancement tips */}
      {tab === "advancement" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 bg-slate-50">
                <th className="px-3 py-2 text-left">
                  {isSv ? "Grupp" : "Group"}
                </th>
                <th className="px-3 py-2 text-left">
                  {isSv ? "Tippade att gå vidare" : "Tipped to advance"}
                </th>
                <th className="px-3 py-2 text-right">
                  {isSv ? "Poäng" : "Points"}
                </th>
              </tr>
            </thead>
            <tbody>
              {advancementTips.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-slate-400 text-xs"
                  >
                    {isSv ? "Inga avancemangstips" : "No advancement tips"}
                  </td>
                </tr>
              )}
              {advancementTips.map((tip) => (
                <tr key={tip.groupId} className="border-b border-slate-50">
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full
                                     bg-pitch-500 text-white text-[10px] font-bold"
                    >
                      {tip.group.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <div className="flex gap-2">
                      <span className="font-medium">
                        {tip.firstTeam.fifaCode}
                      </span>
                      <span className="text-slate-300">+</span>
                      <span className="font-medium">
                        {tip.secondTeam.fifaCode}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {tip.pointsEarned != null ? (
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          tip.pointsEarned > 0
                            ? "text-pitch-600"
                            : "text-slate-300",
                        )}
                      >
                        {tip.pointsEarned > 0
                          ? `+${formatPoints(tip.pointsEarned)}`
                          : "0"}
                      </span>
                    ) : (
                      <span className="text-slate-200 text-xs">–</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Knockout */}
      {tab === "knockout" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {knockoutMatches.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              {isSv
                ? "Slutspelslagen är inte fastställda ännu"
                : "Knockout teams not yet determined"}
            </p>
          ) : (
            <table className="w-full">
              {tableHead}
              <tbody>
                {knockoutMatches.map((m) => (
                  <MatchRow key={m.id} match={m} locale={locale} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tournament */}
      {tab === "tournament" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 bg-slate-50">
                <th className="px-3 py-2 text-left">{isSv ? "Tips" : "Tip"}</th>
                <th className="px-3 py-2 text-left">{isSv ? "Val" : "Pick"}</th>
                <th className="px-3 py-2 text-right">
                  {isSv ? "Poäng" : "Points"}
                </th>
              </tr>
            </thead>
            <tbody>
              {!tournamentTip ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-slate-400 text-xs"
                  >
                    {isSv ? "Inget turneringstips" : "No tournament tip"}
                  </td>
                </tr>
              ) : (
                <>
                  <tr className="border-b border-slate-50">
                    <td className="px-3 py-2.5 text-slate-500 text-xs">
                      {isSv ? "Finallag" : "Finalists"}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">
                      {tournamentTip.finalist1.fifaCode} vs{" "}
                      {tournamentTip.finalist2.fifaCode}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-200 text-xs">
                      –
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2.5 text-slate-500 text-xs">
                      🏆 {isSv ? "Vinnare" : "Winner"}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-800">
                      {tournamentTip.winner.fifaCode}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {tournamentTip.pointsEarned != null ? (
                        <span
                          className={cn(
                            "font-semibold text-sm",
                            tournamentTip.pointsEarned > 0
                              ? "text-pitch-600"
                              : "text-slate-300",
                          )}
                        >
                          {tournamentTip.pointsEarned > 0
                            ? `+${formatPoints(Number(tournamentTip.pointsEarned))}`
                            : "0"}
                        </span>
                      ) : (
                        <span className="text-slate-200 text-xs">–</span>
                      )}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
