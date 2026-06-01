// components/admin/AdminResultForm.tsx  — designsystem-styling
"use client";

import { useState, useTransition } from "react";
import { setMatchResult } from "@/lib/actions/admin";
import { stageLabel } from "@/lib/utils";

type Team = {
  id: string;
  nameSv: string;
  nameEn: string;
  fifaCode: string;
};

type MatchWithTeams = {
  id: string;
  matchNumber: number;
  stage: string;
  scheduledAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
};

interface AdminResultFormProps {
  match: MatchWithTeams;
  locale: string;
}

export function AdminResultForm({ match, locale }: AdminResultFormProps) {
  const isSv = locale === "sv";
  const isFinished = match.status === "FINISHED";

  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const homeName = match.homeTeam
    ? isSv
      ? match.homeTeam.nameSv
      : match.homeTeam.nameEn
    : isSv
      ? "Hemmalag"
      : "Home team";
  const awayName = match.awayTeam
    ? isSv
      ? match.awayTeam.nameSv
      : match.awayTeam.nameEn
    : isSv
      ? "Bortalag"
      : "Away team";

  const hasChanged =
    homeScore !== (match.homeScore?.toString() ?? "") ||
    awayScore !== (match.awayScore?.toString() ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (homeScore === "" || awayScore === "") return;
    setError("");
    setSaved(false);

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

  // Border color based on state
  const borderColor = saved
    ? "var(--green)"
    : isFinished && hasChanged
      ? "var(--stamp-red)"
      : "var(--hairline)";

  const bgColor = saved
    ? "rgba(0, 98, 65, 0.04)"
    : isFinished
      ? "rgba(203, 162, 88, 0.05)"
      : "#fff";

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: "var(--r-input)",
        border: `1px solid ${borderColor}`,
        background: bgColor,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Match number */}
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontWeight: 700,
          fontSize: 12,
          color: "var(--ink-faint)",
          width: 28,
          flexShrink: 0,
        }}
      >
        {String(match.matchNumber).padStart(2, "0")}
      </span>

      {/* Stage label */}
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: 9.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-faint)",
          width: 80,
          flexShrink: 0,
          display: "none", // visas på sm:
        }}
        className="hidden sm:block"
      >
        {stageLabel(match.stage, locale)}
      </span>

      {/* Correction badge */}
      {isFinished && !saved && (
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--gold)",
            border: "1px solid var(--gold-soft)",
            borderRadius: "var(--r-pill)",
            padding: "2px 8px",
            flexShrink: 0,
          }}
        >
          {isSv ? "Korrigering" : "Correction"}
        </span>
      )}

      {/* Teams + score inputs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Home team */}
        <span
          style={{
            fontFamily: "var(--f-serif)",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
            flex: 1,
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {homeName}
        </span>

        {/* Home score */}
        <input
          type="number"
          min={0}
          max={30}
          value={homeScore}
          onChange={(e) => {
            setHomeScore(e.target.value);
            setSaved(false);
          }}
          placeholder="0"
          required
          style={{
            width: 48,
            textAlign: "center",
            fontFamily: "var(--f-mono)",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--green-deep)",
            background: "var(--cream)",
            border: "1px solid var(--coupon-rule-soft)",
            borderRadius: "var(--r-input)",
            padding: "6px 4px",
            outline: "none",
          }}
        />

        <span
          style={{
            fontFamily: "var(--f-display)",
            fontStyle: "italic",
            color: "var(--ink-faint)",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          –
        </span>

        {/* Away score */}
        <input
          type="number"
          min={0}
          max={30}
          value={awayScore}
          onChange={(e) => {
            setAwayScore(e.target.value);
            setSaved(false);
          }}
          placeholder="0"
          required
          style={{
            width: 48,
            textAlign: "center",
            fontFamily: "var(--f-mono)",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--green-deep)",
            background: "var(--cream)",
            border: "1px solid var(--coupon-rule-soft)",
            borderRadius: "var(--r-input)",
            padding: "6px 4px",
            outline: "none",
          }}
        />

        {/* Away team */}
        <span
          style={{
            fontFamily: "var(--f-serif)",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {awayName}
        </span>
      </div>

      {/* Save button */}
      <button
        type="submit"
        disabled={isPending}
        style={{
          fontFamily: "var(--f-sans)",
          fontWeight: 600,
          fontSize: 12,
          padding: "7px 16px",
          borderRadius: "var(--r-pill)",
          border: "none",
          cursor: isPending ? "default" : "pointer",
          flexShrink: 0,
          transition: "all 0.15s",
          background: saved
            ? "var(--green-pale)"
            : isFinished && hasChanged
              ? "var(--stamp-red)"
              : "var(--green-cta)",
          color: saved ? "var(--green-deep)" : "white",
        }}
      >
        {isPending
          ? "…"
          : saved
            ? isSv
              ? "✓ Sparat"
              : "✓ Saved"
            : isFinished
              ? isSv
                ? "Rätta"
                : "Correct"
              : isSv
                ? "Spara"
                : "Save"}
      </button>

      {error && (
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            color: "var(--stamp-red)",
            flexShrink: 0,
          }}
        >
          {error}
        </span>
      )}
    </form>
  );
}
