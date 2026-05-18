// app/[locale]/competitions/[slug]/player/[userId]/page.tsx
// Shows a single player's complete tip coupon with earned points.
// Respects tipsPublic / deadline visibility rules.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { PlayerCoupon } from "@/components/competitions/PlayerCoupon";
import { BackLink } from "@/components/layout/BackLink";

export default async function PlayerPage({
  params: { slug, userId },
}: {
  params: { slug: string; userId: string };
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect({ href: "/auth/login", locale });

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      tournament: {
        select: { id: true, oddsLockDate: true, nameSv: true, nameEn: true },
      },
    },
  });
  if (!competition) notFound();

  // Verify viewer is a member
  const viewerMembership = await prisma.competitionMember.findUnique({
    where: {
      competitionId_userId: {
        competitionId: competition.id,
        userId: session.user.id,
      },
    },
  });
  if (!viewerMembership) redirect({ href: "/competitions", locale });

  // Fetch the target player's membership
  const playerMembership = await prisma.competitionMember.findUnique({
    where: { competitionId_userId: { competitionId: competition.id, userId } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!playerMembership) notFound();

  const isOwnProfile = session.user.id === userId;
  const isLocked = new Date() > new Date(competition.tournament.oddsLockDate);
  const canView = isOwnProfile || isLocked || playerMembership.tipsPublic;

  // Match tips with match details
  const groups = await prisma.group.findMany({
    where: { tournamentId: competition.tournament.id },
    orderBy: { name: "asc" },
    include: {
      matches: {
        where: { stage: "GROUP" },
        orderBy: { matchNumber: "asc" },
        include: {
          homeTeam: true,
          awayTeam: true,
          odds: true,
          matchTips: canView
            ? { where: { userId } }
            : { where: { userId: "none" } },
        },
      },
    },
  });

  const knockoutMatches = await prisma.match.findMany({
    where: {
      tournamentId: competition.tournament.id,
      stage: { not: "GROUP" },
      homeTeamId: { not: null },
    },
    orderBy: { matchNumber: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      odds: true,
      matchTips: canView
        ? { where: { userId } }
        : { where: { userId: "none" } },
    },
  });

  const advancementTips = canView
    ? await prisma.groupAdvancementTip.findMany({
        where: { userId, group: { tournamentId: competition.tournament.id } },
        include: {
          group: true,
          firstTeam: true,
          secondTeam: true,
        },
      })
    : [];

  const tournamentTip = canView
    ? await prisma.tournamentTip.findUnique({
        where: { userId },
        include: { finalist1: true, finalist2: true, winner: true },
      })
    : null;

  // Totals
  const matchPoints = [
    ...groups.flatMap((g) => g.matches.flatMap((m) => m.matchTips)),
    ...knockoutMatches.flatMap((m) => m.matchTips),
  ].reduce((sum, t) => sum + (t.pointsEarned ?? 0), 0);

  const advPoints = advancementTips.reduce(
    (sum, t) => sum + (t.pointsEarned ?? 0),
    0,
  );
  const tournPoints = tournamentTip?.pointsEarned ?? 0;

  const isSv = locale === "sv";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <BackLink
        href={`/competitions/${slug}`}
        label={isSv ? "Tillbaka till ställningen" : "Back to standings"}
      />

      {/* Player header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {playerMembership.user.name ??
              playerMembership.user.email.split("@")[0]}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{competition.name}</p>
        </div>

        {/* Point summary */}
        <div className="flex gap-3 text-center shrink-0">
          {[
            { label: isSv ? "Match" : "Match", val: matchPoints },
            { label: isSv ? "Adv." : "Adv.", val: advPoints },
            { label: isSv ? "Final" : "Final", val: tournPoints },
            {
              label: isSv ? "Totalt" : "Total",
              val: matchPoints + advPoints + Number(tournPoints),
              bold: true,
            },
          ].map(({ label, val, bold }) => (
            <div
              key={label}
              className={`rounded-lg border px-3 py-2 min-w-[56px] ${bold ? "border-pitch-200 bg-pitch-50" : "border-slate-200 bg-white"}`}
            >
              <div
                className={`text-lg font-bold ${bold ? "text-pitch-700" : "text-slate-800"}`}
              >
                {Number(val).toFixed(1).replace(".0", "")}
              </div>
              <div className="text-[10px] text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {!canView ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-400">
          🔒{" "}
          {isSv
            ? "Den här spelarens tips är dolda tills låsdatum passerar."
            : "This player's tips are hidden until the deadline passes."}
        </div>
      ) : (
        <PlayerCoupon
          groups={groups}
          knockoutMatches={knockoutMatches}
          advancementTips={advancementTips}
          tournamentTip={tournamentTip}
          locale={locale}
        />
      )}
    </div>
  );
}
