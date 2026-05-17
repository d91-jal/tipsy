// ─────────────────────────────────────────────────────────────────────────────
// app/[locale]/tips/knockout/page.tsx  — Fas 3 redesign
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { CouponMatchRow } from "@/components/tips/CouponMatchRow";
import { stageLabel } from "@/lib/utils";

const KNOCKOUT_STAGES = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;

export default async function KnockoutPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect({ href: "/auth/login", locale });

  const matches = await prisma.match.findMany({
    where: {
      tournament: { slug: "wc2026" },
      stage: { not: "GROUP" },
    },
    orderBy: { matchNumber: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      odds: true,
      matchTips: { where: { userId: session.user.id } },
    },
  });

  const isSv = locale === "sv";
  const byStage = KNOCKOUT_STAGES.map((stage) => ({
    stage,
    label: stageLabel(stage, locale),
    matches: matches.filter((m) => m.stage === stage),
  })).filter((s) => s.matches.length > 0);

  const available = matches.filter((m) => m.homeTeamId && m.awayTeamId);
  const tipped = available.filter((m) => m.matchTips.length > 0).length;

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          marginBottom: 36,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>
            {isSv ? "Tips · VM 2026" : "Predictions · WC 2026"}
          </p>
          <h1
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: "clamp(28px, 4vw, 44px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: "var(--green-deep)",
              margin: 0,
            }}
          >
            {isSv ? "Slutspelet." : "Knockout."}{" "}
            <span style={{ fontStyle: "italic", color: "var(--green)" }}>
              {isSv ? "24h per match." : "24h per match."}
            </span>
          </h1>
        </div>
        {available.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                marginBottom: 4,
              }}
            >
              {isSv ? "Ifyllt" : "Filled"}
            </div>
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: 36,
                color: "var(--green-deep)",
                lineHeight: 1,
              }}
            >
              <span style={{ color: "var(--gold)", fontStyle: "italic" }}>
                {tipped}
              </span>
              <span style={{ color: "rgba(30,57,50,0.3)" }}>
                {" "}
                / {available.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {byStage.length === 0 && (
        <div
          style={{
            padding: "64px 24px",
            textAlign: "center",
            border: "1px dashed var(--hairline)",
            borderRadius: "var(--r-card)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontStyle: "italic",
              fontSize: 20,
              color: "var(--ink-faint)",
              marginBottom: 8,
            }}
          >
            {isSv ? "Slutspelet börjar snart." : "Knockout stage coming soon."}
          </div>
          <p className="eyebrow">
            {isSv ? "Öppnar efter gruppspelet" : "Opens after group stage"}
          </p>
        </div>
      )}

      {byStage.map(({ stage, label, matches }) => (
        <div key={stage} className="coupon" style={{ marginBottom: 24 }}>
          <div className="coupon-head">
            <div>
              <h2 style={{ fontSize: 18 }}>{label}</h2>
              <div className="sub">VM-tipset · 2026 · 1X2 (90 min)</div>
            </div>
          </div>

          <div className="coupon-colhead">
            <div>{isSv ? "Nr" : "No"}</div>
            <div>{isSv ? "Match" : "Match"}</div>
            <div>1</div>
            <div>X</div>
            <div>2</div>
          </div>

          {matches.map((match, idx) => {
            if (!match.homeTeamId || !match.awayTeamId) {
              return (
                <div
                  key={match.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "38px 1fr 38px 38px 38px",
                    padding: "14px 12px",
                    borderBottom:
                      idx < matches.length - 1
                        ? "1px solid var(--coupon-rule-soft)"
                        : "none",
                    background:
                      idx % 2 === 0
                        ? "var(--coupon-bg)"
                        : "rgba(255,255,255,0.18)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 12,
                      color: "rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {String(match.matchNumber).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontFamily: "var(--f-mono)",
                      fontSize: 10.5,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(0,0,0,0.35)",
                      paddingLeft: 12,
                    }}
                  >
                    {isSv ? "Lag ej fastställda" : "Teams TBD"}
                  </div>
                </div>
              );
            }
            const serialized = {
              ...match,
              scheduledAt: match.scheduledAt.toISOString(),
              tipDeadline:
                match.tipDeadline?.toISOString() ??
                match.scheduledAt.toISOString(),
            };
            return (
              <CouponMatchRow
                key={match.id}
                match={serialized as any}
                rowIndex={idx + 1}
                locale={locale}
              />
            );
          })}

          <div
            style={{
              background: "#2d251a",
              color: "var(--coupon-bg)",
              padding: "12px 22px",
              fontFamily: "var(--f-mono)",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign: "right",
              opacity: 0.8,
            }}
          >
            {isSv
              ? "Tips stänger 24h innan match"
              : "Tips close 24h before match"}
          </div>
        </div>
      ))}
    </div>
  );
}
