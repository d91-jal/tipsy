// components/tips/TournamentTipForm.tsx  — Fas 3 redesign
"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { submitTournamentTip } from "@/lib/actions/tips";
import type { MatchTipState } from "@/lib/actions/tips";
import { useToast } from "@/components/ui";

type Team = {
  id: string;
  nameSv: string;
  nameEn: string;
  fifaCode: string;
  flagUrl: string | null;
  group: { name: string };
  tournamentOdds: { type: string; avgValue: number }[];
};

type ExistingTip = {
  finalist1Id: string;
  finalist2Id: string;
  winnerId: string;
  pointsEarned: number | null;
} | null;

interface TournamentTipFormProps {
  tournamentId: string;
  teams: Team[];
  existingTip: ExistingTip;
  locked: boolean;
  locale: string;
}

const initialState: MatchTipState = { success: false };

export function TournamentTipForm({
  tournamentId,
  teams,
  existingTip,
  locked,
  locale,
}: TournamentTipFormProps) {
  const [state, action] = useFormState(submitTournamentTip, initialState);
  const [, startTransition] = useTransition();

  const [finalist1, setFinalist1] = useState(existingTip?.finalist1Id ?? "");
  const [finalist2, setFinalist2] = useState(existingTip?.finalist2Id ?? "");
  const [winner, setWinner] = useState(existingTip?.winnerId ?? "");
  const [saved, setSaved] = useState(!!existingTip);
  const { toast } = useToast();
  const isSv = locale === "sv";

  useEffect(() => {
    if (state.success) {
      toast(
        isSv ? "Turneringstips sparat ✓" : "Tournament tip saved ✓",
        "success",
      );
    } else if (state.error) {
      toast(
        state.error === "DEADLINE_PASSED"
          ? isSv
            ? "Tips stängt"
            : "Tips closed"
          : isSv
            ? "Kunde inte spara"
            : "Could not save",
        "error",
      );
    }
  }, [state.success, state.error]);

  const teamName = (t: Team) => (isSv ? t.nameSv : t.nameEn);
  const winOdds = (t: Team) =>
    t.tournamentOdds.find((o) => o.type === "WIN")?.avgValue ?? null;
  const finalOdds = (t: Team) =>
    t.tournamentOdds.find((o) => o.type === "REACH_FINAL")?.avgValue ?? null;

  // Sorted by win odds (favorites first)
  const sortedTeams = [...teams].sort((a, b) => {
    const ao = winOdds(a) ?? 999;
    const bo = winOdds(b) ?? 999;
    return ao - bo;
  });

  const finalist1Team = teams.find((t) => t.id === finalist1);
  const finalist2Team = teams.find((t) => t.id === finalist2);

  function handleSave() {
    if (!finalist1 || !finalist2 || !winner) return;
    const fd = new FormData();
    fd.append("tournamentId", tournamentId);
    fd.append("finalist1Id", finalist1);
    fd.append("finalist2Id", finalist2);
    fd.append("winnerId", winner);

    startTransition(async () => {
      try {
        await action(fd);
        setSaved(true);
      } catch {
        toast(
          isSv
            ? "Nätverksfel — tipset sparades inte"
            : "Network error — tip not saved",
          "error",
        );
      }
    });
  }

  const selectStyle = {
    width: "100%",
    padding: "10px 14px",
    fontFamily: "var(--f-sans)",
    fontSize: 14,
    background: locked ? "var(--cream)" : "#fff",
    color: "var(--ink)",
    border: "1px solid var(--coupon-rule-soft)",
    borderRadius: "var(--r-input)",
    outline: "none",
    cursor: locked ? "default" : "pointer",
    appearance: "none" as const,
  };

  return (
    <div className="coupon" style={{ marginBottom: 8 }}>
      {/* Coupon head */}
      <div className="coupon-head">
        <div>
          <h2 style={{ fontSize: 20 }}>
            {isSv ? "Finallag & Vinnare" : "Finalists & Winner"}
          </h2>
          <div className="sub">
            VM-tipset · 2026 · {isSv ? "Turneringstips" : "Tournament tip"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {saved && (
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10,
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
                  fontSize: 16,
                  color: "var(--gold)",
                  marginTop: 2,
                }}
              >
                +{Number(existingTip.pointsEarned).toFixed(2)}p
              </div>
            )}
          {locked && (
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 9.5,
                color: "var(--stamp-red)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {isSv ? "STÄNGT" : "CLOSED"}
            </div>
          )}
        </div>
      </div>

      {/* Form body */}
      <div
        style={{ background: "var(--coupon-bg)", padding: "24px 28px 28px" }}
      >
        {/* Finalist 1 */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {isSv ? "Finallag 1" : "Finalist 1"}
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={finalist1}
              onChange={(e) => {
                setFinalist1(e.target.value);
                if (winner && winner !== finalist2 && winner !== e.target.value)
                  setWinner("");
                setSaved(false);
              }}
              disabled={locked}
              style={selectStyle}
            >
              <option value="">
                {isSv ? "— Välj lag —" : "— Select team —"}
              </option>
              {sortedTeams
                .filter((t) => t.id !== finalist2)
                .map((t) => {
                  const o = finalOdds(t);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.fifaCode} · {teamName(t)}
                      {o ? ` · Final: ${o.toFixed(2)}` : ""}
                    </option>
                  );
                })}
            </select>
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "var(--ink-faint)",
                fontSize: 12,
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Finalist 2 */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {isSv ? "Finallag 2" : "Finalist 2"}
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={finalist2}
              onChange={(e) => {
                setFinalist2(e.target.value);
                if (winner && winner !== finalist1 && winner !== e.target.value)
                  setWinner("");
                setSaved(false);
              }}
              disabled={locked}
              style={selectStyle}
            >
              <option value="">
                {isSv ? "— Välj lag —" : "— Select team —"}
              </option>
              {sortedTeams
                .filter((t) => t.id !== finalist1)
                .map((t) => {
                  const o = finalOdds(t);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.fifaCode} · {teamName(t)}
                      {o ? ` · Final: ${o.toFixed(2)}` : ""}
                    </option>
                  );
                })}
            </select>
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "var(--ink-faint)",
                fontSize: 12,
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Winner — only shown when both finalists selected */}
        {finalist1 && finalist2 && (
          <div
            style={{
              borderTop: "2px dashed var(--coupon-rule)",
              paddingTop: 24,
              marginBottom: 8,
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              🏆 {isSv ? "Vem vinner VM?" : "Who wins the World Cup?"}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[finalist1Team, finalist2Team].filter(Boolean).map((team) => {
                if (!team) return null;
                const o = winOdds(team);
                const isSelected = winner === team.id;
                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      if (!locked) {
                        setWinner(team.id);
                        setSaved(false);
                      }
                    }}
                    disabled={locked}
                    style={{
                      flex: 1,
                      padding: "20px 16px",
                      border: isSelected
                        ? "2px solid var(--gold)"
                        : "1px solid var(--coupon-rule-soft)",
                      borderRadius: "var(--r-coupon)",
                      background: isSelected
                        ? "rgba(203, 162, 88, 0.12)"
                        : "rgba(255,255,255,0.5)",
                      cursor: locked ? "default" : "pointer",
                      transition: "all 0.15s",
                      textAlign: "center",
                    }}
                  >
                    {team.flagUrl && (
                      <img
                        src={team.flagUrl}
                        alt={team.fifaCode}
                        style={{
                          width: 32,
                          height: 20,
                          objectFit: "cover",
                          borderRadius: 2,
                          marginBottom: 8,
                        }}
                      />
                    )}
                    <div
                      style={{
                        fontFamily: "var(--f-display)",
                        fontWeight: 600,
                        fontSize: 18,
                        letterSpacing: "-0.01em",
                        color: isSelected
                          ? "var(--green-deep)"
                          : "var(--coupon-ink)",
                      }}
                    >
                      {teamName(team)}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: 10,
                        color: isSelected ? "var(--gold)" : "rgba(0,0,0,0.4)",
                        letterSpacing: "0.1em",
                        marginTop: 4,
                      }}
                    >
                      {team.fifaCode}
                      {o ? ` · ${o.toFixed(2)}` : ""}
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontSize: 9,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--gold)",
                          marginTop: 6,
                        }}
                      >
                        ✓ {isSv ? "Vald" : "Selected"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {state.error && (
          <p
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              color: "var(--stamp-red)",
              margin: "12px 0 0",
            }}
          >
            {state.error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          background: "#2d251a",
          padding: "12px 28px",
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
              finalist1 && finalist2 && winner
                ? "var(--gold-soft)"
                : "rgba(242,240,235,0.35)",
          }}
        >
          {locked
            ? isSv
              ? "Tips stängt"
              : "Tips closed"
            : !finalist1 || !finalist2
              ? isSv
                ? "Välj 2 finallag"
                : "Pick 2 finalists"
              : !winner
                ? isSv
                  ? "Välj vinnare"
                  : "Pick the winner"
                : isSv
                  ? "Klar att lämna in"
                  : "Ready to submit"}
        </div>
        {!locked && (
          <button
            onClick={handleSave}
            disabled={!finalist1 || !finalist2 || !winner}
            style={{
              fontFamily: "var(--f-sans)",
              fontWeight: 600,
              fontSize: 13,
              padding: "6px 20px",
              borderRadius: "var(--r-pill)",
              border: "none",
              background:
                finalist1 && finalist2 && winner && !saved
                  ? "var(--gold)"
                  : saved
                    ? "rgba(242,240,235,0.15)"
                    : "rgba(242,240,235,0.08)",
              color:
                finalist1 && finalist2 && winner && !saved
                  ? "var(--green-deep)"
                  : "rgba(242,240,235,0.4)",
              cursor: finalist1 && finalist2 && winner ? "pointer" : "default",
              transition: "all 0.15s",
            }}
          >
            {saved ? (isSv ? "✓ Sparat" : "✓ Saved") : isSv ? "Spara" : "Save"}
          </button>
        )}
      </div>
    </div>
  );
}
