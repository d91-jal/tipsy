// app/[locale]/admin/users/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { InviteForm } from "@/components/admin/InviteForm";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect({ href: "/", locale });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          matchTips: true,
          groupAdvancementTips: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">
        {locale === "sv" ? "Admin — Användare" : "Admin — Users"}
      </h1>

      {/* Invite form */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">
          {locale === "sv" ? "Bjud in ny spelare" : "Invite new player"}
        </h2>
        <InviteForm locale={locale} />
      </section>

      {/* User list */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-700">
          {locale === "sv" ? `Registrerade användare (${users.length})` : `Registered users (${users.length})`}
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">
                  {locale === "sv" ? "Namn / E-post" : "Name / Email"}
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Roll</th>
                <th className="px-4 py-3 font-medium text-slate-500 hidden md:table-cell">
                  {locale === "sv" ? "Tips" : "Tips"}
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 hidden md:table-cell">
                  {locale === "sv" ? "Verifierad" : "Verified"}
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">
                  {locale === "sv" ? "Registrerad" : "Registered"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{user.name ?? "—"}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                    {user._count.matchTips + user._count.groupAdvancementTips}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {user.emailVerified ? (
                      <span className="text-green-600 text-xs">✓</span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                    {formatDate(user.createdAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
