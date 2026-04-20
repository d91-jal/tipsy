// app/[locale]/standings/page.tsx
// Leaderboards are now per-competition — redirect to competitions list
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";

export default async function StandingsPage() {
  const locale = await getLocale();
  redirect({ href: "/competitions", locale });
}
