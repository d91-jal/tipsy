// app/[locale]/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui";
import "../../app/globals.css";

// Note: font loading is handled via @import in globals.css (Google Fonts CDN)

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Tipsy",
    description:
      locale === "sv"
        ? "Tippa FIFA VM 2026 med dina vänner"
        : "Predict FIFA World Cup 2026 with your friends",
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as "sv" | "en")) notFound();

  const messages = await getMessages();
  const session = await auth();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-cream text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Navbar session={session} locale={locale} />
            <main className="flex-1 container mx-auto max-w-5xl px-4 sm:px-6 py-8">
              {children}
            </main>
            <footer className="py-6 border-t border-hairline">
              <p className="text-center font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
                Tipsy · VM 2026
              </p>
            </footer>
          </div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
