"use client";

import { useState, useTransition } from "react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui";
import { setTournamentActualResult } from "@/lib/actions/admin";

type TeamWithGroup = Prisma.TeamGetPayload<{
  include: { group: true };
}>;

type ExistingResult = Prisma.TournamentActualResultGetPayload<{
  include: { finalist1: true; finalist2: true; winner: true };
}> | null;

export function TournamentFinalsForm({
  tournamentId,
  teams,
  existingResult,
  locale,
}: {
  tournamentId: string;
  teams: TeamWithGroup[];
  existingResult: ExistingResult;
  locale: string;
}) {
  const [finalist1Id, setFinalist1Id] = useState(
    existingResult?.finalist1Id ?? "",
  );
  const [finalist2Id, setFinalist2Id] = useState(
    existingResult?.finalist2Id ?? "",
  );
  const [winnerId, setWinnerId] = useState(existingResult?.winnerId ?? "");
  const [saved, setSaved] = useState(Boolean(existingResult));
  const [isPending, startTransition] = useTransition();

  const isValid = finalist1Id && finalist2Id && finalist1Id !== finalist2Id;

  function handleChange(next: string, setter: (value: string) => void) {
    setSaved(false);
    setter(next);
  }

  async function handleSave() {
    if (!isValid) return;

    const fd = new FormData();
    fd.append("tournamentId", tournamentId);
    fd.append("finalist1Id", finalist1Id);
    fd.append("finalist2Id", finalist2Id);
    fd.append("winnerId", winnerId);

    startTransition(async () => {
      await setTournamentActualResult(fd);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {locale === "sv" ? "Slutspel" : "Final stage"}
        </p>
        <h2 className="text-lg font-semibold text-slate-800">
          {locale === "sv" ? "Ställ in finalister" : "Set finalists"}
        </h2>
        <p className="text-sm text-slate-600">
          {locale === "sv"
            ? "Välj de två lag som når finalen. Du kan spara dem nu och lägga till vinnaren senare."
            : "Choose the two teams that reach the final. You can save them now and add the winner later."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">
            {locale === "sv" ? "Finalist 1" : "Finalist 1"}
          </span>
          <select
            value={finalist1Id}
            onChange={(e) => handleChange(e.target.value, setFinalist1Id)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">
              {locale === "sv" ? "Välj lag" : "Select team"}
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {locale === "sv" ? team.nameSv : team.nameEn} ({team.group.name}
                )
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">
            {locale === "sv" ? "Finalist 2" : "Finalist 2"}
          </span>
          <select
            value={finalist2Id}
            onChange={(e) => handleChange(e.target.value, setFinalist2Id)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">
              {locale === "sv" ? "Välj lag" : "Select team"}
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {locale === "sv" ? team.nameSv : team.nameEn} ({team.group.name}
                )
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-700">
          <span className="font-medium">
            {locale === "sv" ? "Vinnare (valfri)" : "Winner (optional)"}
          </span>
          <select
            value={winnerId}
            onChange={(e) => handleChange(e.target.value, setWinnerId)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">
              {locale === "sv" ? "Välj vinnare" : "Select winner"}
            </option>
            {[finalist1Id, finalist2Id].filter(Boolean).map((teamId) => {
              const team = teams.find((item) => item.id === teamId);
              if (!team) return null;
              return (
                <option key={team.id} value={team.id}>
                  {locale === "sv" ? team.nameSv : team.nameEn}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      {!isValid && (
        <p className="text-sm text-amber-700">
          {locale === "sv"
            ? "Välj två olika finalister för att spara."
            : "Choose two different finalists to save."}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isValid || isPending}
          loading={isPending}
          variant={saved ? "outline" : "primary"}
        >
          {saved
            ? locale === "sv"
              ? "Sparad ✓"
              : "Saved ✓"
            : locale === "sv"
              ? "Spara"
              : "Save"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">
            {locale === "sv"
              ? "Inställningarna är sparade."
              : "The settings are saved."}
          </span>
        )}
      </div>
    </div>
  );
}
