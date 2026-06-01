// components/admin/OddsForm.tsx  — designsystem-styling
"use client";

import { useState, useTransition } from "react";
import { setMatchOdds } from "@/lib/actions/admin";

type Team = {
  id: string;
  nameSv: string;
  nameEn: string;
  fifaCode: string;
};

type MatchOdds = {
  outcome: "HOME" | "DRAW" | "AWAY";
  avgValue: number;
};

type MatchWithOdds = {
  id: string;
  matchNumber: number;
  stage: string;
  scheduledAt: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  odds: MatchOdds[];
};

interface AdminOddsFormProps {
  match: MatchWithOdds;
  locale: string;
  adminId: string;
}

export function OddsForm({ match, locale, adminId }: AdminOddsFormProps) {
  const isSv = locale === "sv";

  const existing = {
    home:
      match.odds.find((o) => o.outcome === "HOME")?.avgValue?.toString() ?? "",
    draw:
      match.odds.find((o) => o.outcome === "DRAW")?.avgValue?.toString() ?? "",
    away:
      match.odds.find((o) => o.outcome === "AWAY")?.avgValue?.toString() ?? "",
  };

  const [home, setHome] = useState(existing.home);
  const [draw, setDraw] = useState(existing.draw);
  const [away, setAway] = useState(existing.away);
  const [source, setSource] = useState("Unibet");
  const [saved, setSaved] = useState(match.odds.length > 0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const homeName = match.homeTeam
    ? isSv
      ? match.homeTeam.nameSv
      : match.homeTeam.nameEn
    : "?";
  const awayName = match.awayTeam
    ? isSv
      ? match.awayTeam.nameSv
      : match.awayTeam.nameEn
    : "?";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("matchId", match.id);
        fd.append("homeOdds", home);
        fd.append("drawOdds", draw);
        fd.append("awayOdds", away);
        fd.append("source", source);
        fd.append("adminId", adminId);
        await setMatchOdds(fd);
        setSaved(true);
      } catch (err: any) {
        setError(err.message ?? "Error");
      }
    });
  }

  const inputStyle: React.CSSProperties = {
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

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "12px 16px",
        borderRadius: "var(--r-input)",
        border: `1px solid ${saved ? "var(--green)" : "var(--hairline)"}`,
        background: saved ? "rgba(0,98,65,0.04)" : "#fff",
        transition: "border-color 0.15s",
      }}
    >
      {/* Match header */}
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
            fontFamily: "var(--f-serif)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--ink)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontWeight: 700,
              fontSize: 11,
              color: "var(--ink-faint)",
              marginRight: 8,
            }}
          >
            #{match.matchNumber}
          </span>
          {homeName}
          <span
            style={{
              color: "var(--ink-faint)",
              fontStyle: "italic",
              margin: "0 8px",
            }}
          >
            vs
          </span>
          {awayName}
        </span>
        {saved && (
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
            ✓ {isSv ? "Odds satta" : "Odds set"}
          </span>
        )}
      </div>

      {/* Odds inputs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* 1 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <label
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
            }}
          >
            1
          </label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            max="99"
            value={home}
            onChange={(e) => {
              setHome(e.target.value);
              setSaved(false);
            }}
            placeholder="2.10"
            required
            style={inputStyle}
          />
        </div>

        {/* X */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <label
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
            }}
          >
            X
          </label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            max="99"
            value={draw}
            onChange={(e) => {
              setDraw(e.target.value);
              setSaved(false);
            }}
            placeholder="3.20"
            required
            style={inputStyle}
          />
        </div>

        {/* 2 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <label
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
            }}
          >
            2
          </label>
          <input
            type="number"
            step="0.01"
            min="1.01"
            max="99"
            value={away}
            onChange={(e) => {
              setAway(e.target.value);
              setSaved(false);
            }}
            placeholder="3.80"
            required
            style={inputStyle}
          />
        </div>

        {/* Source */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
            }}
          >
            {isSv ? "Källa" : "Source"}
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Unibet"
            style={{
              ...inputStyle,
              width: 90,
              textAlign: "left",
              padding: "6px 10px",
              fontFamily: "var(--f-sans)",
              fontSize: 13,
            }}
          />
        </div>

        {/* Save button */}
        <div style={{ marginTop: 18 }}>
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
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              color: "var(--stamp-red)",
              marginTop: 18,
            }}
          >
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
