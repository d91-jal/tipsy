// components/admin/AdminResultForm.tsx
"use client";

import { useState, useTransition } from "react";
import { setMatchResult } from "@/lib/actions/admin";
import { cn, formatDate, stageLabel } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import type { Prisma } from "@prisma/client";

type MatchWithTeams = Prisma.MatchGetPayload<{
  include: { homeTeam: true; awayTeam: true; odds: true };
}>;

export function AdminResultForm({ match, locale }: { match: MatchWithTeams; locale: string }) {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (homeScore === "" || awayScore === "") return;
    setError("");
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

  if (saved) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-center gap-3 text-sm">
        <span className="text-green-600 font-semibold">✓</span>
        <span className="text-green-700">
          #{match.matchNumber} {locale === "sv" ? match.homeTeam?.nameSv : match.homeTeam?.nameEn}{" "}
          {homeScore}–{awayScore}{" "}
          {locale === "sv" ? match.awayTeam?.nameSv : match.awayTeam?.nameEn}
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
    >
      <span className="text-xs text-slate-400 w-8">#{match.matchNumber}</span>
      <span className="text-xs text-slate-400 hidden sm:inline">
        {stageLabel(match.stage, locale)}
      </span>

      {/* Home team + score */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm font-medium text-slate-700 flex-1 text-right">
          {locale === "sv" ? match.homeTeam?.nameSv : match.homeTeam?.nameEn}
        </span>
        <Input
          type="number"
          min={0}
          max={30}
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value)}
          placeholder="0"
          className="w-14 text-center"
          required
        />
        <span className="text-slate-400">–</span>
        <Input
          type="number"
          min={0}
          max={30}
          value={awayScore}
          onChange={(e) => setAwayScore(e.target.value)}
          placeholder="0"
          className="w-14 text-center"
          required
        />
        <span className="text-sm font-medium text-slate-700 flex-1">
          {locale === "sv" ? match.awayTeam?.nameSv : match.awayTeam?.nameEn}
        </span>
      </div>

      <Button type="submit" size="sm" loading={isPending}>
        {locale === "sv" ? "Spara" : "Save"}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </form>
  );
}
