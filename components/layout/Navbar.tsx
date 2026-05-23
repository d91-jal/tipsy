// components/layout/Navbar.tsx  — förenklad
"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useState } from "react";

interface NavbarProps {
  session: Session | null;
  locale: string;
}

export function Navbar({ session, locale }: NavbarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "sv" ? "en" : "sv" });
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
        borderBottom: "1px solid var(--hairline)",
        background: "rgba(242, 240, 235, 0.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: 1024,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "baseline",
            gap: 10,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--green-deep)",
              color: "var(--gold)",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--f-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 18,
              marginBottom: -2,
            }}
          >
            T
          </span>
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: "-0.02em",
              color: "var(--green-deep)",
            }}
          >
            Tipsy
          </span>
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
              marginBottom: -1,
              display: "none", // visas via sm:block nedan
            }}
            className="hidden sm:block"
          >
            VM 2026
          </span>
        </Link>

        {/* Desktop nav — Tournaments */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {session && (
            <Link
              href="/competitions"
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: "var(--r-pill)",
                color: pathname.includes("/competitions")
                  ? "var(--green-deep)"
                  : "var(--ink-soft)",
                background: pathname.includes("/competitions")
                  ? "var(--green-pale)"
                  : "transparent",
                transition: "all 0.15s",
              }}
            >
              {locale === "sv" ? "Turneringar" : "Tournaments"}
            </Link>
          )}

          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin/results"
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: "var(--r-pill)",
                color: pathname.includes("/admin")
                  ? "var(--green-deep)"
                  : "var(--ink-soft)",
                background: pathname.includes("/admin")
                  ? "var(--green-pale)"
                  : "transparent",
                transition: "all 0.15s",
              }}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Locale toggle */}
          <button
            onClick={switchLocale}
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 9.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: "var(--r-pill)",
              border: "1px solid var(--hairline)",
              color: "var(--ink-faint)",
              background: "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {locale === "sv" ? "EN" : "SV"}
          </button>

          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 10.5,
                  color: "var(--ink-faint)",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                className="hidden sm:block"
              >
                {session?.user?.name ?? session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-faint)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--stamp-red)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--ink-faint)")
                }
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              style={{
                fontFamily: "var(--f-sans)",
                fontWeight: 600,
                fontSize: 13,
                padding: "7px 18px",
                borderRadius: "var(--r-pill)",
                background: "var(--green-cta)",
                color: "var(--cream)",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
            >
              {t("login")}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-soft)",
              padding: 4,
            }}
            className="md:hidden"
            aria-label="Menu"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && session && (
        <div
          style={{
            borderTop: "1px solid var(--hairline)",
            background: "var(--cream)",
            padding: "12px 24px 16px",
          }}
        >
          <Link
            href="/competitions"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "block",
              padding: "10px 0",
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              textDecoration: "none",
            }}
          >
            {locale === "sv" ? "Turneringar" : "Tournaments"}
          </Link>
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin/results"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "10px 0",
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                textDecoration: "none",
              }}
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
