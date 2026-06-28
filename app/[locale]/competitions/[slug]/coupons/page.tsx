// app/[locale]/competitions/[slug]/coupons/page.tsx
// Overview of all participants' tip coupons for a competition.
// Inspired by classic Excel tipping sheets: matches as rows, players as columns.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { CouponsView } from "@/components/competitions/CouponsView";
import { BackLink } from "@/components/layout/BackLink";

export const revalidate = 60;

export default async function CouponsPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const session = await auth();
  const locale = await getLocale();
  const isSv = locale === "sv";

  if (!session?.user) redirect({ href: "/auth/login", locale });
  const userId = session!.user.id;

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      tournament: {
        select: {
          id: true,
          oddsLockDate: true,
          nameSv: true,
          nameEn: true,
        },
      },
    },
  });
  if (!competition) notFound();

  // Verify membership
  const myMembership = await prisma.competitionMember.findUnique({
    where: {
      competitionId_userId: {
        competitionId: competition.id,
        userId: userId,
      },
    },
  });
  if (!myMembership) redirect({ href: "/competitions", locale });

  const isLocked = new Date() > new Date(competition.tournament.oddsLockDate);

  // Fetch all members
  const members = await prisma.competitionMember.findMany({
    where: { competitionId: competition.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  // Only show other users' tips if deadline passed or tipsPublic
  const visibleMemberIds = members
    .filter((m) => m.userId === userId || isLocked || m.tipsPublic)
    .map((m) => m.userId);

  // Fetch groups with matches and all tips
  const groups = await prisma.group.findMany({
    where: { tournamentId: competition.tournament.id },
    orderBy: { name: "asc" },
    include: {
      teams: { orderBy: { nameEn: "asc" } },
      matches: {
        where: { stage: "GROUP" },
        orderBy: { matchNumber: "asc" },
        include: {
          homeTeam: true,
          awayTeam: true,
          matchTips: {
            where: { userId: { in: visibleMemberIds } },
          },
        },
      },
      advancementTips: {
        where: { userId: { in: visibleMemberIds } },
        include: { firstTeam: true, secondTeam: true },
      },
      actualAdvancements: { include: { team: true } },
    },
  });

  // Fetch knockout matches (teams determined) with all visible members' tips
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
      matchTips: { where: { userId: { in: visibleMemberIds } } },
    },
  });

  // Fetch tournament tips
  const tournamentTips = await prisma.tournamentTip.findMany({
    where: {
      userId: { in: visibleMemberIds },
      tournamentId: competition.tournament.id,
    },
    include: { finalist1: true, finalist2: true, winner: true },
  });

  const tournamentActual = await prisma.tournamentActualResult.findUnique({
    where: { tournamentId: competition.tournament.id },
    include: { finalist1: true, finalist2: true, winner: true },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <BackLink
        href={`/competitions/${slug}`}
        label={isSv ? "Tillbaka till topplistan" : "Back to standings"}
      />
      <CouponsView
        competition={competition}
        members={members}
        groups={groups.map((g) => ({
          ...g,
          matches: g.matches.map((m) => ({
            ...m,
            scheduledAt: m.scheduledAt.toISOString(),
          })),
        }))}
        knockoutMatches={knockoutMatches.map((m) => ({
          ...m,
          scheduledAt: m.scheduledAt.toISOString(),
        }))}
        tournamentTips={tournamentTips}
        tournamentActual={tournamentActual}
        currentUserId={userId}
        isLocked={isLocked}
        locale={locale}
      />
    </div>
  );
}
