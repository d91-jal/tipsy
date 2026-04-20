// app/[locale]/tips/knockout/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { GroupMatchCard } from "@/components/tips/GroupMatchCard";
import { stageLabel } from "@/lib/utils";

const KNOCKOUT_STAGES = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
] as const;

export default async function KnockoutPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect({ href: "/auth/login", locale });

  const matches = await prisma.match.findMany({
    where: {
      tournament: { slug: "wc2026" },
      stage: { not: "GROUP" },
    },
    orderBy: { matchNumber: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      odds: true,
      matchTips: {
        where: { userId: session.user.id },
      },
    },
  });

  // Group by stage
  const byStage = KNOCKOUT_STAGES.map((stage) => ({
    stage,
    label: stageLabel(stage, locale),
    matches: matches.filter((m) => m.stage === stage),
  })).filter((s) => s.matches.length > 0);

  const availableMatches = matches.filter(
    (m) => m.homeTeamId && m.awayTeamId
  );
  const tipped = availableMatches.filter((m) => m.matchTips.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {locale === "sv" ? "Slutspel" : "Knockout Stage"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {locale === "sv"
              ? "Tips stänger 24 timmar innan varje match"
              : "Tips close 24 hours before each match"}
          </p>
        </div>
        {availableMatches.length > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-pitch-600">
              {tipped}/{availableMatches.length}
            </div>
            <div className="text-xs text-slate-400">
              {locale === "sv" ? "tippade" : "tipped"}
            </div>
          </div>
        )}
      </div>

      {byStage.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">⏳</div>
          <p className="font-medium">
            {locale === "sv"
              ? "Slutspelet börjar när gruppspelet är klart"
              : "Knockout stage begins after the group stage"}
          </p>
        </div>
      )}

      {byStage.map(({ stage, label, matches }) => (
        <div key={stage} className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-700">{label}</h2>
          <div className="space-y-2">
            {matches.map((match) =>
              match.homeTeamId && match.awayTeamId ? (
                <GroupMatchCard
                  key={match.id}
                  match={match}
                  existingTip={match.matchTips[0] ?? null}
                  locale={locale}
                />
              ) : (
                <div
                  key={match.id}
                  className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400"
                >
                  #{match.matchNumber} —{" "}
                  {locale === "sv" ? "Lag ej fastställda ännu" : "Teams not yet determined"}
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
