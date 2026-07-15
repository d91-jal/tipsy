// components/competitions/CouponsView.tsx  — Fas 3 redesign
"use client";

import { useState } from "react";
import { cn, stageLabel } from "@/lib/utils";

type Member = {
  userId: string;
  tipsPublic: boolean;
  isSimBot: boolean;
  user: { id: string; name: string | null; email: string };
};
type Team = { id: string; nameSv: string; nameEn: string; fifaCode: string };
type MatchTip = {
  userId: string;
  prediction: "HOME" | "DRAW" | "AWAY";
  pointsEarned: number | null;
};
type Match = {
  id: string;
  matchNumber: number;
  scheduledAt: string;
  stage: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  matchTips: MatchTip[];
};
type AdvancementTip = {
  userId: string;
  groupId: string;
  firstTeam: Team;
  secondTeam: Team;
  pointsEarned: number | null;
};
type ActualAdvancement = { teamId: string; position: number; team: Team };
type Group = {
  id: string;
  name: string;
  teams: Team[];
  matches: Match[];
  advancementTips: AdvancementTip[];
  actualAdvancements: ActualAdvancement[];
};
type TournamentTip = {
  userId: string;
  finalist1: Team;
  finalist2: Team;
  winner: Team;
  pointsEarned: number | null;
};
type TournamentActual = {
  finalist1: Team;
  finalist2: Team;
  winner: Team | null;
} | null;

type Props = {
  competition: { id: string; name: string; slug: string };
  members: Member[];
  groups: Group[];
  knockoutMatches: Match[];
  tournamentTips: TournamentTip[];
  tournamentActual: TournamentActual;
  currentUserId: string;
  isLocked: boolean;
  locale: string;
};

type Tab = "groups" | "advancement" | "knockout" | "tournament";

const KNOCKOUT_STAGES = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;

function outcomeLabel(o: "HOME" | "DRAW" | "AWAY") {
  return o === "HOME" ? "1" : o === "DRAW" ? "x" : "2";
}
function actualOutcome(m: Match): "HOME" | "DRAW" | "AWAY" | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return "HOME";
  if (m.awayScore > m.homeScore) return "AWAY";
  return "DRAW";
}
function tn(team: Team | null, locale: string) {
  return locale === "sv" ? (team as any)?.nameSv : (team as any)?.nameEn;
}
function userName(m: Member) {
  return m.user.name ?? m.user.email.split("@")[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Cell — a single 1/X/2 tip cell in the matrix
// ─────────────────────────────────────────────────────────────────────────────
function TipCell({
  tip,
  actual,
  isMe,
  finished,
}: {
  tip: MatchTip | undefined;
  actual: "HOME" | "DRAW" | "AWAY" | null;
  isMe: boolean;
  finished: boolean;
}) {
  if (!tip) {
    return (
      <td
        style={{
          padding: "8px 4px",
          textAlign: "center",
          background: isMe ? "rgba(203,162,88,0.05)" : "transparent",
          borderRight: "1px solid var(--hairline)",
        }}
      >
        <span style={{ color: "var(--hairline)", fontSize: 12 }}>—</span>
      </td>
    );
  }
  const correct = finished && actual === tip.prediction;
  const wrong = finished && actual !== null && actual !== tip.prediction;
  return (
    <td
      style={{
        padding: "8px 4px",
        textAlign: "center",
        background: isMe ? "rgba(203,162,88,0.06)" : "transparent",
        borderRight: "1px solid var(--hairline)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: 3,
          fontFamily: "var(--f-display)",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 15,
          background: correct
            ? "var(--gold)"
            : wrong
              ? "rgba(156,42,31,0.08)"
              : isMe
                ? "var(--green-pale)"
                : "transparent",
          color: correct
            ? "var(--green-deep)"
            : wrong
              ? "var(--stamp-red)"
              : "var(--ink-soft)",
          border:
            !correct && !wrong && !isMe ? "1px solid var(--hairline)" : "none",
          textDecoration: wrong ? "line-through" : "none",
        }}
      >
        {outcomeLabel(tip.prediction)}
      </span>
    </td>
  );
}

export function CouponsView({
  competition,
  members,
  groups,
  knockoutMatches,
  tournamentTips,
  tournamentActual,
  currentUserId,
  isLocked,
  locale,
}: Props) {
  const [tab, setTab] = useState<Tab>("groups");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const isSv = locale === "sv";

  // Current user first, then alphabetical
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return userName(a).localeCompare(userName(b));
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "groups", label: isSv ? "⚽ Gruppspel" : "⚽ Group Stage" },
    { key: "advancement", label: isSv ? "🏅 Avancemang" : "🏅 Advancement" },
    { key: "knockout", label: isSv ? "⚔️ Slutspel" : "⚔️ Knockout" },
    { key: "tournament", label: isSv ? "🏆 Final" : "🏆 Final" },
  ];

  // Knockout matches grouped by stage, in bracket order
  const knockoutByStage = KNOCKOUT_STAGES.map((stage) => ({
    stage,
    label: stageLabel(stage, locale),
    matches: knockoutMatches.filter((m) => m.stage === stage),
  })).filter((s) => s.matches.length > 0);

  // Sticky column header style
  const stickyHead: React.CSSProperties = {
    position: "sticky",
    left: 0,
    zIndex: 2,
    background: "var(--green-deep)",
    color: "var(--gold)",
    fontFamily: "var(--f-mono)",
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "10px 16px",
    whiteSpace: "nowrap",
    borderRight: "2px solid rgba(255,255,255,0.1)",
  };

  const memberHead = (m: Member): React.CSSProperties => ({
    fontFamily: "var(--f-mono)",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "10px 6px",
    textAlign: "center",
    minWidth: 52,
    maxWidth: 72,
    background:
      m.userId === currentUserId
        ? "rgba(203,162,88,0.15)"
        : "var(--green-deep)",
    color: m.userId === currentUserId ? "var(--gold)" : "rgba(255,255,255,0.6)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          {competition.name}
        </p>
        <h1
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: "clamp(26px, 4vw, 38px)",
            letterSpacing: "-0.02em",
            color: "var(--green-deep)",
            margin: 0,
          }}
        >
          {isSv ? "Tipskuponger" : "Tip Coupons"}
        </h1>
      </div>

      {!isLocked && (
        <div
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10.5,
            letterSpacing: "0.1em",
            color: "var(--ink-soft)",
            padding: "10px 16px",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-input)",
            background: "var(--paper)",
          }}
        >
          🔒{" "}
          {isSv
            ? "Tips visas bara för spelare som valt att dela dem innan låsdatum."
            : "Tips only shown for players who chose to share them before the deadline."}
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{ display: "flex", borderBottom: "2px solid var(--hairline)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
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

      {/* ── GROUP STAGE ────────────────────────────────────────────── */}
      {tab === "groups" && (
        <div className="space-y-3">
          {groups.map((group) => {
            const isOpen = expandedGroup === group.id || expandedGroup === null;
            return (
              <div
                key={group.id}
                style={{
                  borderRadius: "var(--r-card)",
                  overflow: "hidden",
                  boxShadow: "var(--sh-card)",
                }}
              >
                {/* Group toggle header */}
                <button
                  onClick={() =>
                    setExpandedGroup(
                      isOpen && expandedGroup === group.id ? null : group.id,
                    )
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 20px",
                    background: "var(--green-deep)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        color: "var(--green-deep)",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--f-mono)",
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {group.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--f-display)",
                        fontWeight: 600,
                        fontSize: 16,
                        color: "var(--cream)",
                      }}
                    >
                      {isSv ? `Grupp ${group.name}` : `Group ${group.name}`}
                    </span>
                  </div>
                  <span
                    style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}
                  >
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 13,
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={stickyHead}>{isSv ? "Match" : "Match"}</th>
                          <th
                            style={{
                              ...stickyHead,
                              left: "auto",
                              position: "static",
                              minWidth: 52,
                            }}
                          >
                            {isSv ? "Facit" : "Result"}
                          </th>
                          {sortedMembers.map((m) => (
                            <th key={m.userId} style={memberHead(m)}>
                              <div
                                style={{
                                  maxWidth: 60,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {userName(m).split(" ")[0]}
                              </div>
                              {m.isSimBot && (
                                <div style={{ fontSize: 8, opacity: 0.5 }}>
                                  🤖
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.matches.map((match, idx) => {
                          const actual = actualOutcome(match);
                          const finished = match.status === "FINISHED";
                          const tipsByUser = Object.fromEntries(
                            match.matchTips.map((t) => [t.userId, t]),
                          );
                          return (
                            <tr
                              key={match.id}
                              style={{
                                background:
                                  idx % 2 === 0 ? "#fff" : "var(--cream)",
                                borderBottom: "1px solid var(--hairline)",
                              }}
                            >
                              {/* Match name */}
                              <td
                                style={{
                                  padding: "9px 16px",
                                  position: "sticky",
                                  left: 0,
                                  background:
                                    idx % 2 === 0 ? "#fff" : "var(--cream)",
                                  borderRight: "2px solid var(--hairline)",
                                  zIndex: 1,
                                  minWidth: 180,
                                }}
                              >
                                <div
                                  style={{
                                    fontFamily: "var(--f-serif)",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: "var(--ink)",
                                    whiteSpace: "nowrap",
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
                                <div
                                  style={{
                                    fontFamily: "var(--f-mono)",
                                    fontSize: 9.5,
                                    color: "var(--ink-faint)",
                                    marginTop: 2,
                                  }}
                                >
                                  #{match.matchNumber}
                                </div>
                              </td>

                              {/* Actual result */}
                              <td
                                style={{
                                  padding: "9px 8px",
                                  textAlign: "center",
                                  borderRight: "2px solid var(--hairline)",
                                  minWidth: 52,
                                }}
                              >
                                {finished ? (
                                  <div
                                    style={{
                                      fontFamily: "var(--f-mono)",
                                      fontWeight: 700,
                                      fontSize: 13,
                                      color: "var(--ink)",
                                    }}
                                  >
                                    {match.homeScore}–{match.awayScore}
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--hairline)" }}>
                                    —
                                  </span>
                                )}
                              </td>

                              {/* Tips */}
                              {sortedMembers.map((m) => (
                                <TipCell
                                  key={m.userId}
                                  tip={tipsByUser[m.userId]}
                                  actual={actual}
                                  isMe={m.userId === currentUserId}
                                  finished={finished}
                                />
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADVANCEMENT ──────────────────────────────────────────── */}
      {tab === "advancement" && (
        <div
          style={{
            borderRadius: "var(--r-card)",
            overflow: "hidden",
            boxShadow: "var(--sh-card)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...stickyHead, minWidth: 80 }}>
                    {isSv ? "Grupp" : "Group"}
                  </th>
                  <th
                    style={{
                      ...stickyHead,
                      left: "auto",
                      position: "static",
                      minWidth: 140,
                    }}
                  >
                    {isSv ? "Facit" : "Actual"}
                  </th>
                  {sortedMembers.map((m) => (
                    <th key={m.userId} style={memberHead(m)}>
                      <div
                        style={{
                          maxWidth: 80,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {userName(m).split(" ")[0]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group, idx) => {
                  const actualIds = new Set(
                    group.actualAdvancements.map((a) => a.teamId),
                  );
                  const tipsByUser = Object.fromEntries(
                    group.advancementTips.map((t) => [t.userId, t]),
                  );
                  return (
                    <tr
                      key={group.id}
                      style={{
                        background: idx % 2 === 0 ? "#fff" : "var(--cream)",
                        borderBottom: "1px solid var(--hairline)",
                      }}
                    >
                      {/* Group badge */}
                      <td
                        style={{
                          padding: "12px 16px",
                          position: "sticky",
                          left: 0,
                          background: idx % 2 === 0 ? "#fff" : "var(--cream)",
                          borderRight: "2px solid var(--hairline)",
                          zIndex: 1,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "var(--green-deep)",
                            color: "var(--gold)",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--f-mono)",
                            fontWeight: 700,
                            fontSize: 11,
                          }}
                        >
                          {group.name}
                        </span>
                      </td>

                      {/* Actual */}
                      <td
                        style={{
                          padding: "12px 12px",
                          borderRight: "2px solid var(--hairline)",
                        }}
                      >
                        {group.actualAdvancements.length >= 2 ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            {group.actualAdvancements
                              .sort((a, b) => a.position - b.position)
                              .map((adv) => (
                                <span
                                  key={adv.teamId}
                                  style={{
                                    fontFamily: "var(--f-mono)",
                                    fontSize: 10,
                                    letterSpacing: "0.08em",
                                    padding: "2px 6px",
                                    borderRadius: 3,
                                    background: "var(--green-pale)",
                                    color: "var(--green-deep)",
                                  }}
                                >
                                  {adv.team.fifaCode}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span
                            style={{ color: "var(--hairline)", fontSize: 12 }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Tips per user */}
                      {sortedMembers.map((m) => {
                        const tip = tipsByUser[m.userId];
                        const hasActual = group.actualAdvancements.length >= 2;
                        const isMe = m.userId === currentUserId;
                        return (
                          <td
                            key={m.userId}
                            style={{
                              padding: "8px 6px",
                              textAlign: "center",
                              background: isMe
                                ? "rgba(203,162,88,0.06)"
                                : "transparent",
                              borderRight: "1px solid var(--hairline)",
                            }}
                          >
                            {tip ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                {[tip.firstTeam, tip.secondTeam].map((team) => {
                                  const correct =
                                    hasActual && actualIds.has(team.id);
                                  const wrong =
                                    hasActual && !actualIds.has(team.id);
                                  return (
                                    <span
                                      key={team.id}
                                      style={{
                                        fontFamily: "var(--f-mono)",
                                        fontSize: 9.5,
                                        letterSpacing: "0.08em",
                                        padding: "2px 5px",
                                        borderRadius: 3,
                                        background: correct
                                          ? "var(--gold)"
                                          : wrong
                                            ? "rgba(156,42,31,0.08)"
                                            : "var(--cream)",
                                        color: correct
                                          ? "var(--green-deep)"
                                          : wrong
                                            ? "var(--stamp-red)"
                                            : "var(--ink-soft)",
                                      }}
                                    >
                                      {team.fifaCode}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span
                                style={{
                                  color: "var(--hairline)",
                                  fontSize: 12,
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── KNOCKOUT ─────────────────────────────────────────────── */}
      {tab === "knockout" && (
        <div className="space-y-3">
          {knockoutByStage.length === 0 && (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                border: "1px dashed var(--hairline)",
                borderRadius: "var(--r-card)",
              }}
            >
              {isSv ? "Slutspelet börjar snart" : "Knockout stage coming soon"}
            </div>
          )}
          {knockoutByStage.map(({ stage, label, matches }) => (
            <div
              key={stage}
              style={{
                borderRadius: "var(--r-card)",
                overflow: "hidden",
                boxShadow: "var(--sh-card)",
              }}
            >
              {/* Stage header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 20px",
                  background: "var(--green-deep)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--f-display)",
                    fontWeight: 600,
                    fontSize: 16,
                    color: "var(--cream)",
                  }}
                >
                  {label}
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={stickyHead}>{isSv ? "Match" : "Match"}</th>
                      <th
                        style={{
                          ...stickyHead,
                          left: "auto",
                          position: "static",
                          minWidth: 52,
                        }}
                      >
                        {isSv ? "Facit" : "Result"}
                      </th>
                      {sortedMembers.map((m) => (
                        <th key={m.userId} style={memberHead(m)}>
                          <div
                            style={{
                              maxWidth: 60,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {userName(m).split(" ")[0]}
                          </div>
                          {m.isSimBot && (
                            <div style={{ fontSize: 8, opacity: 0.5 }}>🤖</div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match, idx) => {
                      const actual = actualOutcome(match);
                      const finished = match.status === "FINISHED";
                      const tipsByUser = Object.fromEntries(
                        match.matchTips.map((t) => [t.userId, t]),
                      );
                      return (
                        <tr
                          key={match.id}
                          style={{
                            background: idx % 2 === 0 ? "#fff" : "var(--cream)",
                            borderBottom: "1px solid var(--hairline)",
                          }}
                        >
                          {/* Match name */}
                          <td
                            style={{
                              padding: "9px 16px",
                              position: "sticky",
                              left: 0,
                              background:
                                idx % 2 === 0 ? "#fff" : "var(--cream)",
                              borderRight: "2px solid var(--hairline)",
                              zIndex: 1,
                              minWidth: 180,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "var(--f-serif)",
                                fontWeight: 600,
                                fontSize: 13,
                                color: "var(--ink)",
                                whiteSpace: "nowrap",
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
                            <div
                              style={{
                                fontFamily: "var(--f-mono)",
                                fontSize: 9.5,
                                color: "var(--ink-faint)",
                                marginTop: 2,
                              }}
                            >
                              #{match.matchNumber}
                            </div>
                          </td>

                          {/* Actual result */}
                          <td
                            style={{
                              padding: "9px 8px",
                              textAlign: "center",
                              borderRight: "2px solid var(--hairline)",
                              minWidth: 52,
                            }}
                          >
                            {finished ? (
                              <div
                                style={{
                                  fontFamily: "var(--f-mono)",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: "var(--ink)",
                                }}
                              >
                                {match.homeScore}–{match.awayScore}
                              </div>
                            ) : (
                              <span style={{ color: "var(--hairline)" }}>
                                —
                              </span>
                            )}
                          </td>

                          {/* Tips */}
                          {sortedMembers.map((m) => (
                            <TipCell
                              key={m.userId}
                              tip={tipsByUser[m.userId]}
                              actual={actual}
                              isMe={m.userId === currentUserId}
                              finished={finished}
                            />
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TOURNAMENT ───────────────────────────────────────────── */}
      {tab === "tournament" && (
        <div
          style={{
            borderRadius: "var(--r-card)",
            overflow: "hidden",
            boxShadow: "var(--sh-card)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...stickyHead, minWidth: 100 }}>
                    {isSv ? "Tips" : "Tip"}
                  </th>
                  <th
                    style={{
                      ...stickyHead,
                      left: "auto",
                      position: "static",
                      minWidth: 120,
                    }}
                  >
                    {isSv ? "Facit" : "Actual"}
                  </th>
                  {sortedMembers.map((m) => (
                    <th key={m.userId} style={memberHead(m)}>
                      {userName(m).split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Finalists row */}
                {[
                  { label: isSv ? "Finallag" : "Finalists", isWinner: false },
                  { label: isSv ? "🏆 Vinnare" : "🏆 Winner", isWinner: true },
                ].map(({ label, isWinner }, rowIdx) => {
                  const actualFinalistIds = tournamentActual
                    ? new Set([
                        tournamentActual.finalist1.id,
                        tournamentActual.finalist2.id,
                      ])
                    : null;
                  return (
                    <tr
                      key={rowIdx}
                      style={{
                        background: rowIdx % 2 === 0 ? "#fff" : "var(--cream)",
                        borderBottom: "1px solid var(--hairline)",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          position: "sticky",
                          left: 0,
                          background:
                            rowIdx % 2 === 0 ? "#fff" : "var(--cream)",
                          borderRight: "2px solid var(--hairline)",
                          zIndex: 1,
                          fontFamily: "var(--f-mono)",
                          fontSize: 10.5,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          padding: "12px 12px",
                          borderRight: "2px solid var(--hairline)",
                        }}
                      >
                        {tournamentActual ? (
                          <div
                            style={{
                              fontFamily: "var(--f-mono)",
                              fontSize: 10,
                              color: "var(--green-deep)",
                            }}
                          >
                            {isWinner
                              ? (tournamentActual.winner?.fifaCode ?? "—")
                              : `${tournamentActual.finalist1.fifaCode} / ${tournamentActual.finalist2.fifaCode}`}
                          </div>
                        ) : (
                          <span style={{ color: "var(--hairline)" }}>—</span>
                        )}
                      </td>
                      {sortedMembers.map((m) => {
                        const tip = tournamentTips.find(
                          (t) => t.userId === m.userId,
                        );
                        const isMe = m.userId === currentUserId;
                        if (!tip)
                          return (
                            <td
                              key={m.userId}
                              style={{
                                padding: "12px 6px",
                                textAlign: "center",
                                background: isMe
                                  ? "rgba(203,162,88,0.06)"
                                  : "transparent",
                                borderRight: "1px solid var(--hairline)",
                              }}
                            >
                              <span style={{ color: "var(--hairline)" }}>
                                —
                              </span>
                            </td>
                          );

                        if (isWinner) {
                          const correct = Boolean(
                            tournamentActual?.winner &&
                            tournamentActual.winner.id === tip.winner.id,
                          );
                          const wrong = Boolean(
                            tournamentActual?.winner && !correct,
                          );
                          return (
                            <td
                              key={m.userId}
                              style={{
                                padding: "12px 6px",
                                textAlign: "center",
                                background: isMe
                                  ? "rgba(203,162,88,0.06)"
                                  : "transparent",
                                borderRight: "1px solid var(--hairline)",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--f-mono)",
                                  fontSize: 10,
                                  padding: "2px 6px",
                                  borderRadius: 3,
                                  background: correct
                                    ? "var(--gold)"
                                    : wrong
                                      ? "rgba(156,42,31,0.08)"
                                      : "var(--cream)",
                                  color: correct
                                    ? "var(--green-deep)"
                                    : wrong
                                      ? "var(--stamp-red)"
                                      : "var(--ink-soft)",
                                }}
                              >
                                {tip.winner.fifaCode}
                              </span>
                            </td>
                          );
                        }

                        // Finalists
                        const f1correct = actualFinalistIds?.has(
                          tip.finalist1.id,
                        );
                        const f2correct = actualFinalistIds?.has(
                          tip.finalist2.id,
                        );
                        return (
                          <td
                            key={m.userId}
                            style={{
                              padding: "8px 6px",
                              textAlign: "center",
                              background: isMe
                                ? "rgba(203,162,88,0.06)"
                                : "transparent",
                              borderRight: "1px solid var(--hairline)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                alignItems: "center",
                              }}
                            >
                              {[
                                { team: tip.finalist1, correct: f1correct },
                                { team: tip.finalist2, correct: f2correct },
                              ].map(({ team, correct }) => (
                                <span
                                  key={team.id}
                                  style={{
                                    fontFamily: "var(--f-mono)",
                                    fontSize: 9.5,
                                    padding: "2px 5px",
                                    borderRadius: 3,
                                    background:
                                      correct === true
                                        ? "var(--gold)"
                                        : correct === false && actualFinalistIds
                                          ? "rgba(156,42,31,0.08)"
                                          : "var(--cream)",
                                    color:
                                      correct === true
                                        ? "var(--green-deep)"
                                        : correct === false && actualFinalistIds
                                          ? "var(--stamp-red)"
                                          : "var(--ink-soft)",
                                  }}
                                >
                                  {team.fifaCode}
                                </span>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, justifyContent: "flex-end" }}>
        {[
          {
            bg: "var(--gold)",
            color: "var(--green-deep)",
            label: isSv ? "Rätt" : "Correct",
          },
          {
            bg: "rgba(156,42,31,0.08)",
            color: "var(--stamp-red)",
            label: isSv ? "Fel" : "Wrong",
          },
          {
            bg: "var(--cream)",
            color: "var(--ink-soft)",
            label: isSv ? "Väntar" : "Pending",
          },
        ].map(({ bg, color, label }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 2,
                background: bg,
                border: "1px solid var(--hairline)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
