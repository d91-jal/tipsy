// components/competitions/CompetitionNav.tsx
"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";

interface CompetitionNavProps {
  slug: string;
  name: string;
  locale: string;
}

export function CompetitionNav({ slug, name, locale }: CompetitionNavProps) {
  const pathname = usePathname();
  const isSv = locale === "sv";

  const tabs = [
    {
      href: `/competitions/${slug}`,
      label: isSv ? "Ledartavla" : "Standings",
      match: (p: string) =>
        p.endsWith(`/competitions/${slug}`) ||
        p.includes(`/competitions/${slug}/player`),
    },
    {
      href: `/tips/group-stage`,
      label: isSv ? "Mina tips" : "My tips",
      match: (p: string) => p.includes("/tips/"),
    },
    {
      href: `/competitions/${slug}/coupons`,
      label: isSv ? "Allas tips" : "All tips",
      match: (p: string) => p.includes(`/competitions/${slug}/coupons`),
    },
    {
      href: `/competitions/${slug}/results`,
      label: isSv ? "Resultat" : "Results",
      match: (p: string) => p.includes(`/competitions/${slug}/results`),
    },
  ];

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Competition name breadcrumb */}
      <div style={{ marginBottom: 14 }}>
        <Link
          href="/competitions"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            textDecoration: "none",
          }}
        >
          {isSv ? "← Tävlingar" : "← Competitions"}
        </Link>
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            margin: "0 8px",
          }}
        >
          /
        </span>
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-soft)",
          }}
        >
          {name}
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "2px solid var(--hairline)",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href as any}
              style={{
                padding: "10px 20px",
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                whiteSpace: "nowrap",
                color: isActive ? "var(--green-deep)" : "var(--ink-faint)",
                borderBottom: isActive
                  ? "2px solid var(--green)"
                  : "2px solid transparent",
                marginBottom: -2,
                transition: "color 0.15s",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
