import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { TournamentFinalsForm } from "@/components/admin/TournamentFinalsForm";

export default async function AdminFinalsPage() {
  const locale = await getLocale();
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== "ADMIN") {
    redirect({ href: user ? "/" : "/auth/login", locale });
  }

  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug: "wc2026" },
    select: { id: true },
  });

  const teams = await prisma.team.findMany({
    where: { group: { tournamentId: tournament.id } },
    include: { group: true },
    orderBy: [{ group: { name: "asc" } }, { nameSv: "asc" }],
  });

  const existingResult = await prisma.tournamentActualResult.findUnique({
    where: { tournamentId: tournament.id },
    include: { finalist1: true, finalist2: true, winner: true },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Admin · VM 2026
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {locale === "sv" ? "Finaler" : "Finals"}
        </h1>
      </div>

      <TournamentFinalsForm
        tournamentId={tournament.id}
        teams={teams}
        existingResult={existingResult}
        locale={locale}
      />
    </div>
  );
}
