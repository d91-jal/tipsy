// components/layout/BackLink.tsx

"use client";

import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";

interface BackLinkProps {
  href?: string; // om undefined: använd router.back()
  label: string;
  locale?: string;
}

export function BackLink({ href, label }: BackLinkProps) {
  const router = useRouter();

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--f-mono)",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--ink-faint)",
    textDecoration: "none",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    transition: "color 0.15s",
    marginBottom: 28,
  };

  const arrow = (
    <span
      style={{
        fontFamily: "var(--f-display)",
        fontStyle: "italic",
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      ←
    </span>
  );

  if (href) {
    return (
      <Link
        href={href as any}
        style={style}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
      >
        {arrow} {label}
      </Link>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      style={style}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
    >
      {arrow} {label}
    </button>
  );
}
