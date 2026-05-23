// components/admin/AdminResultForm.tsx
"use client";

import { useState, useTransition } from "react";
import { setMatchResult } from "@/lib/actions/admin";
import { cn, stageLabel } from "@/lib/utils";
import { Button, Input } from "@/components/ui";

type Team = {
  id: string;
  nameSv: string;
  nameEn: string;
  fifaCode: string;
};

type MatchWithTeams = {
  id: string;
  matchNumber: number;
  stage: string;
  scheduledAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
};

interface AdminResultFormProps {
  match: MatchWithTeams;
  locale: string;
}

export function AdminResultForm({ match, locale }: AdminResultFormProps) {
  const isSv = locale === "sv";
  const isFinished = match.status === "FINISHED";

  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const homeName = isSv ? match.homeTeam?.nameSv : match.homeTeam?.nameEn;
  const awayName = isSv ? match.awayTeam?.nameSv : match.awayTeam?.nameEn;

  const hasChanged =
    homeScore !== (match.homeScore?.toString() ?? "") ||
    awayScore !== (match.awayScore?.toString() ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (homeScore === "" || awayScore === "") return;
    setError("");
    setSaved(false);

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("matchId", match.id);
        fd.append("homeScore", homeScore);
        fd.append("awayScore", awayScore);
        await setMatchResult(fd);
        setSaved(true);
      } catch (err: any) {
        setError(err.message ?? "Error");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        isFinished
          ? "border-amber-200 bg-amber-50/40"
          : "border-slate-200 bg-white",
        saved && "border-green-200 bg-green-50/40",
      )}
    >
      {/* Match number + stage */}
      <span className="text-xs text-slate-400 w-8 shrink-0">
        #{match.matchNumber}
      </span>
      <span className="text-xs text-slate-400 hidden sm:inline shrink-0 w-20">
        {stageLabel(match.stage, locale)}
      </span>

      {/* Correction badge */}
      {isFinished && !saved && (
        <span className="text-xs font-medium text-amber-600 shrink-0">
          {isSv ? "⚠ Korrigering" : "⚠ Correction"}
        </span>
      )}

      {/* Home team + score inputs */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-700 flex-1 text-right truncate">
          {homeName}
        </span>
        <Input
          type="number"
          min={0}
          max={30}
          value={homeScore}
          onChange={(e) => {
            setHomeScore(e.target.value);
            setSaved(false);
          }}
          placeholder="0"
          className="w-14 text-center font-mono"
          required
        />
        <span className="text-slate-400 shrink-0">–</span>
        <Input
          type="number"
          min={0}
          max={30}
          value={awayScore}
          onChange={(e) => {
            setAwayScore(e.target.value);
            setSaved(false);
          }}
          placeholder="0"
          className="w-14 text-center font-mono"
          required
        />
        <span className="text-sm font-medium text-slate-700 flex-1 truncate">
          {awayName}
        </span>
      </div>

      {/* Save button */}
      <Button
        type="submit"
        size="sm"
        loading={isPending}
        variant={
          saved
            ? "outline"
            : isFinished && hasChanged
              ? "destructive"
              : "primary"
        }
        className="shrink-0"
      >
        {saved
          ? isSv
            ? "✓ Sparat"
            : "✓ Saved"
          : isFinished
            ? isSv
              ? "Rätta"
              : "Correct"
            : isSv
              ? "Spara"
              : "Save"}
      </Button>

      {error && <span className="text-xs text-red-500 shrink-0">{error}</span>}
    </form>
  );
}
