// components/tips/AdvancementCard.tsx  — Fas 3 redesign
// Coupon-style team selector for group advancement tips.
"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { submitGroupAdvancementTip } from "@/lib/actions/tips";
import type { MatchTipState } from "@/lib/actions/tips";
import { cn } from "@/lib/utils";

type Team = {
  id: string;
  nameSv: string;
  nameEn: string;
  fifaCode: string;
  flagUrl: string | null;
  advancementOdds: { avgValue: number } | null;
};

type Group = {
  id: string;
  name: string;
  teams: Team[];
};

type ExistingTip = {
  firstTeamId: string;
  secondTeamId: string;
  pointsEarned: number | null;
} | null;

interface AdvancementCardProps {
  group: Group;
  existingTip: ExistingTip;
  locked: boolean;
  locale: string;
}

const initialState: MatchTipState = { success: false };

export function AdvancementCard({
  group,
  existingTip,
  locked,
  locale,
}: AdvancementCardProps) {
  const [state, action] = useFormState(submitGroupAdvancementTip, initialState);
  const [, startTransition] = useTransition();

  const [selected, setSelected] = useState<string[]>(
    existingTip ? [existingTip.firstTeamId, existingTip.secondTeamId] : [],
  );
  const [saved, setSaved] = useState(!!existingTip);
  const [saving, setSaving] = useState(false);

  const isSv = locale === "sv";

  function toggleTeam(teamId: string) {
    if (locked) return;
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId);
      if (prev.length >= 2) return [prev[1], teamId];
      return [...prev, teamId];
    });
  }

  async function handleSave() {
    if (selected.length !== 2) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("groupId", group.id);
    fd.append("firstTeamId", selected[0]);
    fd.append("secondTeamId", selected[1]);
    startTransition(async () => {
      await action(fd);
      setSaved(true);
      setSaving(false);
    });
  }

  const teamName = (t: Team) => (isSv ? t.nameSv : t.nameEn);
  const remaining = 2 - selected.length;

  return (
    <div
      style={{
        borderRadius: "var(--r-card)",
        overflow: "hidden",
        boxShadow: "var(--sh-card)",
      }}
    >
      {/* Coupon-style head */}
      <div
        style={{
          background: "var(--green-deep)",
          color: "var(--cream)",
          padding: "12px 20px 10px",
          borderBottom: "2px double var(--gold)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            {isSv ? `Grupp ${group.name}` : `Group ${group.name}`}
          </div>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9.5,
              color: "var(--gold)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginTop: 5,
            }}
          >
            {isSv ? "Välj 2 lag som avancerar" : "Pick 2 advancing teams"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {saved && (
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 9.5,
                color: "var(--gold)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              ✓ {isSv ? "Sparat" : "Saved"}
            </div>
          )}
          {existingTip?.pointsEarned != null &&
            existingTip.pointsEarned > 0 && (
              <div
                style={{
                  fontFamily: "var(--f-mono)",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--gold)",
                  marginTop: 2,
                }}
              >
                +{Number(existingTip.pointsEarned).toFixed(2)}p
              </div>
            )}
        </div>
      </div>

      {/* Team rows */}
      <div style={{ background: "var(--coupon-bg)" }}>
        {group.teams.map((team, idx) => {
          const isSelected = selected.includes(team.id);
          const rank = selected.indexOf(team.id) + 1;
          const odds = team.advancementOdds
            ? Number(team.advancementOdds.avgValue)
            : null;

          return (
            <div
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "11px 20px",
                borderBottom:
                  idx < group.teams.length - 1
                    ? "1px solid var(--coupon-rule-soft)"
                    : "none",
                background:
                  idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.18)",
                cursor: locked ? "default" : "pointer",
                transition: "background 0.12s",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                if (!locked && !isSelected)
                  (e.currentTarget as HTMLDivElement).style.background =
                    "rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.18)";
              }}
            >
              {/* Rank indicator or empty circle */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  background: isSelected ? "var(--green-deep)" : "transparent",
                  border: isSelected ? "none" : "1px solid var(--coupon-rule)",
                  transition: "all 0.15s",
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontWeight: 700,
                      fontSize: 11,
                      color: "var(--gold)",
                    }}
                  >
                    {rank}
                  </span>
                )}
              </div>

              {/* Flag */}
              {team.flagUrl && (
                <img
                  src={team.flagUrl}
                  alt={team.fifaCode}
                  style={{
                    width: 22,
                    height: 14,
                    objectFit: "cover",
                    borderRadius: 2,
                    marginRight: 10,
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}

              {/* Name */}
              <span
                style={{
                  fontFamily: "var(--f-sans)",
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: 14.5,
                  letterSpacing: "-0.01em",
                  color: isSelected ? "var(--green-deep)" : "var(--coupon-ink)",
                  flex: 1,
                  transition: "font-weight 0.1s",
                }}
              >
                {teamName(team)}
              </span>

              {/* FIFA code */}
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 9.5,
                  color: "rgba(0,0,0,0.35)",
                  letterSpacing: "0.1em",
                  marginRight: 12,
                }}
              >
                {team.fifaCode}
              </span>

              {/* Odds */}
              {odds !== null && (
                <span
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 11,
                    color: "rgba(0,0,0,0.45)",
                    minWidth: 32,
                    textAlign: "right",
                  }}
                >
                  {odds.toFixed(2)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / save button */}
      <div
        style={{
          background: "#2d251a",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color:
              remaining > 0 ? "rgba(242,240,235,0.45)" : "var(--gold-soft)",
          }}
        >
          {locked
            ? isSv
              ? "Tips stängt"
              : "Tips closed"
            : remaining > 0
              ? isSv
                ? `Välj ${remaining} lag till`
                : `Pick ${remaining} more`
              : isSv
                ? "Klar att lämna in"
                : "Ready to submit"}
        </div>
        {!locked && (
          <button
            onClick={handleSave}
            disabled={selected.length !== 2 || saving}
            style={{
              fontFamily: "var(--f-sans)",
              fontWeight: 600,
              fontSize: 13,
              padding: "6px 16px",
              borderRadius: "var(--r-pill)",
              background:
                selected.length === 2 && !saved
                  ? "var(--gold)"
                  : saved
                    ? "rgba(242,240,235,0.15)"
                    : "rgba(242,240,235,0.08)",
              color:
                selected.length === 2 && !saved
                  ? "var(--green-deep)"
                  : "rgba(242,240,235,0.5)",
              border: "none",
              cursor: selected.length === 2 ? "pointer" : "default",
              transition: "all 0.15s",
            }}
          >
            {saving
              ? "…"
              : saved
                ? isSv
                  ? "✓ Sparat"
                  : "✓ Saved"
                : isSv
                  ? "Spara"
                  : "Save"}
          </button>
        )}
      </div>
    </div>
  );
}
