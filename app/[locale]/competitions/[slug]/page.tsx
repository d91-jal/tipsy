// app/[locale]/competitions/[slug]/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getLeaderboard } from "@/lib/scoring";
import { formatPoints, cn } from "@/lib/utils";
import { VisibilityToggle } from "@/components/competitions/VisibilityToggle";
import { Badge } from "@/components/ui";

export const revalidate = 60;

export default async function CompetitionStandingsPage({
  params: { slug, locale: _locale },
}: {
  params: { slug: string; locale: string };
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect({ href: "/auth/login", locale });

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      tournament: { select: { nameSv: true, nameEn: true, oddsLockDate: true } },
    },
  });
  if (!competition) notFound();

  // Check membership
  const myMembership = await prisma.competitionMember.findUnique({
    where: {
      competitionId_userId: {
        competitionId: competition.id,
        userId: session.user.id,
      },
    },
  });
  if (!myMembership) redirect({ href: "/competitions", locale });

  const leaderboard = await getLeaderboard(competition.id);
  const isSv = locale === "sv";
  const isLocked = new Date() > new Date(competition.tournament.oddsLockDate);
  const tournamentName = isSv ? competition.tournament.nameSv : competition.tournament.nameEn;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">{tournamentName}</p>
          <h1 className="text-2xl font-bold text-slate-800">{competition.name}</h1>
          {competition.description && (
            <p className="text-sm text-slate-500 mt-1">{competition.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {competition.simulationMode && (
            <Badge variant="warning">🤖 {isSv ? "Simulering" : "Simulation"}</Badge>
          )}
          {/* My visibility toggle */}
          <VisibilityToggle
            competitionId={competition.id}
            current={myMembership.tipsPublic}
            locale={locale}
          />
        </div>
      </div>

      {/* Info about tip visibility */}
      {!isLocked && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
          🔒 {isSv
            ? "Tips är dolda för övriga tills låsdatum passerat, om inte spelaren valt att visa dem."
            : "Tips are hidden from others until the deadline, unless the player has chosen to show them."}
        </div>
      )}

      {/* Leaderboard table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-10">#</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                {isSv ? "Spelare" : "Player"}
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-500 hidden sm:table-cell">
                {isSv ? "Match" : "Match"}
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-500 hidden md:table-cell">
                {isSv ? "Avancemang" : "Advancement"}
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-500 hidden md:table-cell">
                {isSv ? "Final" : "Final"}
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">
                {isSv ? "Totalt" : "Total"}
              </th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {leaderboard.map((entry, i) => {
              const isMe = entry.userId === session.user.id;
              const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;
              return (
                <tr
                  key={entry.userId}
                  className={cn(
                    "transition-colors",
                    isMe ? "bg-pitch-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  )}
                >
                  <td className="px-4 py-3 text-slate-500">
                    {medal ?? entry.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", isMe && "text-pitch-700 font-semibold")}>
                        {entry.name ?? entry.email.split("@")[0]}
                        {isMe && (
                          <span className="ml-1 text-xs font-normal text-pitch-400">
                            ({isSv ? "du" : "you"})
                          </span>
                        )}
                      </span>
                      {entry.isSimBot && (
                        <span className="text-xs text-slate-300">🤖</span>
                      )}
                      {entry.tipsPublic && !isLocked && (
                        <span title={isSv ? "Tips visas" : "Tips visible"} className="text-xs text-pitch-400">👁</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 hidden sm:table-cell">
                    {formatPoints(entry.matchPoints)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">
                    {formatPoints(entry.advancementPoints)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">
                    {formatPoints(entry.tournamentPoints)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatPoints(entry.totalPoints)}
                    <span className="ml-1 text-xs font-normal text-slate-400">p</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* Could link to player detail view in future */}
                  </td>
                </tr>
              );
            })}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  {isSv ? "Inga poäng ännu" : "No points yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 text-center">
        {isSv ? "Uppdateras inom en minut efter varje resultat" : "Updates within a minute of each result"}
      </p>
    </div>
  );
}
