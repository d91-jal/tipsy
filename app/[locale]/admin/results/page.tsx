// app/[locale]/admin/results/page.tsx  — designsystem-styling
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { AdminResultForm } from "@/components/admin/AdminResultForm";

export default async function AdminResultsPage() {
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
    where: { tournament: { slug: "wc2026" } },
    orderBy: { matchNumber: "asc" },
    include: { homeTeam: true, awayTeam: true, odds: true },
  });

  const pendingMatches = matches.filter(
    (m) => m.status !== "FINISHED" && m.homeTeamId && m.awayTeamId,
  );
  const finishedMatches = matches.filter((m) => m.status === "FINISHED");

  const sectionStyle: React.CSSProperties = {
    marginBottom: 32,
  };

  const sectionHeadStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  };

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
          {isSv ? "Matchresultat" : "Match Results"}
        </h1>
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
            label: isSv ? "Spelade" : "Played",
            val: finishedMatches.length,
            color: "var(--green)",
          },
          {
            label: isSv ? "Återstår" : "Remaining",
            val: pendingMatches.length,
            color: "var(--gold)",
          },
          {
            label: isSv ? "Totalt" : "Total",
            val: matches.filter((m) => m.homeTeamId).length,
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

      {/* Pending matches */}
      {pendingMatches.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeadStyle}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>
                {isSv ? "Ej spelade" : "Not played"}
              </p>
            </div>
            <span
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10.5,
                color: "var(--ink-faint)",
              }}
            >
              {pendingMatches.length} {isSv ? "matcher" : "matches"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {pendingMatches.map((match) => (
              <AdminResultForm
                key={match.id}
                match={{
                  ...match,
                  scheduledAt: match.scheduledAt.toISOString(),
                }}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Finished matches */}
      {finishedMatches.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeadStyle}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 4 }}>
                {isSv
                  ? "Spelade — klicka för att korrigera"
                  : "Played — click to correct"}
              </p>
            </div>
            <span
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10.5,
                color: "var(--ink-faint)",
              }}
            >
              {finishedMatches.length} {isSv ? "matcher" : "matches"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {finishedMatches.map((match) => (
              <AdminResultForm
                key={match.id}
                match={{
                  ...match,
                  scheduledAt: match.scheduledAt.toISOString(),
                }}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {pendingMatches.length === 0 && finishedMatches.length === 0 && (
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
          {isSv ? "Inga matcher att visa" : "No matches to show"}
        </div>
      )}
    </div>
  );
}
