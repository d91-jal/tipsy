// components/tips/CouponMatchRow.tsx
// A single match row inside a .coupon — replaces GroupMatchCard.
// Uses the design system's .match-row / .cell / .picked CSS classes.
"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { submitMatchTip } from "@/lib/actions/tips";
import type { MatchTipState } from "@/lib/actions/tips";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui";

type Outcome = "HOME" | "DRAW" | "AWAY";

type Odds = { outcome: Outcome; avgValue: number };

type Match = {
  id: string;
  matchNumber: number;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeTeam: { nameSv: string; nameEn: string; fifaCode: string } | null;
  awayTeam: { nameSv: string; nameEn: string; fifaCode: string } | null;
  odds: Odds[];
  matchTips: { prediction: Outcome; pointsEarned: number | null }[];
};

interface CouponMatchRowProps {
  match: Match;
  rowIndex: number; // 1-based display number within group
  locale: string;
}

const initialState: MatchTipState = { success: false };

export function CouponMatchRow({
  match,
  rowIndex,
  locale,
}: CouponMatchRowProps) {
  const [state, formAction] = useFormState(submitMatchTip, initialState);
  const [, startTransition] = useTransition();

  const [currentPick, setCurrentPick] = useState<Outcome | null>(
    match.matchTips[0]?.prediction ?? null,
  );

  const { toast } = useToast();
  const isSv = locale === "sv";

  useEffect(() => {
    if (state.error) {
      const msg =
        state.error === "DEADLINE_PASSED"
          ? isSv
            ? "Tips stängt — deadline har passerat"
            : "Tips closed — deadline passed"
          : state.error === "NOT_AUTHENTICATED"
            ? isSv
              ? "Du är inte inloggad"
              : "Not signed in"
            : isSv
              ? "Kunde inte spara tipset"
              : "Could not save tip";
      toast(msg, "error");
    }
  }, [state.error]);

  const finished = match.status === "FINISHED";
  const locked = new Date() > new Date(match.tipDeadline ?? match.scheduledAt);

  const actualOutcome: Outcome | null =
    match.homeScore !== null && match.awayScore !== null
      ? match.homeScore > match.awayScore
        ? "HOME"
        : match.awayScore > match.homeScore
          ? "AWAY"
          : "DRAW"
      : null;

  const getOdds = (o: Outcome) =>
    match.odds.find((x) => x.outcome === o)?.avgValue ?? null;

  function handlePick(outcome: Outcome) {
    if (locked || finished) return;

    const previousPick = currentPick; // spara för rollback
    setCurrentPick(outcome); // optimistisk uppdatering

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("matchId", match.id);
        fd.append("prediction", outcome);
        await formAction(fd);
      } catch {
        // Nätverksfel — återställ till föregående val
        setCurrentPick(previousPick);
        toast(
          isSv
            ? "Nätverksfel — tipset sparades inte"
            : "Network error — tip not saved",
          "error",
        );
      }
    });
  }

  const homeName = isSv ? match.homeTeam?.nameSv : match.homeTeam?.nameEn;
  const awayName = isSv ? match.awayTeam?.nameSv : match.awayTeam?.nameEn;

  // Format date — day/month + time
  const dt = new Date(match.scheduledAt);
  const dateStr = dt
    .toLocaleDateString(isSv ? "sv-SE" : "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
    })
    .toUpperCase();
  const timeStr = dt.toLocaleTimeString(isSv ? "sv-SE" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const CELLS: { outcome: Outcome; mark: string }[] = [
    { outcome: "HOME", mark: "1" },
    { outcome: "DRAW", mark: "x" },
    { outcome: "AWAY", mark: "2" },
  ];

  return (
    <div className={cn("match-row", finished && "opacity-90")}>
      {/* Row number */}
      <div className="rownum">{String(rowIndex).padStart(2, "0")}</div>

      {/* Teams + meta */}
      <div className="teams">
        <div className="pair">
          {homeName}
          <span
            style={{
              color: "rgba(0,0,0,0.3)",
              fontStyle: "italic",
              margin: "0 6px",
            }}
          >
            –
          </span>
          {awayName}
        </div>
        <div className="meta">
          <span>
            {dateStr} · {timeStr}
          </span>
          {finished && match.homeScore !== null && (
            <>
              <span style={{ margin: "0 6px", opacity: 0.3 }}>|</span>
              <span style={{ fontWeight: 700 }}>
                {match.homeScore}–{match.awayScore}
              </span>
            </>
          )}
          {!finished && (
            <>
              <span style={{ margin: "0 6px", opacity: 0.3 }}>|</span>
              <span style={{ opacity: 0.5 }}>
                {getOdds("HOME")?.toFixed(2)} / {getOdds("DRAW")?.toFixed(2)} /{" "}
                {getOdds("AWAY")?.toFixed(2)}
              </span>
            </>
          )}
          {locked && !finished && (
            <>
              <span style={{ margin: "0 6px", opacity: 0.3 }}>|</span>
              <span
                style={{ color: "var(--stamp-red)", letterSpacing: "0.14em" }}
              >
                {isSv ? "STÄNGT" : "CLOSED"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 1 · X · 2 cells */}
      {CELLS.map(({ outcome, mark }) => {
        const isPicked = currentPick === outcome;
        const isCorrect = finished && actualOutcome === outcome;
        const isMiss = finished && isPicked && actualOutcome !== outcome;

        return (
          <div
            key={outcome}
            onClick={() => handlePick(outcome)}
            className={cn(
              "cell",
              isPicked && "picked",
              // For finished matches: tint correct cells gold, missed cells red
              isCorrect && !isPicked && "bg-[rgba(203,162,88,0.15)]",
              isMiss && "opacity-40",
              (locked || finished) && "cursor-default",
            )}
            title={locked ? (isSv ? "Tips stängt" : "Tips closed") : undefined}
          >
            <span
              className={cn(
                "mark",
                isCorrect && "text-[var(--green-deep)]",
                isMiss && "line-through",
              )}
            >
              {mark}
            </span>

            {/* Points earned badge — top right of cell */}
            {finished &&
              isPicked &&
              match.matchTips[0]?.pointsEarned != null && (
                <span
                  className="absolute top-1 right-1 font-mono text-[9px] leading-none"
                  style={{
                    color:
                      match.matchTips[0].pointsEarned > 0
                        ? "var(--green)"
                        : "rgba(0,0,0,0.35)",
                  }}
                >
                  {match.matchTips[0].pointsEarned > 0
                    ? `+${Number(match.matchTips[0].pointsEarned).toFixed(1)}`
                    : "0"}
                </span>
              )}
          </div>
        );
      })}
    </div>
  );
}
