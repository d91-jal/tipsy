// components/admin/AdvancementOddsForm.tsx  — designsystem-styling
"use client";

import { useState, useTransition } from "react";
import { setAdvancementOdds } from "@/lib/actions/admin";

type Team = {
  id: string;
  nameSv: string;
  nameEn: string;
  fifaCode: string;
  advancementOdds: { avgValue: number } | null;
};

type Group = {
  id: string;
  name: string;
  teams: Team[];
};

interface AdvancementOddsFormProps {
  group: Group;
  locale: string;
  adminId: string;
}

export function AdvancementOddsForm({
  group,
  locale,
  adminId,
}: AdvancementOddsFormProps) {
  const isSv = locale === "sv";

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      group.teams.map((t) => [
        t.id,
        t.advancementOdds?.avgValue?.toString() ?? "",
      ]),
    ),
  );
  const [source, setSource] = useState("Unibet");
  const [saved, setSaved] = useState(
    group.teams.every((t) => t.advancementOdds?.avgValue),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        for (const team of group.teams) {
          const val = values[team.id];
          if (!val) continue;
          const fd = new FormData();
          fd.append("teamId", team.id);
          fd.append("odds", val);
          fd.append("source", source);
          fd.append("adminId", adminId);
          await setAdvancementOdds(fd);
        }
        setSaved(true);
      } catch (err: any) {
        setError(err.message ?? "Error");
      }
    });
  }

  const teamName = (t: Team) => (isSv ? t.nameSv : t.nameEn);
  const allFilled = group.teams.every((t) => values[t.id]);

  return (
    <form
      onSubmit={handleSubmit}
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
        {group.teams.map((team, idx) => (
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
            {/* Team name */}
            <span
              style={{
                fontFamily: "var(--f-sans)",
                fontSize: 13.5,
                color: "var(--coupon-ink)",
                flex: 1,
              }}
            >
              {teamName(team)}
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

            {/* Odds input */}
            <input
              type="number"
              step="0.01"
              min="1.01"
              max="99"
              value={values[team.id]}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [team.id]: e.target.value }));
                setSaved(false);
              }}
              placeholder="1.65"
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
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          background: "#2d251a",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Source input */}
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Unibet"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "var(--r-input)",
            color: "rgba(242,240,235,0.7)",
            padding: "4px 8px",
            width: 80,
            outline: "none",
          }}
        />

        {error && (
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              color: "var(--stamp-red)",
            }}
          >
            {error}
          </span>
        )}

        <button
          type="submit"
          disabled={isPending || !allFilled}
          style={{
            fontFamily: "var(--f-sans)",
            fontWeight: 600,
            fontSize: 12,
            padding: "6px 14px",
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
    </form>
  );
}
