// app/[locale]/tips/advancement/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { AdvancementCard } from "@/components/tips/AdvancementCard";

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
      teams: {
        include: { advancementOdds: true },
        orderBy: { nameSv: "asc" },
      },
      advancementTips: {
        where: { userId: session.user.id },
        include: { firstTeam: true, secondTeam: true },
      },
    },
  });

  const locked = new Date() > new Date(tournament.oddsLockDate);
  const tipped = groups.filter((g) => g.advancementTips.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {locale === "sv" ? "Vilka lag går vidare?" : "Which teams advance?"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {locale === "sv"
              ? "Välj 2 lag som tar sig vidare från varje grupp"
              : "Select 2 teams that advance from each group"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-pitch-600">{tipped}/{groups.length}</div>
          <div className="text-xs text-slate-400">{locale === "sv" ? "tippade" : "tipped"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups.map((group) => (
          <AdvancementCard
            key={group.id}
            group={group}
            existingTip={group.advancementTips[0] ?? null}
            locked={locked}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
