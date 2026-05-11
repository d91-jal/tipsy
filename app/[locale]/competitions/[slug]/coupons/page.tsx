// app/[locale]/competitions/[slug]/coupons/page.tsx
// Overview of all participants' tip coupons for a competition.
// Inspired by classic Excel tipping sheets: matches as rows, players as columns.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { CouponsView } from "@/components/competitions/CouponsView";

export const revalidate = 60;

export default async function CouponsPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect({ href: "/auth/login", locale });

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
        userId: session.user.id,
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
    .filter((m) => m.userId === session.user.id || isLocked || m.tipsPublic)
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
    <CouponsView
      competition={competition}
      members={members}
      groups={groups}
      tournamentTips={tournamentTips}
      tournamentActual={tournamentActual}
      currentUserId={session.user.id}
      isLocked={isLocked}
      locale={locale}
    />
  );
}
