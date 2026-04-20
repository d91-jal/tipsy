// app/[locale]/competitions/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
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
      members: {
        select: { userId: true, isSimBot: true },
      },
    },
  });

  const myIds = new Set(
    competitions
      .filter((c) => c.members.some((m) => m.userId === session.user.id))
      .map((c) => c.id)
  );

  const isSv = locale === "sv";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isSv ? "Tävlingar" : "Competitions"}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isSv
            ? "Gå med i en tävling eller se ställningen"
            : "Join a competition or view the standings"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {competitions.map((comp) => {
          const isMember = myIds.has(comp.id);
          const realMembers = comp.members.filter((m) => !m.isSimBot).length;
          const tournamentName = isSv ? comp.tournament.nameSv : comp.tournament.nameEn;

          return (
            <Card key={comp.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>{comp.name}</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">{tournamentName}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {comp.simulationMode && (
                    <Badge variant="warning">🤖 {isSv ? "Simulering" : "Simulation"}</Badge>
                  )}
                  {!comp.isPublic && (
                    <Badge variant="muted">🔒</Badge>
                  )}
                  {isMember && (
                    <Badge variant="success">✓ {isSv ? "Medlem" : "Member"}</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between gap-4">
                {comp.description && (
                  <p className="text-sm text-slate-500">{comp.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {realMembers} {isSv ? "deltagare" : "participants"}
                  </span>

                  {isMember ? (
                    <Link
                      href={`/competitions/${comp.slug}` as any}
                      className="px-3 py-1.5 rounded-lg bg-pitch-500 text-white text-sm font-medium
                                 hover:bg-pitch-600 transition-colors"
                    >
                      {isSv ? "Se ställning" : "View standings"}
                    </Link>
                  ) : (
                    <JoinCompetitionForm
                      competitionId={comp.id}
                      isPublic={comp.isPublic}
                      locale={locale}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {competitions.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">🏆</div>
          <p>{isSv ? "Inga aktiva tävlingar ännu" : "No active competitions yet"}</p>
        </div>
      )}
    </div>
  );
}
