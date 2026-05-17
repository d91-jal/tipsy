// components/tips/TipsNav.tsx  — Fas 3 redesign
"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";

interface TipsNavProps {
  locale: string;
}

const tabs = [
  {
    href: "/tips/group-stage" as const,
    segment: "group-stage",
    icon: "⚽",
    labelSv: "Gruppspel",
    labelEn: "Group Stage",
  },
  {
    href: "/tips/advancement" as const,
    segment: "advancement",
    icon: "🏅",
    labelSv: "Avancemang",
    labelEn: "Advancement",
  },
  {
    href: "/tips/knockout" as const,
    segment: "knockout",
    icon: "⚔️",
    labelSv: "Slutspel",
    labelEn: "Knockout",
  },
  {
    href: "/tips/tournament" as const,
    segment: "tournament",
    icon: "🏆",
    labelSv: "Final",
    labelEn: "Final",
  },
];

export function TipsNav({ locale }: TipsNavProps) {
  const pathname = usePathname();
  const isSv = locale === "sv";

  return (
    <nav
      style={{
        display: "flex",
        gap: 0,
        borderBottom: "2px solid var(--hairline)",
        marginBottom: 32,
        overflowX: "auto",
      }}
    >
      {/* Eyebrow label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingRight: 20,
          paddingBottom: 2,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
          }}
        >
          {isSv ? "Tips" : "Tips"}
        </span>
        <span
          style={{
            display: "inline-block",
            width: 1,
            height: 16,
            background: "var(--hairline)",
            margin: "0 20px 0 16px",
          }}
        />
      </div>

      {/* Tab links */}
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.segment);
        const label = isSv ? tab.labelSv : tab.labelEn;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              marginBottom: -2,
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              color: isActive ? "var(--green-deep)" : "var(--ink-faint)",
              borderBottom: isActive
                ? "2px solid var(--green)"
                : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
