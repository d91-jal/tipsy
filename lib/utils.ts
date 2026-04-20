// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { sv, enGB } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale = "sv"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dfLocale = locale === "sv" ? sv : enGB;
  return format(d, "d MMM yyyy, HH:mm", { locale: dfLocale });
}

export function formatDateShort(date: Date | string, locale = "sv"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dfLocale = locale === "sv" ? sv : enGB;
  return format(d, "d MMM", { locale: dfLocale });
}

export function formatPoints(points: number | null | undefined): string {
  if (points === null || points === undefined) return "–";
  return points.toFixed(2).replace(/\.00$/, "");
}

export function isDeadlinePassed(deadline: Date | string): boolean {
  return new Date() > new Date(deadline);
}

export function outcomeLabel(
  outcome: "HOME" | "DRAW" | "AWAY",
  locale = "sv"
): string {
  const labels = {
    sv: { HOME: "1", DRAW: "X", AWAY: "2" },
    en: { HOME: "1", DRAW: "X", AWAY: "2" },
  };
  return labels[locale as keyof typeof labels]?.[outcome] ?? outcome;
}

export function stageLabel(
  stage: string,
  locale = "sv"
): string {
  const labels: Record<string, { sv: string; en: string }> = {
    GROUP:          { sv: "Gruppspel",   en: "Group Stage" },
    ROUND_OF_32:    { sv: "Omgång 32",   en: "Round of 32" },
    ROUND_OF_16:    { sv: "Omgång 16",   en: "Round of 16" },
    QUARTER_FINAL:  { sv: "Kvartsfinal", en: "Quarter-final" },
    SEMI_FINAL:     { sv: "Semifinal",   en: "Semi-final" },
    THIRD_PLACE:    { sv: "Bronsmatch",  en: "Third place" },
    FINAL:          { sv: "Final",       en: "Final" },
  };
  return labels[stage]?.[locale as "sv" | "en"] ?? stage;
}
