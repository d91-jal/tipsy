import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { ToastProvider } from "@/components/ui";
import "../../app/globals.css";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Tipsify",
    description:
      locale === "sv"
        ? "Tippa FIFA VM 2026"
        : "Predict FIFA World Cup 2026 with your friends",
    icons: {
      icon: "/brand-mark.svg",
      apple: "/brand-mark.svg",
    },
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
          {/* ToastProvider wraps everything so useToast() works everywhere */}
          <ToastProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar session={session} locale={locale} />
              <main className="flex-1 container mx-auto max-w-5xl px-4 sm:px-6 py-8">
                {children}
              </main>
              <footer
                style={{
                  padding: "24px 0",
                  borderTop: "1px solid var(--hairline)",
                }}
              >
                <p
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--f-mono)",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--ink-faint)",
                    margin: 0,
                  }}
                >
                  Tipsify · VM 2026
                </p>
              </footer>
            </div>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
