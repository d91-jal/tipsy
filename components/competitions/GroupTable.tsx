// components/competitions/GroupTable.tsx  — Fas 3 redesign
"use client";

import { useState } from "react";

export type GroupTableTeam = {
  teamId: string;
  fifaCode: string;
  nameSv: string;
  nameEn: string;
  flagUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  goalDiff: number;
  isActuallyAdvancing: boolean;
};

export type GroupTableData = { groupName: string; teams: GroupTableTeam[] };

function SingleGroupTable({
  group,
  locale,
}: {
  group: GroupTableData;
  locale: string;
}) {
  const isSv = locale === "sv";

  const thStyle: React.CSSProperties = {
    fontFamily: "var(--f-mono)",
    fontSize: 9.5,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--gold)",
    fontWeight: 500,
    padding: "8px 8px",
    textAlign: "center",
  };

  return (
    <div
      style={{
        borderRadius: "var(--r-card)",
        overflow: "hidden",
        boxShadow: "var(--sh-card)",
      }}
    >
      {/* Group header */}
      <div
        style={{
          background: "var(--green-deep)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--gold)",
            color: "var(--green-deep)",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--f-mono)",
            fontWeight: 700,
            fontSize: 10,
          }}
        >
          {group.groupName}
        </span>
        <span
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--cream)",
          }}
        >
          {isSv ? `Grupp ${group.groupName}` : `Group ${group.groupName}`}
        </span>
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
      >
        <thead>
          <tr
            style={{
              background: "var(--green-uplift)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <th style={{ ...thStyle, width: 24, textAlign: "center" }}>#</th>
            <th style={{ ...thStyle, textAlign: "left", paddingLeft: 12 }}>
              {isSv ? "Lag" : "Team"}
            </th>
            {["S", "V", "O", "F", "GM-IM", "MS", "P"].map((h) => (
              <th
                key={h}
                style={{
                  ...thStyle,
                  color: h === "P" ? "#fff" : "var(--gold)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.teams.map((team, idx) => {
            const advances = idx < 2;
            const confirmed = team.isActuallyAdvancing;

            return (
              <tr
                key={team.teamId}
                style={{
                  background: confirmed
                    ? "rgba(203,162,88,0.08)"
                    : advances && team.played > 0
                      ? "var(--green-pale)"
                      : idx % 2 === 0
                        ? "#fff"
                        : "var(--cream)",
                  borderBottom:
                    idx < group.teams.length - 1
                      ? "1px solid var(--hairline)"
                      : "none",
                }}
              >
                {/* Position */}
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    fontFamily: "var(--f-mono)",
                    fontWeight: 700,
                    fontSize: 11,
                    color: confirmed
                      ? "var(--gold)"
                      : idx < 2
                        ? "var(--green)"
                        : "var(--ink-faint)",
                  }}
                >
                  {idx + 1}
                </td>

                {/* Flag + name */}
                <td style={{ padding: "10px 8px 10px 12px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {team.flagUrl && (
                      <img
                        src={team.flagUrl}
                        alt={team.fifaCode}
                        style={{
                          width: 20,
                          height: 13,
                          objectFit: "cover",
                          borderRadius: 2,
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: "var(--f-serif)",
                        fontWeight: 600,
                        fontSize: 13,
                        letterSpacing: "-0.01em",
                        color: confirmed ? "var(--green-deep)" : "var(--ink)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {locale === "sv" ? team.nameSv : team.nameEn}
                    </span>
                    {confirmed && (
                      <span
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontSize: 8,
                          color: "var(--green)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </td>

                {/* Stats */}
                {[team.played, team.won, team.drawn, team.lost].map(
                  (val, i) => (
                    <td
                      key={i}
                      style={{
                        padding: "10px 8px",
                        textAlign: "center",
                        fontFamily: "var(--f-mono)",
                        fontSize: 12,
                        color: "var(--ink-soft)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {val}
                    </td>
                  ),
                )}

                {/* GM-IM */}
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    fontFamily: "var(--f-mono)",
                    fontSize: 11,
                    color: "var(--ink-soft)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {team.goalsFor}–{team.goalsAgainst}
                </td>

                {/* Goal diff */}
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    fontFamily: "var(--f-mono)",
                    fontWeight: 600,
                    fontSize: 12,
                    color:
                      team.goalDiff > 0
                        ? "var(--green)"
                        : team.goalDiff < 0
                          ? "var(--stamp-red)"
                          : "var(--ink-faint)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                </td>

                {/* Points */}
                <td
                  style={{
                    padding: "10px 8px",
                    textAlign: "center",
                    fontFamily: "var(--f-mono)",
                    fontWeight: 700,
                    fontSize: 14,
                    color: confirmed
                      ? "var(--gold)"
                      : idx < 2
                        ? "var(--green-deep)"
                        : "var(--ink)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {team.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function GroupTablesGrid({
  groups,
  locale,
}: {
  groups: GroupTableData[];
  locale: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isSv = locale === "sv";

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0 0 20px",
        }}
      >
        <div>
          <p className="eyebrow" style={{ margin: "0 0 6px" }}>
            {isSv ? "Gruppspelet" : "Group Stage"}
          </p>
          <h2
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: "-0.02em",
              color: "var(--green-deep)",
              margin: 0,
            }}
          >
            {isSv ? "Grupptabeller" : "Group Standings"}
          </h2>
        </div>
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
          }}
        >
          {collapsed
            ? isSv
              ? "Visa ▼"
              : "Show ▼"
            : isSv
              ? "Dölj ▲"
              : "Hide ▲"}
        </span>
      </button>

      {!collapsed && (
        <>
          {/* Column legend */}
          <p
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "var(--ink-faint)",
              marginBottom: 16,
            }}
          >
            S = {isSv ? "Spelade" : "Played"} · V = {isSv ? "Vunna" : "Won"} · O
            = {isSv ? "Oavgjorda" : "Drawn"} · F = {isSv ? "Förlorade" : "Lost"}{" "}
            · GM-IM = {isSv ? "Gjorda–Insläppta" : "GF–GA"} · MS ={" "}
            {isSv ? "Målskillnad" : "GD"} · P = {isSv ? "Poäng" : "Pts"}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
              gap: 12,
            }}
          >
            {groups.map((g) => (
              <SingleGroupTable key={g.groupName} group={g} locale={locale} />
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            {[
              {
                bg: "rgba(203,162,88,0.08)",
                label: isSv ? "Bekräftat avancemang" : "Confirmed advancement",
              },
              {
                bg: "var(--green-pale)",
                label: isSv ? "Leder gruppen" : "Leading group",
              },
            ].map(({ bg, label }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: bg,
                    border: "1px solid var(--hairline)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    color: "var(--ink-faint)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
