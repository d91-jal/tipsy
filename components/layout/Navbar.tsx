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
    const next = locale === "sv" ? "en" : "sv";
    router.replace(pathname, { locale: next });
  };

  const navLinks = [
    { href: "/competitions" as const, label: locale === "sv" ? "Tävlingar" : "Competitions", show: !!session },
    { href: "/tips/group-stage" as const, label: t("tips"), show: !!session },
    { href: "/standings" as const, label: t("standings"), show: !!session },
    ...(session?.user?.role === "ADMIN"
      ? [{ href: "/admin/results" as const, label: t("admin"), show: true }]
      : []),
  ].filter((l) => l.show);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-pitch-600 text-lg">
          ⚽ <span className="hidden sm:inline">VM-Tippning 2026</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(link.href.toString())
                  ? "bg-pitch-50 text-pitch-700"
                  : "text-slate-600 hover:text-pitch-600 hover:bg-slate-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Locale toggle */}
          <button
            onClick={switchLocale}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200
                       text-slate-500 hover:border-pitch-400 hover:text-pitch-600 transition-colors"
          >
            {locale === "sv" ? "EN" : "SV"}
          </button>

          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-slate-400 max-w-[120px] truncate">
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
                className="px-3 py-1.5 text-sm text-slate-600 hover:text-red-600 transition-colors"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-3 py-1.5 rounded-lg bg-pitch-500 text-white text-sm font-medium
                         hover:bg-pitch-600 transition-colors"
            >
              {t("login")}
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded text-slate-500"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600
                         hover:bg-slate-50 hover:text-pitch-600"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
