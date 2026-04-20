// components/tips/TournamentTipForm.tsx
"use client";

import { useState, useActionState, useTransition } from "react";
import { submitTournamentTip } from "@/lib/actions/tips";
import type { MatchTipState } from "@/lib/actions/tips";
import { cn, formatPoints } from "@/lib/utils";
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { Prisma } from "@prisma/client";

type TeamWithOdds = Prisma.TeamGetPayload<{
  include: { group: true; tournamentOdds: true };
}>;

type ExistingTip = Prisma.TournamentTipGetPayload<{
  include: { finalist1: true; finalist2: true; winner: true };
}> | null;

interface TournamentTipFormProps {
  tournamentId: string;
  teams: TeamWithOdds[];
  existingTip: ExistingTip;
  locked: boolean;
  locale: string;
}

const initialState: MatchTipState = { success: false };

export function TournamentTipForm({
  tournamentId, teams, existingTip, locked, locale
}: TournamentTipFormProps) {
  const [state, action] = useActionState(submitTournamentTip, initialState);
  const [, startTransition] = useTransition();

  const [finalist1, setFinalist1] = useState(existingTip?.finalist1Id ?? "");
  const [finalist2, setFinalist2] = useState(existingTip?.finalist2Id ?? "");
  const [winner, setWinner] = useState(existingTip?.winnerId ?? "");
  const [saved, setSaved] = useState(!!existingTip);

  function handleSave() {
    if (!finalist1 || !finalist2 || !winner) return;
    const fd = new FormData();
    fd.append("tournamentId", tournamentId);
    fd.append("finalist1Id", finalist1);
    fd.append("finalist2Id", finalist2);
    fd.append("winnerId", winner);
    startTransition(async () => {
      await action(fd);
      setSaved(true);
    });
  }

  function TeamSelector({
    label,
    selected,
    onChange,
    exclude,
  }: {
    label: string;
    selected: string;
    onChange: (id: string) => void;
    exclude?: string[];
  }) {
    const available = teams.filter((t) => !exclude?.includes(t.id) || t.id === selected);
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-600">{label}</div>
        <select
          value={selected}
          onChange={(e) => { onChange(e.target.value); setSaved(false); }}
          disabled={locked}
          className={cn(
            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-pitch-500",
            "disabled:opacity-50 disabled:cursor-default",
            selected ? "text-slate-800 font-medium" : "text-slate-400"
          )}
        >
          <option value="">
            {locale === "sv" ? "– Välj lag –" : "– Select team –"}
          </option>
          {available.map((team) => {
            const odds = team.tournamentOdds.find((o) => o.type === "WIN");
            return (
              <option key={team.id} value={team.id}>
                {locale === "sv" ? team.nameSv : team.nameEn}
                {odds ? ` (${Number(odds.avgValue).toFixed(2)})` : ""}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  const finalist1Team = teams.find((t) => t.id === finalist1);
  const finalist2Team = teams.find((t) => t.id === finalist2);

  return (
    <div className="space-y-4">
      {/* Finalists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏟️ {locale === "sv" ? "Vilka lag spelar finalen?" : "Which teams play the final?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TeamSelector
            label={locale === "sv" ? "Finallag 1" : "Finalist 1"}
            selected={finalist1}
            onChange={(id) => {
              setFinalist1(id);
              if (winner && winner !== id && winner !== finalist2) setWinner("");
            }}
            exclude={[finalist2]}
          />
          <TeamSelector
            label={locale === "sv" ? "Finallag 2" : "Finalist 2"}
            selected={finalist2}
            onChange={(id) => {
              setFinalist2(id);
              if (winner && winner !== finalist1 && winner !== id) setWinner("");
            }}
            exclude={[finalist1]}
          />
        </CardContent>
      </Card>

      {/* Winner — only available if both finalists selected */}
      {finalist1 && finalist2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🥇 {locale === "sv" ? "Vem vinner VM?" : "Who wins the World Cup?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[finalist1Team, finalist2Team].filter(Boolean).map((team) => {
                if (!team) return null;
                const winOdds = team.tournamentOdds.find((o) => o.type === "WIN");
                const isSelected = winner === team.id;
                return (
                  <button
                    key={team.id}
                    onClick={() => { if (!locked) { setWinner(team.id); setSaved(false); } }}
                    disabled={locked}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 p-4 rounded-xl border text-sm transition-all",
                      "disabled:cursor-default",
                      isSelected
                        ? "border-gold-500 bg-yellow-50 text-yellow-700 font-semibold"
                        : locked
                          ? "border-slate-100 text-slate-300"
                          : "border-slate-200 hover:border-pitch-300 cursor-pointer"
                    )}
                  >
                    <span className="text-2xl">🏆</span>
                    <span>{locale === "sv" ? team.nameSv : team.nameEn}</span>
                    {winOdds && (
                      <span className="text-xs text-slate-400">
                        {Number(winOdds.avgValue).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save */}
      {!locked && (
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!finalist1 || !finalist2 || !winner}
          variant={saved ? "secondary" : "default"}
        >
          {saved
            ? (locale === "sv" ? "✓ Sparat" : "✓ Saved")
            : (locale === "sv" ? "Spara tips" : "Save tip")}
        </Button>
      )}

      {state.error && (
        <p className="text-sm text-red-600 text-center">{state.error}</p>
      )}

      {/* Points earned */}
      {existingTip?.pointsEarned != null && (
        <div className="text-center text-sm font-semibold text-pitch-600">
          +{formatPoints(Number(existingTip.pointsEarned))} p
        </div>
      )}
    </div>
  );
}
