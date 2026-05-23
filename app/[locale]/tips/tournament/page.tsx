// app/[locale]/tips/tournament/page.tsx  — Fas 3 redesign
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
    select: { id: true, oddsLockDate: true },
  });

  const teams = await prisma.team.findMany({
    include: { group: true, tournamentOdds: true },
    orderBy: { nameEn: "asc" },
  });

  const existingTip = await prisma.tournamentTip.findUnique({
    where: { userId: session!.user.id },
    select: {
      finalist1Id: true,
      finalist2Id: true,
      winnerId: true,
      pointsEarned: true,
    },
  });

  const locked = new Date() > new Date(tournament.oddsLockDate);
  const isSv = locale === "sv";

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 36 }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          {isSv ? "Tips · VM 2026" : "Predictions · WC 2026"}
        </p>
        <h1
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: "clamp(28px, 4vw, 44px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            color: "var(--green-deep)",
            margin: "0 0 10px",
          }}
        >
          {isSv ? "Finallag & Vinnare." : "Finalists & Winner."}
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: 0 }}>
          {isSv
            ? "Välj vilka 2 lag som spelar finalen och vem som vinner VM."
            : "Pick which 2 teams play the final and who wins the World Cup."}
        </p>
      </div>

      <div style={{ maxWidth: 580 }}>
        <TournamentTipForm
          tournamentId={tournament.id}
          teams={teams.map((t) => ({
            ...t,
            tournamentOdds: t.tournamentOdds.map((o) => ({
              ...o,
              avgValue: Number(o.avgValue),
            })),
          }))}
          existingTip={
            existingTip
              ? { ...existingTip, pointsEarned: existingTip.pointsEarned }
              : null
          }
          locked={locked}
          locale={locale}
        />
      </div>
    </div>
  );
}
