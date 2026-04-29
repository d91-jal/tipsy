// components/tips/GroupMatchCard.tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { useFormState as useActionState } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { submitMatchTip } from "@/lib/actions/tips";
import type { MatchTipState } from "@/lib/actions/tips";
import { cn, formatDate, formatPoints, isDeadlinePassed } from "@/lib/utils";
import { Badge } from "@/components/ui";
import type { Prisma } from "@prisma/client";

type MatchWithRelations = Prisma.MatchGetPayload<{
  include: {
    homeTeam: true;
    awayTeam: true;
    odds: true;
    matchTips: true;
  };
}>;

type Outcome = "HOME" | "DRAW" | "AWAY";

interface GroupMatchCardProps {
  match: MatchWithRelations;
  existingTip: { prediction: Outcome } | null;
  locale: string;
}

const initialState: MatchTipState = { success: false };

export function GroupMatchCard({
  match,
  existingTip,
  locale,
}: GroupMatchCardProps) {
  const t = useTranslations();
  const [state, action] = useActionState(submitMatchTip, initialState);
  const [optimisticTip, setOptimisticTip] = useOptimistic(
    existingTip?.prediction ?? null,
  );
  const [, startTransition] = useTransition();

  const deadline = new Date(match.tipDeadline);
  const locked = isDeadlinePassed(deadline);
  const finished = match.status === "FINISHED";
  const hasResult = match.homeScore !== null && match.awayScore !== null;

  const getOdds = (outcome: Outcome) => {
    const o = match.odds.find((x) => x.outcome === outcome);
    return o ? Number(o.avgValue) : null;
  };

  const actualOutcome: Outcome | null = hasResult
    ? match.homeScore! > match.awayScore!
      ? "HOME"
      : match.homeScore! < match.awayScore!
        ? "AWAY"
        : "DRAW"
    : null;

  const buttons: { outcome: Outcome; labelKey: string; shortLabel: string }[] =
    [
      { outcome: "HOME", labelKey: "prediction.home", shortLabel: "1" },
      { outcome: "DRAW", labelKey: "prediction.draw", shortLabel: "X" },
      { outcome: "AWAY", labelKey: "prediction.away", shortLabel: "2" },
    ];

  function handleSelect(outcome: Outcome) {
    if (locked || finished) return;
    startTransition(async () => {
      setOptimisticTip(outcome);
      const fd = new FormData();
      fd.append("matchId", match.id);
      fd.append("prediction", outcome);
      await action(fd);
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 transition-all",
        finished
          ? "border-slate-100 bg-slate-50/50"
          : "border-slate-200 hover:border-slate-300",
      )}
    >
      {/* Match header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">
          #{match.matchNumber} · {formatDate(match.scheduledAt, locale)}
        </span>
        <div className="flex items-center gap-2">
          {finished && (
            <Badge variant="success">
              {match.homeScore}–{match.awayScore}
            </Badge>
          )}
          {locked && !finished && (
            <Badge variant="muted">{t("match.deadlinePassed")}</Badge>
          )}
          {optimisticTip && !finished && (
            <Badge variant="default" className="bg-pitch-50 text-pitch-700">
              ✓{" "}
              {optimisticTip === "HOME"
                ? "1"
                : optimisticTip === "DRAW"
                  ? "X"
                  : "2"}
            </Badge>
          )}
        </div>
      </div>

      {/* Teams + buttons */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex-1 text-right">
          <span className="font-semibold text-slate-800 text-sm">
            {locale === "sv" ? match.homeTeam?.nameSv : match.homeTeam?.nameEn}
          </span>
        </div>

        {/* 1 X 2 buttons */}
        <div className="flex gap-1 shrink-0">
          {buttons.map(({ outcome, shortLabel }) => {
            const odds = getOdds(outcome);
            const isSelected = optimisticTip === outcome;
            const isCorrect = actualOutcome === outcome;
            const isWrong = finished && isSelected && !isCorrect;

            return (
              <button
                key={outcome}
                onClick={() => handleSelect(outcome)}
                disabled={locked || finished}
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-12 rounded-lg border text-sm font-bold transition-all",
                  "disabled:cursor-default",
                  isSelected &&
                    !finished &&
                    "border-pitch-500 bg-pitch-50 text-pitch-700",
                  !isSelected &&
                    !finished &&
                    !locked &&
                    "border-slate-200 text-slate-600 hover:border-pitch-300 hover:bg-pitch-50/50 cursor-pointer",
                  !isSelected &&
                    (finished || locked) &&
                    "border-slate-100 text-slate-300",
                  isCorrect &&
                    finished &&
                    "border-green-500 bg-green-50 text-green-700",
                  isWrong &&
                    "border-red-300 bg-red-50 text-red-500 line-through",
                )}
              >
                <span>{shortLabel}</span>
                {odds !== null && (
                  <span className="text-[10px] font-normal text-slate-400">
                    {odds.toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Away team */}
        <div className="flex-1">
          <span className="font-semibold text-slate-800 text-sm">
            {locale === "sv" ? match.awayTeam?.nameSv : match.awayTeam?.nameEn}
          </span>
        </div>
      </div>

      {/* Points earned */}
      {finished && match.matchTips?.[0]?.pointsEarned != null && (
        <div className="mt-2 text-right">
          <span
            className={cn(
              "text-xs font-semibold",
              Number(match.matchTips[0].pointsEarned) > 0
                ? "text-pitch-600"
                : "text-slate-400",
            )}
          >
            {Number(match.matchTips[0].pointsEarned) > 0
              ? `+${formatPoints(Number(match.matchTips[0].pointsEarned))} p`
              : "0 p"}
          </span>
        </div>
      )}
    </div>
  );
}
