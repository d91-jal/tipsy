// components/admin/AdminNav.tsx
"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function AdminNav({ locale }: { locale: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin/results"      as const, labelSv: "⚽ Resultat",    labelEn: "⚽ Results" },
    { href: "/admin/odds"         as const, labelSv: "📊 Odds",        labelEn: "📊 Odds" },
    { href: "/admin/competitions" as const, labelSv: "🏆 Tävlingar",   labelEn: "🏆 Competitions" },
    { href: "/admin/simulate"     as const, labelSv: "🤖 Simulering",  labelEn: "🤖 Simulate" },
    { href: "/admin/users"        as const, labelSv: "👥 Användare",   labelEn: "👥 Users" },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">Admin</span>
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.href.toString().replace("/admin/", ""));
        const label = locale === "sv" ? tab.labelSv : tab.labelEn;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
