// app/[locale]/admin/results/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { AdminResultForm } from "@/components/admin/AdminResultForm";
import { AdminAdvancementForm } from "@/components/admin/AdminAdvancementForm";
import { formatDate, stageLabel } from "@/lib/utils";

export default async function AdminResultsPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect({ href: "/", locale });
  }

  // All finished + scheduled matches
  const matches = await prisma.match.findMany({
    where: { tournament: { slug: "wc2026" } },
    orderBy: { matchNumber: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      odds: true,
    },
  });

  // Groups with teams for advancement form
  const groups = await prisma.group.findMany({
    where: { tournament: { slug: "wc2026" } },
    orderBy: { name: "asc" },
    include: {
      teams: { orderBy: { nameSv: "asc" } },
      actualAdvancements: { include: { team: true } },
    },
  });

  const pendingMatches = matches.filter(
    (m) => m.status !== "FINISHED" && m.homeTeamId && m.awayTeamId
  );
  const finishedMatches = matches.filter((m) => m.status === "FINISHED");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">
        {locale === "sv" ? "Admin — Resultat" : "Admin — Results"}
      </h1>

      {/* Pending matches */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">
          {locale === "sv" ? "Matcher att rapportera" : "Matches to report"}{" "}
          <span className="text-sm font-normal text-slate-400">({pendingMatches.length})</span>
        </h2>
        {pendingMatches.length === 0 && (
          <p className="text-slate-400 text-sm">
            {locale === "sv" ? "Inga väntande matcher" : "No pending matches"}
          </p>
        )}
        <div className="space-y-2">
          {pendingMatches.map((match) => (
            <AdminResultForm key={match.id} match={match} locale={locale} />
          ))}
        </div>
      </section>

      {/* Group advancement */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">
          {locale === "sv" ? "Vilka lag avancerade?" : "Which teams advanced?"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map((group) => (
            <AdminAdvancementForm
              key={group.id}
              group={group}
              locale={locale}
            />
          ))}
        </div>
      </section>

      {/* Finished matches */}
      {finishedMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-700">
            {locale === "sv" ? "Spelade matcher" : "Finished matches"}{" "}
            <span className="text-sm font-normal text-slate-400">({finishedMatches.length})</span>
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {finishedMatches.map((match) => (
                  <tr key={match.id} className="px-4 py-2">
                    <td className="px-4 py-2 text-slate-400 w-16">#{match.matchNumber}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{stageLabel(match.stage, locale)}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {locale === "sv" ? match.homeTeam?.nameSv : match.homeTeam?.nameEn}
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-pitch-700">
                      {match.homeScore}–{match.awayScore}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {locale === "sv" ? match.awayTeam?.nameSv : match.awayTeam?.nameEn}
                    </td>
                    <td className="px-4 py-2 text-slate-400 text-xs">
                      {formatDate(match.scheduledAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
