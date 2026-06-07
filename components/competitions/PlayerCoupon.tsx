// components/competitions/PlayerCoupon.tsx  — Fas 3 redesign
// Results view: dark hero band + match-by-match coupon detail + stamps.
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Team = { id: string; nameSv: string; nameEn: string; fifaCode: string };
type Odds = { outcome: "HOME" | "DRAW" | "AWAY"; avgValue: number };
type MatchTip = {
  prediction: "HOME" | "DRAW" | "AWAY";
  pointsEarned: number | null;
};

type Match = {
  id: string;
  matchNumber: number;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  odds: Odds[];
  matchTips: MatchTip[];
};

type Group = { id: string; name: string; matches: Match[] };

type AdvancementTip = {
  groupId: string;
  group: { name: string };
  firstTeam: Team;
  secondTeam: Team;
  pointsEarned: number | null;
};

type TournamentTip = {
  finalist1: Team;
  finalist2: Team;
  winner: Team;
  pointsEarned: number | null;
} | null;

type Props = {
  groups: Group[];
  knockoutMatches: Match[];
  advancementTips: AdvancementTip[];
  tournamentTip: TournamentTip;
  locale: string;
};

type Tab = "group" | "knockout" | "advancement" | "tournament";

function actualOutcome(m: Match): "HOME" | "DRAW" | "AWAY" | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return "HOME";
  if (m.awayScore > m.homeScore) return "AWAY";
  return "DRAW";
}

function tn(team: Team | null, locale: string) {
  return locale === "sv" ? team?.nameSv : team?.nameEn;
}

// ─────────────────────────────────────────────────────────────────────────────
// PickChip — shows user's pick or actual result
// ─────────────────────────────────────────────────────────────────────────────
function PickChip({
  mark,
  hit,
  isActual,
}: {
  mark: string;
  hit: boolean;
  isActual?: boolean;
}) {
  if (isActual) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 4,
          fontFamily: "var(--f-display)",
          fontWeight: 600,
          fontSize: 16,
          fontStyle: "italic",
          background: "var(--gold)",
          color: "var(--green-deep)",
        }}
      >
        {mark}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 4,
        fontFamily: "var(--f-display)",
        fontWeight: 600,
        fontSize: 16,
        fontStyle: "italic",
        background: hit ? "var(--green-deep)" : "transparent",
        color: hit ? "var(--gold)" : "var(--stamp-red)",
        border: hit ? "none" : "1px dashed var(--stamp-red)",
      }}
    >
      {mark}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single match result row
// ─────────────────────────────────────────────────────────────────────────────
function MatchResultRow({
  match,
  idx,
  locale,
}: {
  match: Match;
  idx: number;
  locale: string;
}) {
  const tip = match.matchTips[0];
  const actual = actualOutcome(match);
  const finished = match.status === "FINISHED";
  const hit = tip && actual && tip.prediction === actual;

  const markOf = (o: "HOME" | "DRAW" | "AWAY") =>
    o === "HOME" ? "1" : o === "DRAW" ? "x" : "2";

  const pts = tip?.pointsEarned ?? null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr 80px 52px 52px 72px",
        padding: "14px 24px",
        alignItems: "center",
        borderTop: idx > 0 ? "1px solid var(--hairline)" : "none",
        background: hit ? "rgba(203, 162, 88, 0.07)" : "transparent",
      }}
    >
      {/* Nr */}
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontWeight: 700,
          fontSize: 12,
          color: "var(--ink-faint)",
        }}
      >
        {String(match.matchNumber).padStart(2, "0")}
      </span>

      {/* Match */}
      <div>
        <div
          style={{
            fontFamily: "var(--f-serif)",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
          }}
        >
          {tn(match.homeTeam, locale)}
          <span
            style={{
              color: "var(--ink-faint)",
              fontStyle: "italic",
              margin: "0 6px",
            }}
          >
            vs
          </span>
          {tn(match.awayTeam, locale)}
        </div>
        {finished && match.homeScore !== null && (
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--ink-soft)",
              marginTop: 2,
            }}
          >
            {match.homeScore}–{match.awayScore}
          </div>
        )}
      </div>

      {/* Points */}
      <div style={{ textAlign: "right" }}>
        {pts !== null ? (
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontWeight: 700,
              fontSize: 14,
              fontVariantNumeric: "tabular-nums",
              color: pts > 0 ? "var(--green)" : "var(--ink-faint)",
            }}
          >
            {pts > 0 ? `+${pts.toFixed(2)}` : "0"}
          </span>
        ) : (
          <span style={{ color: "var(--hairline)" }}>—</span>
        )}
      </div>

      {/* User's pick */}
      <div style={{ textAlign: "center" }}>
        {tip ? (
          <PickChip mark={markOf(tip.prediction)} hit={!!hit} />
        ) : (
          <span style={{ color: "var(--hairline)" }}>—</span>
        )}
      </div>

      {/* Actual */}
      <div style={{ textAlign: "center" }}>
        {actual ? (
          <PickChip mark={markOf(actual)} hit={false} isActual />
        ) : (
          <span style={{ color: "var(--hairline)" }}>—</span>
        )}
      </div>

      {/* Result pill */}
      <div style={{ textAlign: "right" }}>
        {finished &&
          tip &&
          (hit ? (
            <span className="pill pill-gold" style={{ fontSize: 9 }}>
              RÄTT
            </span>
          ) : (
            <span className="pill pill-red" style={{ fontSize: 9 }}>
              MISS
            </span>
          ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export function PlayerCoupon({
  groups,
  knockoutMatches,
  advancementTips,
  tournamentTip,
  locale,
}: Props) {
  const [tab, setTab] = useState<Tab>("group");
  const isSv = locale === "sv";

  // Stats
  const allGroupMatches = groups.flatMap((g) => g.matches);
  const allMatches = [...allGroupMatches, ...knockoutMatches];
  const finishedWithTip = allMatches.filter(
    (m) => m.status === "FINISHED" && m.matchTips[0],
  );
  const correct = finishedWithTip.filter((m) => {
    const tip = m.matchTips[0];
    const actual = actualOutcome(m);
    return tip && actual && tip.prediction === actual;
  }).length;
  const total = finishedWithTip.length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "group", label: isSv ? "Gruppspel" : "Group Stage" },
    { key: "advancement", label: isSv ? "Avancemang" : "Advancement" },
    { key: "knockout", label: isSv ? "Slutspel" : "Knockout" },
    { key: "tournament", label: isSv ? "Final" : "Final" },
  ];

  // Table header
  const tableHead = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr 80px 52px 52px 72px",
        background: "var(--green-deep)",
        color: "var(--gold)",
        padding: "10px 24px",
        fontFamily: "var(--f-mono)",
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        borderRadius: "var(--r-input) var(--r-input) 0 0",
      }}
    >
      <span>{isSv ? "Nr" : "No"}</span>
      <span>{isSv ? "Match" : "Match"}</span>
      <span style={{ textAlign: "right" }}>{isSv ? "Poäng" : "Points"}</span>
      <span style={{ textAlign: "center" }}>{isSv ? "Ditt" : "Yours"}</span>
      <span style={{ textAlign: "center" }}>{isSv ? "Rätt" : "Right"}</span>
      <span style={{ textAlign: "right" }}>{isSv ? "Utfall" : "Result"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Result summary — only when matches played */}
      {total > 0 && (
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "stretch",
            flexWrap: "wrap",
          }}
        >
          {/* Big result box */}
          <div
            style={{
              background: "var(--green-deep)",
              color: "#fff",
              borderRadius: "var(--r-card)",
              padding: "24px 32px",
              flex: "1 1 200px",
            }}
          >
            <div className="eyebrow eyebrow-gold" style={{ marginBottom: 8 }}>
              {isSv ? "Matchresultat" : "Match results"}
            </div>
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontStyle: "italic",
                fontSize: 56,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              <span style={{ color: "var(--gold)" }}>{correct}</span>
              <span
                style={{ color: "rgba(255,255,255,0.3)", fontStyle: "normal" }}
              >
                {" "}
                / {total}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
                marginTop: 6,
              }}
            >
              {isSv ? "rätt tecken" : "correct results"}
            </div>
          </div>

          {/* Mini result boxes — each match */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              alignContent: "flex-start",
              flex: "2 1 300px",
            }}
          >
            {finishedWithTip.map((m) => {
              const tip = m.matchTips[0];
              const actual = actualOutcome(m);
              const hit = tip && actual && tip.prediction === actual;
              const mark =
                tip?.prediction === "HOME"
                  ? "1"
                  : tip?.prediction === "DRAW"
                    ? "x"
                    : "2";
              return (
                <div
                  key={m.id}
                  style={{
                    background: hit ? "var(--gold)" : "rgba(255,255,255,0.08)",
                    color: hit ? "var(--green-deep)" : "rgba(255,255,255,0.7)",
                    border: hit ? "none" : "1px solid rgba(255,255,255,0.15)",
                    width: 38,
                    padding: "8px 0 10px",
                    textAlign: "center",
                    borderRadius: 4,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 8.5,
                      letterSpacing: "0.12em",
                      color: hit
                        ? "rgba(30,57,50,0.6)"
                        : "rgba(255,255,255,0.35)",
                      marginBottom: 2,
                    }}
                  >
                    {String(m.matchNumber).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--f-display)",
                      fontStyle: "italic",
                      fontWeight: 600,
                      fontSize: 20,
                      lineHeight: 1,
                    }}
                  >
                    {mark}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 8.5,
                      marginTop: 2,
                      color: hit
                        ? "rgba(30,57,50,0.6)"
                        : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {hit
                      ? "✓"
                      : actual === "HOME"
                        ? "1"
                        : actual === "DRAW"
                          ? "x"
                          : "2"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "2px solid var(--hairline)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: "transparent",
              border: "none",
              cursor: "pointer",
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

      {/* ── Group stage ──────────────────────────────────────────────── */}
      {tab === "group" && (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                borderRadius: "var(--r-card)",
                overflow: "hidden",
                boxShadow: "var(--sh-card)",
              }}
            >
              {tableHead}
              <div
                style={{
                  border: "1px solid var(--hairline)",
                  borderTop: "none",
                  borderRadius: "0 0 var(--r-card) var(--r-card)",
                }}
              >
                {group.matches.map((m, idx) => (
                  <MatchResultRow
                    key={m.id}
                    match={m}
                    idx={idx}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Advancement ──────────────────────────────────────────────── */}
      {tab === "advancement" && (
        <div
          style={{
            borderRadius: "var(--r-card)",
            overflow: "hidden",
            boxShadow: "var(--sh-card)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr 1fr 72px",
              background: "var(--green-deep)",
              color: "var(--gold)",
              padding: "10px 24px",
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            <span>{isSv ? "Grupp" : "Group"}</span>
            <span>{isSv ? "Lag 1" : "Team 1"}</span>
            <span>{isSv ? "Lag 2" : "Team 2"}</span>
            <span style={{ textAlign: "right" }}>
              {isSv ? "Poäng" : "Points"}
            </span>
          </div>
          <div
            style={{
              border: "1px solid var(--hairline)",
              borderTop: "none",
              borderRadius: "0 0 var(--r-card) var(--r-card)",
            }}
          >
            {advancementTips.length === 0 && (
              <div
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  color: "var(--ink-faint)",
                  fontFamily: "var(--f-mono)",
                  fontSize: 11,
                }}
              >
                {isSv ? "Inga avancemangstips" : "No advancement tips"}
              </div>
            )}
            {advancementTips.map((tip, idx) => {
              const pts = tip.pointsEarned;
              return (
                <div
                  key={tip.groupId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr 1fr 72px",
                    padding: "14px 24px",
                    alignItems: "center",
                    borderTop: idx > 0 ? "1px solid var(--hairline)" : "none",
                    background: idx % 2 === 0 ? "#fff" : "var(--cream)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--green-deep)",
                      color: "var(--gold)",
                      fontFamily: "var(--f-mono)",
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  >
                    {tip.group.name}
                  </span>
                  {[tip.firstTeam, tip.secondTeam].map((team, i) => (
                    <div
                      key={i}
                      style={{
                        fontFamily: "var(--f-serif)",
                        fontWeight: 600,
                        fontSize: 15,
                        letterSpacing: "-0.01em",
                        color: "var(--ink)",
                      }}
                    >
                      {tn(team, locale)}
                      <span
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontSize: 9.5,
                          color: "var(--ink-faint)",
                          marginLeft: 6,
                        }}
                      >
                        {team.fifaCode}
                      </span>
                    </div>
                  ))}
                  <div style={{ textAlign: "right" }}>
                    {pts !== null ? (
                      <span
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontWeight: 700,
                          fontSize: 13,
                          color: pts > 0 ? "var(--green)" : "var(--ink-faint)",
                        }}
                      >
                        {pts > 0 ? `+${Number(pts).toFixed(2)}` : "0"}
                      </span>
                    ) : (
                      <span style={{ color: "var(--hairline)" }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Knockout ─────────────────────────────────────────────────── */}
      {tab === "knockout" &&
        (knockoutMatches.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
            }}
          >
            {isSv ? "Slutspelet börjar snart" : "Knockout stage coming soon"}
          </div>
        ) : (
          <div
            style={{
              borderRadius: "var(--r-card)",
              overflow: "hidden",
              boxShadow: "var(--sh-card)",
            }}
          >
            {tableHead}
            <div
              style={{
                border: "1px solid var(--hairline)",
                borderTop: "none",
                borderRadius: "0 0 var(--r-card) var(--r-card)",
              }}
            >
              {knockoutMatches.map((m, idx) => (
                <MatchResultRow
                  key={m.id}
                  match={m}
                  idx={idx}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ))}

      {/* ── Tournament ───────────────────────────────────────────────── */}
      {tab === "tournament" && (
        <div
          style={{
            borderRadius: "var(--r-card)",
            overflow: "hidden",
            boxShadow: "var(--sh-card)",
            border: "1px solid var(--hairline)",
          }}
        >
          {!tournamentTip ? (
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                color: "var(--ink-faint)",
                fontFamily: "var(--f-mono)",
                fontSize: 11,
              }}
            >
              {isSv ? "Inget turneringstips" : "No tournament tip"}
            </div>
          ) : (
            <>
              {/* Finalists */}
              <div
                style={{
                  padding: "20px 24px 16px",
                  borderBottom: "2px dashed var(--hairline)",
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 12 }}>
                  {isSv ? "Finallag" : "Finalists"}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {[tournamentTip.finalist1, tournamentTip.finalist2].map(
                    (team, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: "var(--f-serif)",
                          fontWeight: 600,
                          fontSize: 18,
                          color: "var(--ink)",
                        }}
                      >
                        {tn(team, locale)}
                        {i === 0 && (
                          <span
                            style={{
                              color: "var(--ink-faint)",
                              margin: "0 10px",
                              fontStyle: "italic",
                            }}
                          >
                            vs
                          </span>
                        )}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {/* Winner */}
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--gold-pale)",
                }}
              >
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    {isSv ? "VM-vinnare" : "Champion"}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--f-display)",
                      fontWeight: 600,
                      fontSize: 28,
                      letterSpacing: "-0.02em",
                      color: "var(--green-deep)",
                    }}
                  >
                    {tn(tournamentTip.winner, locale)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {tournamentTip.pointsEarned !== null && (
                    <div style={{ textAlign: "right" }}>
                      <div className="eyebrow" style={{ marginBottom: 4 }}>
                        {isSv ? "Poäng" : "Points"}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontWeight: 700,
                          fontSize: 20,
                          color:
                            tournamentTip.pointsEarned > 0
                              ? "var(--green)"
                              : "var(--ink-faint)",
                        }}
                      >
                        {tournamentTip.pointsEarned > 0
                          ? `+${Number(tournamentTip.pointsEarned).toFixed(2)}`
                          : "0"}
                      </div>
                    </div>
                  )}
                  <div className="stamp stamp-green">
                    {isSv ? "Vinnare" : "Winner"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
