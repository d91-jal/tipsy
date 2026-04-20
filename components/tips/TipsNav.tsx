// components/tips/TipsNav.tsx
"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface TipsNavProps {
  locale: string;
}

export function TipsNav({ locale }: TipsNavProps) {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/tips/group-stage" as const,
      icon: "⚽",
      labelSv: "Gruppspel",
      labelEn: "Group Stage",
    },
    {
      href: "/tips/advancement" as const,
      icon: "🏅",
      labelSv: "Avancemang",
      labelEn: "Advancement",
    },
    {
      href: "/tips/knockout" as const,
      icon: "⚔️",
      labelSv: "Slutspel",
      labelEn: "Knockout",
    },
    {
      href: "/tips/tournament" as const,
      icon: "🏆",
      labelSv: "Final",
      labelEn: "Final",
    },
  ];

  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.href.toString().replace("/tips/", ""));
        const label = locale === "sv" ? tab.labelSv : tab.labelEn;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center",
              isActive
                ? "bg-white text-pitch-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
