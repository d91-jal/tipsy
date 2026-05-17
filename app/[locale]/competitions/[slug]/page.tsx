// app/[locale]/competitions/[slug]/page.tsx  — Fas 3 redesign
// Dark green hero band + mono leaderboard table.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getLeaderboard } from "@/lib/scoring";
import { getGroupStandings } from "@/lib/group-standings";
import { GroupTablesGrid } from "@/components/competitions/GroupTable";
import { VisibilityToggle } from "@/components/competitions/VisibilityToggle";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export default async function CompetitionStandingsPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect({ href: "/auth/login", locale });

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      tournament: {
        select: { id: true, nameSv: true, nameEn: true, oddsLockDate: true },
      },
    },
  });
  if (!competition) notFound();

  const myMembership = await prisma.competitionMember.findUnique({
    where: {
      competitionId_userId: {
        competitionId: competition.id,
        userId: session.user.id,
      },
    },
  });
  if (!myMembership) redirect({ href: "/competitions", locale });

  const [leaderboard, groupStandings] = await Promise.all([
    getLeaderboard(competition.id),
    getGroupStandings(competition.tournament.id),
  ]);

  const isSv = locale === "sv";
  const isLocked = new Date() > new Date(competition.tournament.oddsLockDate);
  const tournamentName = isSv
    ? competition.tournament.nameSv
    : competition.tournament.nameEn;
  const myEntry = leaderboard.find((e) => e.userId === session.user.id);

  return (
    <div className="space-y-10">
      {/* ── Dark hero band ──────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--green-deep)",
          color: "#fff",
          borderRadius: "var(--r-card)",
          padding: "36px 40px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 32,
            alignItems: "flex-start",
          }}
        >
          <div>
            <div className="eyebrow eyebrow-gold" style={{ marginBottom: 12 }}>
              {tournamentName}
            </div>
            <h1
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 600,
                fontSize: 36,
                letterSpacing: "-0.02em",
                color: "#fff",
                margin: "0 0 6px",
                lineHeight: 1.05,
              }}
            >
              {competition.name}
            </h1>
            {competition.description && (
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                }}
              >
                {competition.description}
              </p>
            )}
          </div>

          {/* My rank + points */}
          {myEntry && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 4,
                }}
              >
                {isSv ? "Din placering" : "Your rank"}
              </div>
              <div
                style={{
                  fontFamily: "var(--f-display)",
                  fontWeight: 600,
                  fontStyle: "italic",
                  fontSize: 52,
                  color: "var(--gold)",
                  lineHeight: 1,
                }}
              >
                {myEntry.rank}
              </div>
              <div
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 4,
                }}
              >
                {myEntry.totalPoints.toFixed(1)} p · {leaderboard.length}{" "}
                {isSv ? "spelare" : "players"}
              </div>
            </div>
          )}
        </div>

        {/* Visibility toggle */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <VisibilityToggle
            competitionId={competition.id}
            current={myMembership.tipsPublic}
            locale={locale}
          />
        </div>
      </div>

      {!isLocked && (
        <div
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
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
            ? "Tips dolda tills låsdatum passerat, om inte spelaren valt att visa dem."
            : "Tips hidden until deadline, unless the player has chosen to share them."}
        </div>
      )}

      {/* ── Leaderboard ─────────────────────────────────────────────── */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <p className="eyebrow">{isSv ? "Ledartavla" : "Leaderboard"}</p>
        </div>

        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr 72px 72px 72px 80px 32px",
            background: "var(--green-deep)",
            color: "var(--gold)",
            padding: "10px 20px",
            borderRadius: "var(--r-input) var(--r-input) 0 0",
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <span>#</span>
          <span>{isSv ? "Spelare" : "Player"}</span>
          <span style={{ textAlign: "right" }}>{isSv ? "Match" : "Match"}</span>
          <span style={{ textAlign: "right" }}>{isSv ? "Adv." : "Adv."}</span>
          <span style={{ textAlign: "right" }}>{isSv ? "Final" : "Final"}</span>
          <span style={{ textAlign: "right", color: "#fff" }}>
            {isSv ? "Totalt" : "Total"}
          </span>
          <span />
        </div>

        {/* Rows */}
        <div
          style={{
            border: "1px solid var(--hairline)",
            borderTop: "none",
            borderRadius: "0 0 var(--r-card) var(--r-card)",
            overflow: "hidden",
          }}
        >
          {leaderboard.map((entry, i) => {
            const isMe = entry.userId === session.user.id;
            const isFirst = entry.rank === 1;
            const medal =
              entry.rank === 1
                ? "🥇"
                : entry.rank === 2
                  ? "🥈"
                  : entry.rank === 3
                    ? "🥉"
                    : null;
            const canViewTips = isMe || isLocked || entry.tipsPublic;

            return (
              <div
                key={entry.userId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 72px 72px 72px 80px 32px",
                  padding: "14px 20px",
                  alignItems: "center",
                  borderTop: i > 0 ? "1px solid var(--hairline)" : "none",
                  background: isFirst
                    ? "rgba(203, 162, 88, 0.08)"
                    : isMe
                      ? "var(--green-pale)"
                      : i % 2 === 0
                        ? "#fff"
                        : "var(--cream)",
                }}
              >
                {/* Position */}
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: isFirst ? "var(--gold)" : "var(--ink-faint)",
                  }}
                >
                  {medal ?? String(entry.rank).padStart(2, "0")}
                </div>

                {/* Name */}
                <div>
                  <span
                    style={{
                      fontFamily: "var(--f-serif)",
                      fontWeight: 600,
                      fontSize: 16,
                      letterSpacing: "-0.01em",
                      color: isMe ? "var(--green-deep)" : "var(--ink)",
                    }}
                  >
                    {entry.name ?? entry.email.split("@")[0]}
                  </span>
                  {isMe && (
                    <span
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: 9,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--green)",
                        marginLeft: 8,
                      }}
                    >
                      {isSv ? "du" : "you"}
                    </span>
                  )}
                  {entry.isSimBot && (
                    <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.4 }}>
                      🤖
                    </span>
                  )}
                </div>

                {/* Points columns */}
                {[
                  entry.matchPoints,
                  entry.advancementPoints,
                  entry.tournamentPoints,
                ].map((pts, j) => (
                  <div
                    key={j}
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--f-mono)",
                      fontSize: 13,
                      color: "var(--ink-soft)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {pts > 0 ? pts.toFixed(1) : "—"}
                  </div>
                ))}

                {/* Total */}
                <div
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--f-mono)",
                    fontWeight: 700,
                    fontSize: 15,
                    color: isFirst
                      ? "var(--gold)"
                      : isMe
                        ? "var(--green-deep)"
                        : "var(--ink)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {entry.totalPoints > 0 ? entry.totalPoints.toFixed(1) : "0"}
                </div>

                {/* Link */}
                <div style={{ textAlign: "right" }}>
                  <Link
                    href={`/competitions/${slug}/player/${entry.userId}` as any}
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 13,
                      color: canViewTips ? "var(--green)" : "var(--hairline)",
                      textDecoration: "none",
                      pointerEvents: canViewTips ? "auto" : "none",
                    }}
                    title={
                      canViewTips
                        ? isSv
                          ? "Visa kupong"
                          : "View coupon"
                        : isSv
                          ? "Tips dolda"
                          : "Tips hidden"
                    }
                  >
                    {canViewTips ? "→" : "🔒"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Group standings ──────────────────────────────────────────── */}
      <GroupTablesGrid groups={groupStandings} locale={locale} />

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            margin: 0,
          }}
        >
          {isSv ? "Uppdateras efter varje match" : "Updated after every match"}
        </p>
        <Link
          href={`/competitions/${slug}/coupons` as any}
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--green)",
            textDecoration: "none",
          }}
        >
          {isSv ? "Alla kuponger →" : "All coupons →"}
        </Link>
      </div>
    </div>
  );
}
