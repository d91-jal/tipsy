// app/[locale]/competitions/[slug]/results/ResultsContent.tsx
// Exporteras som default från results/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { getGroupStandings } from "@/lib/group-standings";
import { ResultsView } from "@/components/competitions/ResultsView";

export default async function ResultsPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const locale = await getLocale();

  const competition = await prisma.competition.findUniqueOrThrow({
    where: { slug },
    include: { tournament: { select: { id: true } } },
  });

  const matches = await prisma.match.findMany({
    where: { tournamentId: competition.tournament.id },
    orderBy: { matchNumber: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  const groupStandings = await getGroupStandings(competition.tournament.id);

  return (
    <ResultsView
      matches={matches.map((m) => ({
        ...m,
        scheduledAt: m.scheduledAt.toISOString(),
      }))}
      groupStandings={groupStandings}
      locale={locale}
    />
  );
}
