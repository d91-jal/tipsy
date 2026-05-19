// components/competitions/ResultsView.tsx
"use client";

import { useState } from "react";
import { stageLabel } from "@/lib/utils";
import type { GroupTableData } from "@/components/competitions/GroupTable";
import { GroupTablesGrid } from "@/components/competitions/GroupTable";

type Team = {
  nameSv: string;
  nameEn: string;
  fifaCode: string;
  flagUrl: string | null;
};
type Match = {
  id: string;
  matchNumber: number;
  stage: string;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
};

type Props = {
  matches: Match[];
  groupStandings: GroupTableData[];
  locale: string;
};

type Tab = "matches" | "tables";

const STAGE_ORDER = [
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

export function ResultsView({ matches, groupStandings, locale }: Props) {
  const [tab, setTab] = useState<Tab>("matches");
  const isSv = locale === "sv";

  const tabs: { key: Tab; label: string }[] = [
    { key: "matches", label: isSv ? "Matchlista" : "Matches" },
    { key: "tables", label: isSv ? "Tabeller" : "Tables" },
  ];

  // Group matches by stage
  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    label: stageLabel(stage, locale),
    matches: matches.filter((m) => m.stage === stage),
  })).filter((s) => s.matches.length > 0);

  const finished = matches.filter((m) => m.status === "FINISHED").length;
  const total = matches.filter((m) => m.homeTeam && m.awayTeam).length;

  function tn(team: Team | null) {
    return locale === "sv" ? team?.nameSv : team?.nameEn;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            VM 2026
          </p>
          <h1
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: "clamp(26px, 4vw, 40px)",
              letterSpacing: "-0.02em",
              color: "var(--green-deep)",
              margin: 0,
            }}
          >
            {isSv ? "Resultat." : "Results."}
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: 4,
            }}
          >
            {isSv ? "Spelade matcher" : "Matches played"}
          </div>
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: 32,
              lineHeight: 1,
              color: "var(--green-deep)",
            }}
          >
            <span style={{ color: "var(--gold)", fontStyle: "italic" }}>
              {finished}
            </span>
            <span style={{ color: "rgba(30,57,50,0.3)" }}> / {total}</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{ display: "flex", borderBottom: "2px solid var(--hairline)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 24px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: tab === t.key ? "var(--green-deep)" : "var(--ink-faint)",
              borderBottom:
                tab === t.key
                  ? "2px solid var(--green)"
                  : "2px solid transparent",
              marginBottom: -2,
              transition: "color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Match list ────────────────────────────────────────────── */}
      {tab === "matches" && (
        <div className="space-y-6">
          {byStage.map(({ stage, label, matches: stageMatches }) => (
            <div key={stage}>
              <p className="eyebrow" style={{ marginBottom: 10 }}>
                {label}
              </p>
              <div
                style={{
                  borderRadius: "var(--r-card)",
                  overflow: "hidden",
                  boxShadow: "var(--sh-card)",
                }}
              >
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr 100px 80px",
                    background: "var(--green-deep)",
                    color: "var(--gold)",
                    padding: "8px 20px",
                    fontFamily: "var(--f-mono)",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>#</span>
                  <span>{isSv ? "Match" : "Match"}</span>
                  <span style={{ textAlign: "center" }}>
                    {isSv ? "Resultat" : "Result"}
                  </span>
                  <span style={{ textAlign: "right" }}>
                    {isSv ? "Datum" : "Date"}
                  </span>
                </div>

                {stageMatches.map((match, idx) => {
                  const finished = match.status === "FINISHED";
                  const dt = new Date(match.scheduledAt);
                  const dateStr = dt.toLocaleDateString(
                    isSv ? "sv-SE" : "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                    },
                  );
                  const timeStr = dt.toLocaleTimeString(
                    isSv ? "sv-SE" : "en-GB",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );

                  return (
                    <div
                      key={match.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "36px 1fr 100px 80px",
                        padding: "13px 20px",
                        alignItems: "center",
                        borderTop:
                          idx > 0 ? "1px solid var(--hairline)" : "none",
                        background: finished
                          ? idx % 2 === 0
                            ? "#fff"
                            : "var(--cream)"
                          : idx % 2 === 0
                            ? "var(--paper)"
                            : "var(--cream)",
                      }}
                    >
                      {/* Nr */}
                      <span
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontSize: 11,
                          color: "var(--ink-faint)",
                          fontWeight: 700,
                        }}
                      >
                        {String(match.matchNumber).padStart(2, "0")}
                      </span>

                      {/* Teams */}
                      <div>
                        {match.homeTeam && match.awayTeam ? (
                          <span
                            style={{
                              fontFamily: "var(--f-serif)",
                              fontWeight: 600,
                              fontSize: 15,
                              letterSpacing: "-0.01em",
                              color: "var(--ink)",
                            }}
                          >
                            {tn(match.homeTeam)}
                            <span
                              style={{
                                color: "var(--ink-faint)",
                                fontStyle: "italic",
                                margin: "0 8px",
                              }}
                            >
                              vs
                            </span>
                            {tn(match.awayTeam)}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--f-mono)",
                              fontSize: 10,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "var(--ink-faint)",
                            }}
                          >
                            {isSv ? "Lag ej fastställda" : "Teams TBD"}
                          </span>
                        )}
                      </div>

                      {/* Score */}
                      <div style={{ textAlign: "center" }}>
                        {finished ? (
                          <span
                            style={{
                              fontFamily: "var(--f-mono)",
                              fontWeight: 700,
                              fontSize: 16,
                              color: "var(--green-deep)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {match.homeScore}–{match.awayScore}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--f-mono)",
                              fontSize: 10,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "var(--ink-faint)",
                            }}
                          >
                            {timeStr}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--f-mono)",
                          fontSize: 10.5,
                          color: "var(--ink-faint)",
                        }}
                      >
                        {dateStr}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {byStage.length === 0 && (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                border: "1px dashed var(--hairline)",
                borderRadius: "var(--r-card)",
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
              }}
            >
              {isSv ? "Inga matcher spelade ännu" : "No matches played yet"}
            </div>
          )}
        </div>
      )}

      {/* ── Group tables ──────────────────────────────────────────── */}
      {tab === "tables" && (
        <GroupTablesGrid groups={groupStandings} locale={locale} />
      )}
    </div>
  );
}
