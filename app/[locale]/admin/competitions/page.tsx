// app/[locale]/admin/competitions/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { CreateCompetitionForm } from "@/components/admin/CreateCompetitionForm";
import { AddMemberForm } from "@/components/admin/AddMemberForm";
import { Badge } from "@/components/ui";
import { Link } from "@/i18n/routing";

export default async function AdminCompetitionsPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user || session.user.role !== "ADMIN") redirect({ href: "/", locale });

  const isSv = locale === "sv";

  const tournaments = await prisma.tournament.findMany({
    select: { slug: true, nameSv: true, nameEn: true },
  });

  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tournament: { select: { nameSv: true, nameEn: true } },
      members: { select: { userId: true, isSimBot: true } },
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">
        {isSv ? "Admin — Tävlingar" : "Admin — Competitions"}
      </h1>

      {/* Create new */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">
          {isSv ? "Skapa ny tävling" : "Create new competition"}
        </h2>
        <CreateCompetitionForm
          tournaments={tournaments.map((t) => ({
            slug: t.slug,
            name: isSv ? t.nameSv : t.nameEn,
          }))}
          locale={locale}
        />
      </section>

      {/* Existing competitions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">
          {isSv ? "Alla tävlingar" : "All competitions"}{" "}
          <span className="text-sm font-normal text-slate-400">({competitions.length})</span>
        </h2>

        <div className="space-y-4">
          {competitions.map((comp) => {
            const realCount = comp.members.filter((m) => !m.isSimBot).length;
            const botCount = comp.members.filter((m) => m.isSimBot).length;
            return (
              <div key={comp.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{comp.name}</h3>
                      {comp.simulationMode && <Badge variant="warning">🤖 Sim</Badge>}
                      {!comp.isPublic && <Badge variant="muted">🔒</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isSv ? comp.tournament.nameSv : comp.tournament.nameEn} · slug: {comp.slug}
                    </p>
                    {comp.accessCode && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        {isSv ? "Kod:" : "Code:"} <code className="font-mono">{comp.accessCode}</code>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 shrink-0">
                    <span>👥 {realCount}</span>
                    {botCount > 0 && <span>🤖 {botCount}</span>}
                    {comp.simulationMode && (
                      <Link
                        href={`/admin/simulate?competitionId=${comp.id}` as any}
                        className="text-pitch-600 hover:underline font-medium"
                      >
                        {isSv ? "Simulera →" : "Simulate →"}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Add member */}
                <AddMemberForm competitionId={comp.id} locale={locale} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
