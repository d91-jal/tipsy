// app/[locale]/tips/tournament/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { TournamentTipForm } from "@/components/tips/TournamentTipForm";

export default async function TournamentTipPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect({ href: "/auth/login", locale });

  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug: "wc2026" },
    select: { id: true, oddsLockDate: true, nameSv: true, nameEn: true },
  });

  const teams = await prisma.team.findMany({
    include: {
      group: true,
      tournamentOdds: true,
    },
    orderBy: { nameEn: "asc" },
  });

  const existingTip = await prisma.tournamentTip.findUnique({
    where: { userId: session.user.id },
    include: {
      finalist1: true,
      finalist2: true,
      winner: true,
    },
  });

  const locked = new Date() > new Date(tournament.oddsLockDate);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {locale === "sv" ? "Finallag & Vinnare" : "Finalists & Winner"}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {locale === "sv"
            ? "Välj vilka 2 lag som spelar finalen och vem som vinner VM"
            : "Pick which 2 teams will play the final and who wins the tournament"}
        </p>
      </div>

      <TournamentTipForm
        tournamentId={tournament.id}
        teams={teams}
        existingTip={existingTip}
        locked={locked}
        locale={locale}
      />
    </div>
  );
}
