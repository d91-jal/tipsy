// components/layout/Navbar.tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { cn } from "@/lib/utils";
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

  const navLinks = [
    {
      href: "/competitions" as const,
      label: locale === "sv" ? "Tävlingar" : "Competitions",
      show: !!session,
    },
    { href: "/tips/group-stage" as const, label: t("tips"), show: !!session },
    ...(session?.user?.role === "ADMIN"
      ? [{ href: "/admin/results" as const, label: t("admin"), show: true }]
      : []),
  ].filter((l) => l.show);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-cream/90 backdrop-blur">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-baseline gap-3 group">
          {/* Brand mark — dark circle with italic T in gold */}
          <span
            className="inline-flex w-9 h-9 rounded-full bg-green-deep items-center justify-center
                           text-gold font-display font-semibold italic text-xl translate-y-0.5
                           group-hover:bg-green-uplift transition-colors"
          >
            T
          </span>
          <span
            className="font-display font-semibold text-2xl tracking-tight text-green-deep
                           group-hover:text-green transition-colors"
          >
            Tipsy
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint
                           hidden sm:block -translate-y-0.5"
          >
            VM 2026
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href.toString());
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-1.5 rounded-pill text-sm font-medium transition-colors",
                  isActive
                    ? "bg-green-pale text-green-deep"
                    : "text-ink-soft hover:text-green-deep hover:bg-cream",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Locale toggle */}
          <button
            onClick={switchLocale}
            className="font-mono text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 rounded-pill
                       border border-hairline text-ink-faint hover:text-green-deep hover:border-green
                       transition-colors"
          >
            {locale === "sv" ? "EN" : "SV"}
          </button>

          {session ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:block font-mono text-[11px] tracking-wide text-ink-faint truncate max-w-[120px]">
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
                className="text-sm text-ink-soft hover:text-stamp transition-colors font-medium"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-green-cta text-white text-sm font-medium px-5 py-2 rounded-pill
                         hover:bg-green transition-colors"
            >
              {t("login")}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded text-ink-soft"
            aria-label="Menu"
          >
            <svg
              className="w-5 h-5"
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
      {menuOpen && (
        <div className="md:hidden border-t border-hairline bg-cream px-6 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 rounded-pill text-sm font-medium text-ink-soft
                         hover:bg-green-pale hover:text-green-deep transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
