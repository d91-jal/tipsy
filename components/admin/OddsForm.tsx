// components/admin/OddsForm.tsx
"use client";

import { useState, useTransition } from "react";
import { setMatchOdds } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import type { Prisma } from "@prisma/client";

type MatchWithOdds = Prisma.MatchGetPayload<{
  include: { homeTeam: true; awayTeam: true; odds: true };
}>;

type OddsSource = { name: string; value: string };
type OutcomeKey = "HOME" | "DRAW" | "AWAY";

const DEFAULT_SOURCES = ["Unibet", "Betsson", "Bet365"];

function buildInitialSources(existing: number | null): OddsSource[] {
  if (existing) {
    // Pre-fill with one row showing the existing average
    return [{ name: "Average", value: existing.toFixed(2) }];
  }
  return DEFAULT_SOURCES.map((name) => ({ name, value: "" }));
}

export function OddsForm({ match, locale, adminId }: { match: MatchWithOdds; locale: string; adminId: string }) {
  const existingByOutcome = {
    HOME: match.odds.find((o) => o.outcome === "HOME"),
    DRAW: match.odds.find((o) => o.outcome === "DRAW"),
    AWAY: match.odds.find((o) => o.outcome === "AWAY"),
  };

  const [sources, setSources] = useState<Record<OutcomeKey, OddsSource[]>>({
    HOME: buildInitialSources(existingByOutcome.HOME ? Number(existingByOutcome.HOME.avgValue) : null),
    DRAW: buildInitialSources(existingByOutcome.DRAW ? Number(existingByOutcome.DRAW.avgValue) : null),
    AWAY: buildInitialSources(existingByOutcome.AWAY ? Number(existingByOutcome.AWAY.avgValue) : null),
  });
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(match.odds.length === 3);
  const [isPending, startTransition] = useTransition();

  const homeName = locale === "sv" ? match.homeTeam?.nameSv : match.homeTeam?.nameEn;
  const awayName = locale === "sv" ? match.awayTeam?.nameSv : match.awayTeam?.nameEn;

  function calcAvg(outcome: OutcomeKey): number {
    const vals = sources[outcome]
      .map((s) => parseFloat(s.value))
      .filter((v) => !isNaN(v) && v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  function updateSource(outcome: OutcomeKey, idx: number, field: keyof OddsSource, val: string) {
    setSaved(false);
    setSources((prev) => ({
      ...prev,
      [outcome]: prev[outcome].map((s, i) => i === idx ? { ...s, [field]: val } : s),
    }));
  }

  function addSource(outcome: OutcomeKey) {
    setSources((prev) => ({
      ...prev,
      [outcome]: [...prev[outcome], { name: "", value: "" }],
    }));
  }

  async function handleSave() {
    const fd = new FormData();
    fd.append("matchId", match.id);
    fd.append("sources", JSON.stringify({
      HOME: sources.HOME.map((s) => ({ name: s.name, value: parseFloat(s.value) })).filter((s) => !isNaN(s.value) && s.value > 0),
      DRAW: sources.DRAW.map((s) => ({ name: s.name, value: parseFloat(s.value) })).filter((s) => !isNaN(s.value) && s.value > 0),
      AWAY: sources.AWAY.map((s) => ({ name: s.name, value: parseFloat(s.value) })).filter((s) => !isNaN(s.value) && s.value > 0),
    }));
    startTransition(async () => {
      await setMatchOdds(fd);
      setSaved(true);
      setExpanded(false);
    });
  }

  const outcomes: { key: OutcomeKey; label: string }[] = [
    { key: "HOME", label: "1" },
    { key: "DRAW", label: "X" },
    { key: "AWAY", label: "2" },
  ];

  return (
    <div className={cn(
      "rounded-xl border bg-white transition-all",
      saved ? "border-green-200" : "border-slate-200"
    )}>
      {/* Summary row — always visible */}
      <button
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs text-slate-400 w-8">#{match.matchNumber}</span>
        <span className="text-sm font-medium text-slate-700 flex-1">
          {homeName} <span className="text-slate-400 font-normal">vs</span> {awayName}
        </span>
        {outcomes.map(({ key, label }) => {
          const avg = calcAvg(key);
          return (
            <span key={key} className="text-xs text-slate-500">
              <span className="text-slate-400">{label}:</span>{" "}
              <span className={cn("font-mono", avg > 0 ? "text-slate-700" : "text-slate-300")}>
                {avg > 0 ? avg.toFixed(2) : "–"}
              </span>
            </span>
          );
        })}
        {saved && <span className="text-green-500 text-xs">✓</span>}
        <span className="text-slate-400 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded odds entry */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {outcomes.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <div className="text-sm font-semibold text-slate-600">
                  {label} — {key === "HOME" ? homeName : key === "AWAY" ? awayName : (locale === "sv" ? "Oavgjort" : "Draw")}
                </div>
                {sources[key].map((src, idx) => (
                  <div key={idx} className="flex gap-1">
                    <Input
                      placeholder={locale === "sv" ? "Källa" : "Source"}
                      value={src.name}
                      onChange={(e) => updateSource(key, idx, "name", e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="2.50"
                      value={src.value}
                      onChange={(e) => updateSource(key, idx, "value", e.target.value)}
                      className="w-20 text-xs font-mono"
                      type="number"
                      step="0.01"
                      min="1.01"
                    />
                  </div>
                ))}
                <button
                  onClick={() => addSource(key)}
                  className="text-xs text-pitch-500 hover:text-pitch-700"
                >
                  + {locale === "sv" ? "Lägg till källa" : "Add source"}
                </button>
                <div className="text-xs text-slate-500">
                  {locale === "sv" ? "Snitt" : "Avg"}:{" "}
                  <span className="font-mono font-semibold text-slate-700">
                    {calcAvg(key) > 0 ? calcAvg(key).toFixed(2) : "–"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button size="sm" onClick={handleSave} loading={isPending}>
            {locale === "sv" ? "Spara odds" : "Save odds"}
          </Button>
        </div>
      )}
    </div>
  );
}
