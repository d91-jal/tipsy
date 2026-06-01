// app/[locale]/admin/odds/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { OddsForm } from "@/components/admin/OddsForm";
import { AdvancementOddsForm } from "@/components/admin/AdvancementOddsForm";

export default async function AdminOddsPage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) redirect({ href: "/auth/login", locale });
  const userId = session!.user.id;

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect({ href: "/", locale });
  }

  const matches = await prisma.match.findMany({
    where: {
      tournament: { slug: "wc2026" },
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    orderBy: { matchNumber: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      odds: true,
    },
  });

  const groups = await prisma.group.findMany({
    where: { tournament: { slug: "wc2026" } },
    orderBy: { name: "asc" },
    include: {
      teams: {
        include: { advancementOdds: true },
        orderBy: { nameSv: "asc" },
      },
    },
  });

  const groupMatches = matches.filter((m) => m.stage === "GROUP");
  const knockoutMatches = matches.filter((m) => m.stage !== "GROUP");
  const matchesWithOdds = matches.filter((m) => m.odds.length > 0).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          {locale === "sv" ? "Admin — Odds" : "Admin — Odds"}
        </h1>
        <span className="text-sm text-slate-500">
          {matchesWithOdds}/{matches.length}{" "}
          {locale === "sv" ? "matcher med odds" : "matches with odds"}
        </span>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        💡{" "}
        {locale === "sv"
          ? "Ange genomsnittsodds från t.ex. Unibet, Betsson och Bet365. Lägg till en rad per källa så beräknas snittet automatiskt."
          : "Enter average odds from e.g. Unibet, Betsson and Bet365. Add one row per source and the average is calculated automatically."}
      </div>

      {/* Advancement odds section */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 12 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            {locale === "sv"
              ? "Odds för avancemang · per lag"
              : "Advancement odds · per team"}
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {groups.map((group) => (
            <AdvancementOddsForm
              key={group.id}
              group={group}
              locale={locale}
              adminId={userId}
            />
          ))}
        </div>
      </section>

      {/* Match 1X2 odds — Group stage */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 12 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            {locale === "sv" ? "Matchodds · 1X2" : "Match odds · 1X2"}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {matches.map((match) => (
            <OddsForm
              key={match.id}
              match={{
                ...match,
                scheduledAt: match.scheduledAt.toISOString(),
              }}
              locale={locale}
              adminId={userId}
            />
          ))}
        </div>
      </section>

      {knockoutMatches.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div style={{ marginBottom: 12 }}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              {locale === "sv"
                ? "Matchodds · Slutspel"
                : "Match odds · Knockout"}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {knockoutMatches.map((match) => (
              <OddsForm
                key={match.id}
                match={{
                  ...match,
                  scheduledAt: match.scheduledAt.toISOString(),
                }}
                locale={locale}
                adminId={userId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
