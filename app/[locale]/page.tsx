// app/[locale]/page.tsx
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();
  const session = await auth();

  const tournament = await prisma.tournament.findUnique({
    where: { slug: "wc2026" },
    select: { nameSv: true, nameEn: true, startDate: true, oddsLockDate: true },
  });

  const tournamentName = locale === "sv" ? tournament?.nameSv : tournament?.nameEn;
  const now = new Date();
  const lockDate = tournament?.oddsLockDate;
  const startDate = tournament?.startDate;
  const isLocked = lockDate ? now > lockDate : false;
  const daysUntilLock = lockDate
    ? Math.max(0, Math.ceil((lockDate.getTime() - now.getTime()) / 86400000))
    : null;

  const tipSections = [
    {
      href: "/tips/group-stage" as const,
      labelKey: "tips.groupStage" as const,
      icon: "⚽",
      description: locale === "sv"
        ? "Tippa 1X2 på alla 72 gruppspelsmatcher"
        : "Predict 1X2 for all 72 group stage matches",
    },
    {
      href: "/tips/advancement" as const,
      labelKey: "tips.advancement" as const,
      icon: "🏆",
      description: locale === "sv"
        ? "Vilka lag tar sig vidare från varje grupp?"
        : "Which teams advance from each group?",
    },
    {
      href: "/tips/knockout" as const,
      labelKey: "tips.knockout" as const,
      icon: "⚔️",
      description: locale === "sv"
        ? "Tippa slutspelsmatcherna — låses löpande"
        : "Predict knockout matches — locked per match",
    },
    {
      href: "/tips/tournament" as const,
      labelKey: "tips.tournament" as const,
      icon: "🥇",
      description: locale === "sv"
        ? "Vilka lag spelar finalen och vem vinner VM?"
        : "Who plays the final and who wins the World Cup?",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-pitch-600 to-pitch-700 p-8 text-white shadow-lg">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-3xl font-bold mb-1">{tournamentName}</h1>
        {startDate && (
          <p className="text-pitch-50 text-sm">
            {locale === "sv" ? "Turnering startar" : "Tournament starts"}:{" "}
            <strong>{formatDate(startDate, locale)}</strong>
          </p>
        )}
        {!isLocked && daysUntilLock !== null && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium">
            ⏰{" "}
            {locale === "sv"
              ? `Tips för gruppspelet stänger om ${daysUntilLock} dag${daysUntilLock !== 1 ? "ar" : ""}`
              : `Group tips close in ${daysUntilLock} day${daysUntilLock !== 1 ? "s" : ""}`}
          </div>
        )}
        {isLocked && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium">
            🔒 {locale === "sv" ? "Grupptips är stängda" : "Group tips are closed"}
          </div>
        )}
      </div>

      {/* Tip sections grid */}
      {session ? (
        <>
          <h2 className="text-xl font-semibold text-slate-700">
            {locale === "sv" ? "Dina tipskategorier" : "Your tip categories"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tipSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm
                           hover:border-pitch-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{section.icon}</span>
                  <span className="font-semibold text-slate-800 group-hover:text-pitch-600">
                    {t(section.labelKey)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{section.description}</p>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/standings"
              className="inline-flex items-center gap-2 rounded-lg bg-pitch-500 px-6 py-3 font-semibold text-white
                         hover:bg-pitch-600 transition-colors"
            >
              📊 {t("standings.title")}
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-12 space-y-4">
          <p className="text-slate-600 text-lg">
            {locale === "sv"
              ? "Logga in för att börja tippa!"
              : "Log in to start predicting!"}
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-pitch-500 px-6 py-3 font-semibold text-white
                       hover:bg-pitch-600 transition-colors"
          >
            {t("auth.login")}
          </Link>
        </div>
      )}
    </div>
  );
}
