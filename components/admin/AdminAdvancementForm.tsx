// components/admin/AdminAdvancementForm.tsx
"use client";

import { useState, useTransition } from "react";
import { setGroupActualAdvancement } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import type { Prisma } from "@prisma/client";

type GroupWithData = Prisma.GroupGetPayload<{
  include: {
    teams: true;
    actualAdvancements: { include: { team: true } };
  };
}>;

export function AdminAdvancementForm({
  group,
  locale,
}: {
  group: GroupWithData;
  locale: string;
}) {
  const existing = group.actualAdvancements;
  const [selected, setSelected] = useState<string[]>(
    existing.length >= 2
      ? [
          existing.find((a) => a.position === 1)?.teamId ?? "",
          existing.find((a) => a.position === 2)?.teamId ?? "",
        ].filter(Boolean)
      : []
  );
  const [saved, setSaved] = useState(existing.length >= 2);
  const [isPending, startTransition] = useTransition();

  function toggle(teamId: string) {
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId);
      if (prev.length >= 2) return [prev[1], teamId];
      return [...prev, teamId];
    });
  }

  async function handleSave() {
    if (selected.length !== 2) return;
    const fd = new FormData();
    fd.append("groupId", group.id);
    fd.append("firstTeamId", selected[0]);
    fd.append("secondTeamId", selected[1]);
    startTransition(async () => {
      await setGroupActualAdvancement(fd);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {locale === "sv" ? `Grupp ${group.name}` : `Group ${group.name}`}
        </h3>
        {saved && <span className="text-xs text-green-600 font-medium">✓</span>}
      </div>

      <div className="space-y-1">
        {group.teams.map((team) => {
          const idx = selected.indexOf(team.id);
          const isSelected = idx !== -1;
          return (
            <button
              key={team.id}
              onClick={() => toggle(team.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all",
                isSelected
                  ? "bg-pitch-50 text-pitch-700 border border-pitch-300 font-medium"
                  : "border border-transparent text-slate-600 hover:bg-slate-50"
              )}
            >
              {isSelected && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-pitch-500 text-white text-[10px] font-bold">
                  {idx + 1}
                </span>
              )}
              {locale === "sv" ? team.nameSv : team.nameEn}
            </button>
          );
        })}
      </div>

      <Button
        size="sm"
        className="w-full"
        onClick={handleSave}
        disabled={selected.length !== 2 || isPending}
        loading={isPending}
        variant={saved ? "secondary" : "default"}
      >
        {saved ? "✓" : locale === "sv" ? "Spara" : "Save"}
      </Button>
    </div>
  );
}
