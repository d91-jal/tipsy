// app/[locale]/competitions/page.tsx  — Fas 3 redesign
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/routing";
import { JoinCompetitionForm } from "@/components/competitions/JoinCompetitionForm";

export default async function CompetitionsPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect({ href: "/auth/login", locale });

  const competitions = await prisma.competition.findMany({
    where: { tournament: { isActive: true } },
    orderBy: { createdAt: "asc" },
    include: {
      tournament: { select: { nameSv: true, nameEn: true } },
      members: { select: { userId: true, isSimBot: true } },
    },
  });

  const myIds = new Set(
    competitions
      .filter((c) => c.members.some((m) => m.userId === session.user.id))
      .map((c) => c.id),
  );

  const isSv = locale === "sv";

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 40 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          VM 2026
        </p>
        <h1
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: "clamp(32px, 5vw, 52px)",
            letterSpacing: "-0.025em",
            lineHeight: 1.05,
            color: "var(--green-deep)",
            margin: "0 0 12px",
          }}
        >
          {isSv ? "Tävlingar." : "Competitions."}
        </h1>
        <p style={{ fontSize: 16, color: "var(--ink-soft)", margin: 0 }}>
          {isSv
            ? "Gå med i en tävling för att se topplistan och jämföra tips."
            : "Join a competition to view the standings and compare tips."}
        </p>
      </div>

      {competitions.length === 0 && (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-card)",
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
          }}
        >
          {isSv ? "Inga aktiva tävlingar ännu" : "No active competitions yet"}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {competitions.map((comp) => {
          const isMember = myIds.has(comp.id);
          const realMembers = comp.members.filter((m) => !m.isSimBot).length;
          const tournamentName = isSv
            ? comp.tournament.nameSv
            : comp.tournament.nameEn;

          return (
            <div
              key={comp.id}
              style={{
                borderTop: "2px solid var(--hairline)",
                padding: "24px 0",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 24,
                alignItems: "center",
              }}
            >
              {/* Left: info */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--f-display)",
                      fontWeight: 600,
                      fontSize: 22,
                      letterSpacing: "-0.01em",
                      color: "var(--ink)",
                    }}
                  >
                    {comp.name}
                  </span>
                  {comp.simulationMode && (
                    <span
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--gold)",
                        border: "1px solid var(--gold-soft)",
                        borderRadius: "var(--r-pill)",
                        padding: "2px 8px",
                      }}
                    >
                      🤖 {isSv ? "Simulering" : "Simulation"}
                    </span>
                  )}
                  {!comp.isPublic && (
                    <span
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--ink-faint)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--r-pill)",
                        padding: "2px 8px",
                      }}
                    >
                      🔒
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 10.5,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-faint)",
                    }}
                  >
                    {tournamentName}
                  </span>
                  <span style={{ color: "var(--hairline)" }}>·</span>
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 10.5,
                      color: "var(--ink-faint)",
                    }}
                  >
                    {realMembers} {isSv ? "deltagare" : "participants"}
                  </span>
                  {isMember && (
                    <>
                      <span style={{ color: "var(--hairline)" }}>·</span>
                      <span
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontSize: 10,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--green)",
                        }}
                      >
                        ✓ {isSv ? "Medlem" : "Member"}
                      </span>
                    </>
                  )}
                </div>
                {comp.description && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--ink-soft)",
                      margin: "8px 0 0",
                    }}
                  >
                    {comp.description}
                  </p>
                )}
              </div>

              {/* Right: action */}
              <div>
                {isMember ? (
                  <Link
                    href={`/competitions/${comp.slug}` as any}
                    style={{
                      fontFamily: "var(--f-sans)",
                      fontWeight: 600,
                      fontSize: 13,
                      padding: "9px 20px",
                      borderRadius: "var(--r-pill)",
                      background: "var(--green-deep)",
                      color: "var(--cream)",
                      textDecoration: "none",
                      display: "inline-block",
                      transition: "background 0.15s",
                    }}
                  >
                    {isSv ? "Se ställning →" : "View standings →"}
                  </Link>
                ) : (
                  <JoinCompetitionForm
                    competitionId={comp.id}
                    isPublic={comp.isPublic}
                    locale={locale}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
