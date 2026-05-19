"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useEffect } from "react";
import { submitMatchTip } from "@/lib/actions/tips";
import type { MatchTipState } from "@/lib/actions/tips";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

type Outcome = "HOME" | "DRAW" | "AWAY";
type Odds = { outcome: Outcome; avgValue: number };

type Match = {
  id: string;
  matchNumber: number;
  scheduledAt: string;
  tipDeadline: string;
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
  locale: string;
}

const initialState: MatchTipState = { success: false };

export function CouponMatchRow({ match, locale }: CouponMatchRowProps) {
  const [state, formAction] = useFormState(submitMatchTip, initialState);
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  const existingPick = match.matchTips[0]?.prediction ?? null;
  const [currentPick, setCurrentPick] = useState<Outcome | null>(existingPick);

  const isSv = locale === "sv";
  const finished = match.status === "FINISHED";
  const locked = new Date() > new Date(match.tipDeadline);

  const actualOutcome: Outcome | null =
    match.homeScore !== null && match.awayScore !== null
      ? match.homeScore > match.awayScore
        ? "HOME"
        : match.awayScore > match.homeScore
          ? "AWAY"
          : "DRAW"
      : null;

  const getOdds = (o: Outcome): number | null =>
    match.odds.find((x) => x.outcome === o)?.avgValue ?? null;

  // Error toast
  useEffect(() => {
    if (state.error) {
      const msg =
        state.error === "DEADLINE_PASSED"
          ? isSv
            ? "Tips stängt — deadline har passerat"
            : "Tips closed — deadline passed"
          : isSv
            ? "Kunde inte spara tipset"
            : "Could not save tip";
      toast(msg, "error");
    }
  }, [state.error]);

  function handlePick(outcome: Outcome) {
    if (locked || finished) return;
    const previousPick = currentPick;
    setCurrentPick(outcome);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("matchId", match.id);
        fd.append("prediction", outcome);
        await formAction(fd);
      } catch {
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

  const homeNameFull = isSv ? match.homeTeam?.nameSv : match.homeTeam?.nameEn;
  const awayNameFull = isSv ? match.awayTeam?.nameSv : match.awayTeam?.nameEn;
  const homeCode = match.homeTeam?.fifaCode ?? "?";
  const awayCode = match.awayTeam?.fifaCode ?? "?";

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
    { outcome: "DRAW", mark: "X" },
    { outcome: "AWAY", mark: "2" },
  ];

  const hasOdds = match.odds.length > 0;

  return (
    <div className="match-row">
      {/* Row number — använder matchnummer från databasen */}
      <div className="rownum">{String(match.matchNumber).padStart(2, "0")}</div>

      {/* Teams */}
      <div className="teams">
        {/* Full name — döljs på mobil via CSS */}
        <div className="pair-full">
          {homeNameFull}
          <span
            style={{
              color: "rgba(0,0,0,0.3)",
              fontStyle: "italic",
              margin: "0 5px",
            }}
          >
            –
          </span>
          {awayNameFull}
        </div>

        {/* FIFA-koder — visas på mobil via CSS */}
        <div className="pair-short">
          {homeCode}
          <span style={{ color: "rgba(0,0,0,0.35)", margin: "0 4px" }}>–</span>
          {awayCode}
        </div>

        {/* Meta */}
        <div className="meta">
          <span>
            {dateStr} · {timeStr}
          </span>
          {finished && match.homeScore !== null && (
            <>
              <span style={{ margin: "0 5px", opacity: 0.3 }}>|</span>
              <span style={{ fontWeight: 700 }}>
                {match.homeScore}–{match.awayScore}
              </span>
            </>
          )}
          {locked && !finished && (
            <>
              <span style={{ margin: "0 5px", opacity: 0.3 }}>|</span>
              <span
                style={{ color: "var(--stamp-red)", letterSpacing: "0.12em" }}
              >
                {isSv ? "STÄNGT" : "CLOSED"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 1 · X · 2 cells — med odds under symbolen */}
      {CELLS.map(({ outcome, mark }) => {
        const isPicked = currentPick === outcome;
        const isCorrect = finished && actualOutcome === outcome;
        const isMiss = finished && isPicked && actualOutcome !== outcome;
        const odds = getOdds(outcome);

        return (
          <div
            key={outcome}
            onClick={() => handlePick(outcome)}
            className={cn(
              "cell",
              isPicked && "picked",
              isCorrect && !isPicked && "bg-[rgba(203,162,88,0.15)]",
              isMiss && "opacity-40",
              (locked || finished) && "cursor-default",
            )}
            style={{
              // Taller cell when odds are shown
              flexDirection: "column",
              gap: hasOdds ? 2 : 0,
              paddingTop: hasOdds ? 8 : 0,
              paddingBottom: hasOdds ? 8 : 0,
            }}
          >
            {/* 1 / X / 2 symbol */}
            <span
              className={cn(
                "mark",
                isCorrect && "text-[var(--green-deep)]",
                isMiss && "line-through",
              )}
            >
              {mark}
            </span>

            {/* Odds — visas alltid om tillgängliga */}
            {odds !== null && (
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 9,
                  lineHeight: 1,
                  letterSpacing: "0.04em",
                  color: isPicked
                    ? "var(--green)"
                    : isCorrect
                      ? "var(--green)"
                      : "rgba(0,0,0,0.38)",
                  fontWeight: isPicked ? 700 : 400,
                  transition: "color 0.15s",
                }}
              >
                {odds.toFixed(2)}
              </span>
            )}

            {/* Intjänade poäng — visas i övre hörnet efter match */}
            {finished &&
              isPicked &&
              match.matchTips[0]?.pointsEarned != null && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    fontFamily: "var(--f-mono)",
                    fontSize: 8,
                    lineHeight: 1,
                    color:
                      match.matchTips[0].pointsEarned > 0
                        ? "var(--green)"
                        : "rgba(0,0,0,0.3)",
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
