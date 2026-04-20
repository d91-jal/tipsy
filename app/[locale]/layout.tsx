// app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/toaster";
import "../../app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: "VM-Tippning 2026",
    description: locale === "sv"
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
  // Validate locale
  if (!routing.locales.includes(locale as "sv" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  const session = await auth();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Navbar session={session} locale={locale} />
            <main className="flex-1 container mx-auto max-w-5xl px-4 py-6">
              {children}
            </main>
            <footer className="py-4 text-center text-xs text-slate-400">
              VM-Tippning 2026
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
