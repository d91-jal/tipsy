// app/[locale]/tips/layout.tsx
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { TipsNav } from "@/components/tips/TipsNav";

export default async function TipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect({ href: "/auth/login", locale });

  return (
    <div className="space-y-5">
      <TipsNav locale={locale} />
      {children}
    </div>
  );
}
