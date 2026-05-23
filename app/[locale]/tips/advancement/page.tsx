// app/[locale]/tips/advancement/page.tsx  — Fas 3 redesign
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { AdvancementCard } from "@/components/tips/AdvancementCard";
import { getGroupStandings } from "@/lib/group-standings";
import { GroupTablesGrid } from "@/components/competitions/GroupTable";

export default async function AdvancementPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect({ href: "/auth/login", locale });

  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug: "wc2026" },
    select: { id: true, oddsLockDate: true },
  });

  const groups = await prisma.group.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { name: "asc" },
    include: {
      teams: { include: { advancementOdds: true }, orderBy: { nameSv: "asc" } },
      advancementTips: {
        where: { userId: session!.user.id },
        include: { firstTeam: true, secondTeam: true },
      },
    },
  });

  const groupStandings = await getGroupStandings(tournament.id);

  const locked = new Date() > new Date(tournament.oddsLockDate);
  const tipped = groups.filter((g) => g.advancementTips.length > 0).length;
  const isSv = locale === "sv";

  return (
    <div className="space-y-12">
      {/* Page header */}
      <div
        style={{
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
            {isSv ? "Avancemang." : "Advancement."}{" "}
            <span style={{ fontStyle: "italic", color: "var(--green)" }}>
              {isSv ? "Vilka går vidare?" : "Who advances?"}
            </span>
          </h1>
        </div>
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
              / {groups.length}
            </span>
          </div>
        </div>
      </div>

      {/* Advancement cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {groups.map((group) => (
          <AdvancementCard
            key={group.id}
            group={{
              ...group,
              teams: group.teams.map((t) => ({
                ...t,
                advancementOdds: t.advancementOdds
                  ? { avgValue: Number(t.advancementOdds[0].avgValue) }
                  : null,
              })),
            }}
            existingTip={
              group.advancementTips[0]
                ? {
                    firstTeamId: group.advancementTips[0].firstTeamId,
                    secondTeamId: group.advancementTips[0].secondTeamId,
                    pointsEarned: group.advancementTips[0].pointsEarned,
                  }
                : null
            }
            locked={locked}
            locale={locale}
          />
        ))}
      </div>

      {/* Group standings */}
      <div style={{ borderTop: "2px solid var(--hairline)", paddingTop: 40 }}>
        <GroupTablesGrid groups={groupStandings} locale={locale} />
      </div>
    </div>
  );
}
