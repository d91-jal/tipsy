// components/admin/AdvancementOddsForm.tsx
"use client";

import { useState, useTransition } from "react";
import type { Prisma } from "@prisma/client";

type GroupWithTeams = Prisma.GroupGetPayload<{
  include: { teams: { include: { advancementOdds: true } } };
}>;

type TeamOddsEntry = { teamId: string; value: string };

export function AdvancementOddsForm({
  group,
  locale,
  adminId,
}: {
  group: GroupWithTeams;
  locale: string;
  adminId: string;
}) {
  const [entries, setEntries] = useState<TeamOddsEntry[]>(
    group.teams.map((t) => ({
      teamId: t.id,
      value: t.advancementOdds?.[0]
        ? Number(t.advancementOdds[0].avgValue).toFixed(2)
        : "",
    })),
  );
  const [saved, setSaved] = useState(
    group.teams.every((t) => t.advancementOdds?.[0]),
  );
  const [isPending, startTransition] = useTransition();
  const isSv = locale === "sv";

  function update(teamId: string, value: string) {
    setSaved(false);
    setEntries((prev) =>
      prev.map((e) => (e.teamId === teamId ? { ...e, value } : e)),
    );
  }

  async function handleSave() {
    startTransition(async () => {
      const res = await fetch("/api/admin/advancement-odds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: entries.map((e) => ({
            teamId: e.teamId,
            value: parseFloat(e.value),
            adminId,
          })),
        }),
      });
      if (res.ok) setSaved(true);
    });
  }

  const allFilled = entries.every((e) => e.value);

  return (
    <div
      style={{
        borderRadius: "var(--r-card)",
        overflow: "hidden",
        boxShadow: "var(--sh-card)",
        border: `1px solid ${saved ? "var(--green)" : "var(--hairline)"}`,
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "var(--green-deep)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px double var(--gold)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              fontSize: 11,
            }}
          >
            {group.name}
          </span>
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: 15,
              color: "var(--cream)",
            }}
          >
            {isSv ? `Grupp ${group.name}` : `Group ${group.name}`}
          </span>
        </div>
        {saved && (
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--gold)",
            }}
          >
            ✓ {isSv ? "Satt" : "Set"}
          </span>
        )}
      </div>

      {/* Team rows */}
      <div style={{ background: "var(--coupon-bg)" }}>
        {group.teams.map((team, idx) => {
          const entry = entries.find((e) => e.teamId === team.id);
          return (
            <div
              key={team.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "9px 14px",
                gap: 10,
                borderBottom:
                  idx < group.teams.length - 1
                    ? "1px solid var(--coupon-rule-soft)"
                    : "none",
                background:
                  idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.18)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--f-sans)",
                  fontSize: 13.5,
                  color: "var(--coupon-ink)",
                  flex: 1,
                }}
              >
                {isSv ? team.nameSv : team.nameEn}
              </span>
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 9.5,
                  color: "rgba(0,0,0,0.35)",
                  letterSpacing: "0.08em",
                }}
              >
                {team.fifaCode}
              </span>
              <input
                type="number"
                step="0.01"
                min="1.01"
                max="99"
                placeholder="2.00"
                value={entry?.value ?? ""}
                onChange={(e) => update(team.id, e.target.value)}
                style={{
                  width: 64,
                  textAlign: "center",
                  fontFamily: "var(--f-mono)",
                  fontWeight: 600,
                  fontSize: 15,
                  color: "var(--green-deep)",
                  background: "#fff",
                  border: "1px solid var(--coupon-rule-soft)",
                  borderRadius: "var(--r-input)",
                  padding: "5px 4px",
                  outline: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          background: "#2d251a",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={handleSave}
          disabled={isPending || !allFilled}
          style={{
            fontFamily: "var(--f-sans)",
            fontWeight: 600,
            fontSize: 12,
            padding: "6px 16px",
            borderRadius: "var(--r-pill)",
            border: "none",
            cursor: isPending || !allFilled ? "default" : "pointer",
            background: saved
              ? "rgba(242,240,235,0.15)"
              : allFilled
                ? "var(--gold)"
                : "rgba(242,240,235,0.08)",
            color: saved
              ? "rgba(242,240,235,0.5)"
              : allFilled
                ? "var(--green-deep)"
                : "rgba(242,240,235,0.3)",
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
    </div>
  );
}
