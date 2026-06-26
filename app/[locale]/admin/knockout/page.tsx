// app/[locale]/admin/knockout/page.tsx  — designsystem-styling
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { KnockoutMatchForm } from "@/components/admin/KnockoutMatchForm";

const STAGE_ORDER = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;

const STAGE_LABELS: Record<string, { sv: string; en: string }> = {
  ROUND_OF_32: { sv: "16-delsfinaler", en: "Round of 32" },
  ROUND_OF_16: { sv: "Åttondelsfinaler", en: "Round of 16" },
  QUARTER_FINAL: { sv: "Kvartsfinaler", en: "Quarter-finals" },
  SEMI_FINAL: { sv: "Semifinaler", en: "Semi-finals" },
  THIRD_PLACE: { sv: "Bronsmatch", en: "Third place" },
  FINAL: { sv: "Final", en: "Final" },
};

export default async function AdminKnockoutPage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) redirect({ href: "/auth/login", locale });
  if (session?.user.role !== "ADMIN") redirect({ href: "/", locale });

  const isSv = locale === "sv";

  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug: "wc2026" },
    select: { id: true },
  });

  const matches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, stage: { not: "GROUP" } },
    orderBy: { matchNumber: "asc" },
    include: { odds: true },
  });

  const teams = await prisma.team.findMany({
    where: { group: { tournamentId: tournament.id } },
    orderBy: [{ group: { name: "asc" } }, { nameSv: "asc" }],
    include: { group: { select: { name: true } } },
  });

  const teamOptions = teams.map((t) => ({
    id: t.id,
    nameSv: t.nameSv,
    nameEn: t.nameEn,
    groupName: t.group.name,
  }));

  const definedCount = matches.filter(
    (m) => m.homeTeamId && m.awayTeamId,
  ).length;

  const stages = STAGE_ORDER.map((stage) => ({
    stage,
    matches: matches.filter((m) => m.stage === stage),
  })).filter((s) => s.matches.length > 0);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          Admin · VM 2026
        </p>
        <h1
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "-0.02em",
            color: "var(--green-deep)",
            margin: 0,
          }}
        >
          {isSv ? "Slutspel — definiera matcher" : "Knockout — define matches"}
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--ink-soft)",
            maxWidth: 560,
          }}
        >
          {isSv
            ? "Sätt hemma- och bortalag samt odds (1X2) för varje slutspelsmatch. Odds är valfria — fyll i alla tre eller lämna tomt."
            : "Set the home and away teams plus 1X2 odds for each knockout match. Odds are optional — fill in all three or leave blank."}
        </p>
      </div>

      {/* Progress */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 32,
          padding: "16px 20px",
          background: "#fff",
          borderRadius: "var(--r-card)",
          boxShadow: "var(--sh-card)",
        }}
      >
        {[
          {
            label: isSv ? "Definierade" : "Defined",
            val: definedCount,
            color: "var(--green)",
          },
          {
            label: isSv ? "Återstår" : "Remaining",
            val: matches.length - definedCount,
            color: "var(--gold)",
          },
          {
            label: isSv ? "Totalt" : "Total",
            val: matches.length,
            color: "var(--ink-faint)",
          },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontWeight: 700,
                fontSize: 28,
                color,
                lineHeight: 1,
              }}
            >
              {val}
            </div>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginTop: 4,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Stages */}
      {stages.length > 0 ? (
        stages.map(({ stage, matches: stageMatches }) => (
          <div key={stage} style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 12 }}>
              <p className="eyebrow" style={{ marginBottom: 4 }}>
                {STAGE_LABELS[stage]?.[isSv ? "sv" : "en"] ?? stage}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {stageMatches.map((match) => (
                <KnockoutMatchForm
                  key={match.id}
                  match={{
                    id: match.id,
                    matchNumber: match.matchNumber,
                    stage: match.stage,
                    homeTeamId: match.homeTeamId,
                    awayTeamId: match.awayTeamId,
                    odds: match.odds.map((o) => ({
                      outcome: o.outcome as "HOME" | "DRAW" | "AWAY",
                      avgValue: o.avgValue,
                    })),
                  }}
                  teams={teamOptions}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
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
          {isSv ? "Inga slutspelsmatcher" : "No knockout matches"}
        </div>
      )}
    </div>
  );
}
