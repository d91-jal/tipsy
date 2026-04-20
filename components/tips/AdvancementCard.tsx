// components/tips/AdvancementCard.tsx
"use client";

import { useState, useActionState, useTransition } from "react";
import { submitGroupAdvancementTip } from "@/lib/actions/tips";
import type { MatchTipState } from "@/lib/actions/tips";
import { cn, formatPoints } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import type { Prisma } from "@prisma/client";

type GroupWithTeams = Prisma.GroupGetPayload<{
  include: {
    teams: { include: { advancementOdds: true } };
    advancementTips: { include: { firstTeam: true; secondTeam: true } };
  };
}>;

interface AdvancementCardProps {
  group: GroupWithTeams;
  existingTip: GroupWithTeams["advancementTips"][0] | null;
  locked: boolean;
  locale: string;
}

const initialState: MatchTipState = { success: false };

export function AdvancementCard({ group, existingTip, locked, locale }: AdvancementCardProps) {
  const [state, action] = useActionState(submitGroupAdvancementTip, initialState);
  const [, startTransition] = useTransition();

  const [selected, setSelected] = useState<string[]>(
    existingTip ? [existingTip.firstTeamId, existingTip.secondTeamId] : []
  );
  const [saved, setSaved] = useState(!!existingTip);
  const [saving, setSaving] = useState(false);

  function toggleTeam(teamId: string) {
    if (locked) return;
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId);
      if (prev.length >= 2) return [prev[1], teamId]; // Replace oldest selection
      return [...prev, teamId];
    });
  }

  async function handleSave() {
    if (selected.length !== 2) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("groupId", group.id);
    fd.append("firstTeamId", selected[0]);
    fd.append("secondTeamId", selected[1]);
    startTransition(async () => {
      await action(fd);
      setSaved(true);
      setSaving(false);
    });
  }

  const labelTeam = (team: GroupWithTeams["teams"][0]) =>
    locale === "sv" ? team.nameSv : team.nameEn;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      {/* Group header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pitch-500 text-white text-xs font-bold">
            {group.name}
          </span>
          {locale === "sv" ? `Grupp ${group.name}` : `Group ${group.name}`}
        </h3>
        {saved && (
          <Badge variant="success">✓ {locale === "sv" ? "Sparat" : "Saved"}</Badge>
        )}
        {state.error && (
          <Badge variant="error">{state.error === "DEADLINE_PASSED" ? "🔒" : "!"}</Badge>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-1.5">
        {group.teams.map((team) => {
          const isSelected = selected.includes(team.id);
          const rank = selected.indexOf(team.id) + 1;
          const odds = team.advancementOdds ? Number(team.advancementOdds.avgValue) : null;

          return (
            <button
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              disabled={locked}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all",
                "disabled:cursor-default",
                isSelected
                  ? "border-pitch-500 bg-pitch-50 text-pitch-700 font-medium"
                  : locked
                    ? "border-slate-100 text-slate-300"
                    : "border-slate-200 text-slate-600 hover:border-pitch-300 hover:bg-pitch-50/50 cursor-pointer"
              )}
            >
              <div className="flex items-center gap-2">
                {isSelected && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pitch-500 text-white text-xs font-bold">
                    {rank}
                  </span>
                )}
                <span>{labelTeam(team)}</span>
              </div>
              {odds !== null && (
                <span className="text-xs text-slate-400">{odds.toFixed(2)}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Save button */}
      {!locked && (
        <Button
          size="sm"
          className="w-full"
          onClick={handleSave}
          disabled={selected.length !== 2 || saving}
          loading={saving}
          variant={saved ? "secondary" : "default"}
        >
          {saved
            ? (locale === "sv" ? "✓ Sparat" : "✓ Saved")
            : selected.length < 2
              ? (locale === "sv" ? `Välj ${2 - selected.length} lag till` : `Select ${2 - selected.length} more`)
              : (locale === "sv" ? "Spara tips" : "Save tip")}
        </Button>
      )}

      {/* Points earned */}
      {existingTip?.pointsEarned != null && (
        <div className="text-right text-xs font-semibold text-pitch-600">
          +{formatPoints(Number(existingTip.pointsEarned))} p
        </div>
      )}
    </div>
  );
}
