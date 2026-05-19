// app/[locale]/competitions/[slug]/layout.tsx  — NY FIL
// Tillhandahåller CompetitionNav på alla sidor under /competitions/[slug]/
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { CompetitionNav } from "@/components/competitions/CompetitionNav";

export default async function CompetitionLayout({
  children,
  params: { slug },
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const competition = await prisma.competition.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!competition) notFound();

  // Verify membership
  const membership = await prisma.competitionMember.findUnique({
    where: {
      competitionId_userId: {
        competitionId: competition.id,
        userId: session.user.id,
      },
    },
  });
  if (!membership) redirect(`/${locale}/competitions`);

  return (
    <div>
      <CompetitionNav
        slug={competition.slug}
        name={competition.name}
        locale={locale}
      />
      {children}
    </div>
  );
}
