// app/[locale]/tips/group-stage/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { GroupMatchCard } from "@/components/tips/GroupMatchCard";

export default async function GroupStagePage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations();

  if (!session?.user) redirect({ href: "/auth/login", locale });

  // Fetch all groups with their matches, including user's existing tips
  const groups = await prisma.group.findMany({
    where: { tournament: { slug: "wc2026" } },
    orderBy: { name: "asc" },
    include: {
      teams: { orderBy: { nameSv: "asc" } },
      matches: {
        where: { stage: "GROUP" },
        orderBy: { matchNumber: "asc" },
        include: {
          homeTeam: true,
          awayTeam: true,
          odds: true,
          matchTips: {
            where: { userId: session.user.id },
          },
        },
      },
    },
  });

  const totalMatches = groups.reduce((s, g) => s + g.matches.length, 0);
  const tippedMatches = groups.reduce(
    (s, g) => s + g.matches.filter((m) => m.matchTips.length > 0).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t("tips.groupStage")}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {locale === "sv" ? "Tippa 1X2 på varje match (resultat efter 90 min)" : "Predict 1X2 for each match (result after 90 min)"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-pitch-600">
            {tippedMatches}/{totalMatches}
          </div>
          <div className="text-xs text-slate-400">
            {locale === "sv" ? "tippade" : "tipped"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className="bg-pitch-500 h-2 rounded-full transition-all"
          style={{ width: `${totalMatches > 0 ? (tippedMatches / totalMatches) * 100 : 0}%` }}
        />
      </div>

      {/* Groups */}
      {groups.map((group) => (
        <div key={group.id} className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-pitch-500 text-white text-xs font-bold">
              {group.name}
            </span>
            {t("match.group", { group: group.name })}
          </h2>
          <div className="space-y-2">
            {group.matches.map((match) => (
              <GroupMatchCard
                key={match.id}
                match={match}
                existingTip={match.matchTips[0] ?? null}
                locale={locale}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
