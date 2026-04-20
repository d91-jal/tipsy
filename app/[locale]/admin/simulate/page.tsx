// app/[locale]/admin/simulate/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getSimStatus } from "@/lib/actions/simulate";
import { SimulationPanel } from "@/components/admin/SimulationPanel";
import { formatDate } from "@/lib/utils";

export default async function AdminSimulatePage({
  searchParams,
}: {
  searchParams: { competitionId?: string };
}) {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user || session.user.role !== "ADMIN") redirect({ href: "/", locale });

  const isSv = locale === "sv";

  // List all simulation competitions
  const simComps = await prisma.competition.findMany({
    where: { simulationMode: true },
    orderBy: { createdAt: "desc" },
    include: {
      tournament: { select: { nameSv: true, nameEn: true, startDate: true } },
      members: { select: { isSimBot: true } },
    },
  });

  const activeId = searchParams.competitionId ?? simComps[0]?.id;
  const simStatus = activeId ? await getSimStatus(activeId) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">
        🤖 {isSv ? "Admin — Simulering" : "Admin — Simulation"}
      </h1>

      {simComps.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
          <p className="text-lg mb-2">
            {isSv ? "Inga simuleringstävlingar" : "No simulation competitions"}
          </p>
          <p className="text-sm">
            {isSv
              ? "Skapa en tävling med Simuleringsläge aktiverat under Admin → Tävlingar."
              : "Create a competition with Simulation mode enabled under Admin → Competitions."}
          </p>
        </div>
      )}

      {/* Competition selector */}
      {simComps.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {simComps.map((c) => (
            <a
              key={c.id}
              href={`?competitionId=${c.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                c.id === activeId
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </a>
          ))}
        </div>
      )}

      {simStatus && <SimulationPanel status={simStatus} locale={locale} />}
    </div>
  );
}
