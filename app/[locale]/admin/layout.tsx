// app/[locale]/admin/layout.tsx
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect({ href: "/", locale });
  }

  return (
    <div className="space-y-5">
      <AdminNav locale={locale} />
      {children}
    </div>
  );
}
