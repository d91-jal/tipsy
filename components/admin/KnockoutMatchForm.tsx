// components/admin/KnockoutMatchForm.tsx  — designsystem-styling
"use client";

import { useState, useTransition } from "react";
import { setKnockoutMatchTeams, setMatchOdds } from "@/lib/actions/admin";

type TeamOption = {
  id: string;
  nameSv: string;
  nameEn: string;
  groupName: string;
};

type MatchOdds = {
  outcome: "HOME" | "DRAW" | "AWAY";
  avgValue: number;
};

type KnockoutMatch = {
  id: string;
  matchNumber: number;
  stage: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  odds: MatchOdds[];
};

const STAGE_LABELS: Record<string, { sv: string; en: string }> = {
  ROUND_OF_32: { sv: "16-delsfinal", en: "Round of 32" },
  ROUND_OF_16: { sv: "Åttondelsfinal", en: "Round of 16" },
  QUARTER_FINAL: { sv: "Kvartsfinal", en: "Quarter-final" },
  SEMI_FINAL: { sv: "Semifinal", en: "Semi-final" },
  THIRD_PLACE: { sv: "Bronsmatch", en: "Third place" },
  FINAL: { sv: "Final", en: "Final" },
};

export function KnockoutMatchForm({
  match,
  teams,
  locale,
}: {
  match: KnockoutMatch;
  teams: TeamOption[];
  locale: string;
}) {
  const isSv = locale === "sv";

  const [homeTeamId, setHomeTeamId] = useState(match.homeTeamId ?? "");
  const [awayTeamId, setAwayTeamId] = useState(match.awayTeamId ?? "");
  const [home, setHome] = useState(
    match.odds.find((o) => o.outcome === "HOME")?.avgValue?.toString() ?? "",
  );
  const [draw, setDraw] = useState(
    match.odds.find((o) => o.outcome === "DRAW")?.avgValue?.toString() ?? "",
  );
  const [away, setAway] = useState(
    match.odds.find((o) => o.outcome === "AWAY")?.avgValue?.toString() ?? "",
  );
  const [source, setSource] = useState("Unibet");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const teamsSet = Boolean(match.homeTeamId && match.awayTeamId);
  const oddsSet = match.odds.length > 0;

  const stageLabel =
    STAGE_LABELS[match.stage]?.[isSv ? "sv" : "en"] ?? match.stage;

  function dirty() {
    setSaved(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!homeTeamId || !awayTeamId) {
      setError(isSv ? "Välj båda lagen" : "Pick both teams");
      return;
    }
    if (homeTeamId === awayTeamId) {
      setError(isSv ? "Lagen måste vara olika" : "Teams must differ");
      return;
    }

    const hasOdds = home !== "" || draw !== "" || away !== "";
    const allOdds = home !== "" && draw !== "" && away !== "";
    if (hasOdds && !allOdds) {
      setError(isSv ? "Fyll i alla tre odds" : "Fill in all three odds");
      return;
    }

    startTransition(async () => {
      try {
        const teamsFd = new FormData();
        teamsFd.append("matchId", match.id);
        teamsFd.append("homeTeamId", homeTeamId);
        teamsFd.append("awayTeamId", awayTeamId);
        await setKnockoutMatchTeams(teamsFd);

        if (allOdds) {
          const oddsFd = new FormData();
          oddsFd.append("matchId", match.id);
          oddsFd.append("homeOdds", home);
          oddsFd.append("drawOdds", draw);
          oddsFd.append("awayOdds", away);
          oddsFd.append("source", source);
          await setMatchOdds(oddsFd);
        }

        setSaved(true);
      } catch (err: any) {
        setError(err?.message ?? "Error");
      }
    });
  }

  const selectStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    fontFamily: "var(--f-sans)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
    background: "var(--cream)",
    border: "1px solid var(--coupon-rule-soft)",
    borderRadius: "var(--r-input)",
    padding: "7px 8px",
    outline: "none",
  };

  const oddsInputStyle: React.CSSProperties = {
    width: 64,
    textAlign: "center",
    fontFamily: "var(--f-mono)",
    fontWeight: 600,
    fontSize: 16,
    color: "var(--green-deep)",
    background: "var(--cream)",
    border: "1px solid var(--coupon-rule-soft)",
    borderRadius: "var(--r-input)",
    padding: "6px 4px",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--f-mono)",
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--ink-faint)",
  };

  const complete = saved || (teamsSet && oddsSet);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "12px 16px",
        borderRadius: "var(--r-input)",
        border: `1px solid ${complete ? "var(--green)" : "var(--hairline)"}`,
        background: complete ? "rgba(0,98,65,0.04)" : "#fff",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontWeight: 700,
            fontSize: 11,
            color: "var(--ink-faint)",
          }}
        >
          #{match.matchNumber} · {stageLabel}
        </span>
        {complete && (
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--green)",
              border: "1px solid var(--green-pale)",
              borderRadius: "var(--r-pill)",
              padding: "2px 8px",
            }}
          >
            ✓ {saved ? (isSv ? "Sparat" : "Saved") : isSv ? "Klar" : "Set"}
          </span>
        )}
      </div>

      {/* Team selectors */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <select
          value={homeTeamId}
          onChange={(e) => {
            setHomeTeamId(e.target.value);
            dirty();
          }}
          style={selectStyle}
        >
          <option value="">{isSv ? "— Hemmalag —" : "— Home team —"}</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.groupName} · {isSv ? t.nameSv : t.nameEn}
            </option>
          ))}
        </select>
        <span
          style={{
            fontFamily: "var(--f-serif)",
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--ink-faint)",
          }}
        >
          vs
        </span>
        <select
          value={awayTeamId}
          onChange={(e) => {
            setAwayTeamId(e.target.value);
            dirty();
          }}
          style={selectStyle}
        >
          <option value="">{isSv ? "— Bortalag —" : "— Away team —"}</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.groupName} · {isSv ? t.nameSv : t.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Odds inputs */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {(
          [
            ["1", home, setHome, "2.10"],
            ["X", draw, setDraw, "3.20"],
            ["2", away, setAway, "3.80"],
          ] as const
        ).map(([label, val, setter, placeholder]) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <label style={labelStyle}>{label}</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              max="99"
              value={val}
              onChange={(e) => {
                setter(e.target.value);
                dirty();
              }}
              placeholder={placeholder}
              style={oddsInputStyle}
            />
          </div>
        ))}

        {/* Source */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>{isSv ? "Källa" : "Source"}</label>
          <input
            type="text"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              dirty();
            }}
            placeholder="Unibet"
            style={{
              ...oddsInputStyle,
              width: 90,
              textAlign: "left",
              padding: "6px 10px",
              fontFamily: "var(--f-sans)",
              fontSize: 13,
            }}
          />
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={isPending}
          style={{
            marginLeft: "auto",
            fontFamily: "var(--f-sans)",
            fontWeight: 600,
            fontSize: 12,
            padding: "8px 18px",
            borderRadius: "var(--r-pill)",
            border: "none",
            cursor: isPending ? "default" : "pointer",
            background: saved ? "var(--green-pale)" : "var(--green-cta)",
            color: saved ? "var(--green-deep)" : "white",
            transition: "all 0.15s",
          }}
        >
          {isPending
            ? "…"
            : saved
              ? isSv
                ? "✓ Sparat"
                : "✓ Saved"
              : isSv
                ? "Spara"
                : "Save"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            color: "var(--stamp-red)",
          }}
        >
          {error}
        </div>
      )}
    </form>
  );
}
