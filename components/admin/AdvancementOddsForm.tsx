// components/admin/AdvancementOddsForm.tsx
"use client";

import { useState, useTransition } from "react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import type { Prisma } from "@prisma/client";

type GroupWithTeams = Prisma.GroupGetPayload<{
  include: { teams: { include: { advancementOdds: true } } };
}>;

type TeamOddsEntry = { teamId: string; value: string };

export function AdvancementOddsForm({
  group,
  locale,
  adminId,
}: {
  group: GroupWithTeams;
  locale: string;
  adminId: string;
}) {
  const [entries, setEntries] = useState<TeamOddsEntry[]>(
    group.teams.map((t) => ({
      teamId: t.id,
      value: t.advancementOdds ? Number(t.advancementOdds.avgValue).toFixed(2) : "",
    }))
  );
  const [saved, setSaved] = useState(group.teams.every((t) => t.advancementOdds));
  const [isPending, startTransition] = useTransition();

  function update(teamId: string, value: string) {
    setSaved(false);
    setEntries((prev) => prev.map((e) => (e.teamId === teamId ? { ...e, value } : e)));
  }

  async function handleSave() {
    startTransition(async () => {
      // Call server-side via fetch to our own API route
      const res = await fetch("/api/admin/advancement-odds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: entries.map((e) => ({
            teamId: e.teamId,
            value: parseFloat(e.value),
            adminId,
          })),
        }),
      });
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div className={cn(
      "rounded-xl border bg-white p-3 space-y-2",
      saved ? "border-green-200" : "border-slate-200"
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {locale === "sv" ? `Grupp ${group.name}` : `Group ${group.name}`}
        </h3>
        {saved && <span className="text-xs text-green-600">✓</span>}
      </div>
      <div className="space-y-1.5">
        {group.teams.map((team) => {
          const entry = entries.find((e) => e.teamId === team.id);
          return (
            <div key={team.id} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 flex-1">
                {locale === "sv" ? team.nameSv : team.nameEn}
              </span>
              <Input
                type="number"
                step="0.01"
                min="1.01"
                placeholder="2.00"
                value={entry?.value ?? ""}
                onChange={(e) => update(team.id, e.target.value)}
                className="w-20 text-xs font-mono"
              />
            </div>
          );
        })}
      </div>
      <Button size="sm" className="w-full" onClick={handleSave} loading={isPending}
        variant={saved ? "secondary" : "default"}>
        {saved ? "✓" : locale === "sv" ? "Spara" : "Save"}
      </Button>
    </div>
  );
}
