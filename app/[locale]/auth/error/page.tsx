// app/[locale]/auth/error/page.tsx
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

const ERROR_MESSAGES: Record<string, { sv: string; en: string }> = {
  Configuration:  { sv: "Konfigurationsfel – kontakta admin.", en: "Configuration error – contact admin." },
  AccessDenied:   { sv: "Åtkomst nekad.",                      en: "Access denied." },
  Verification:   { sv: "Länken är ogiltig eller har gått ut.", en: "Link is invalid or has expired." },
  Default:        { sv: "Något gick fel vid inloggningen.",     en: "Something went wrong during sign-in." },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const locale = await getLocale();
  const errorKey = searchParams.error ?? "Default";
  const msg = ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.Default;

  return (
    <div className="max-w-md mx-auto mt-12 text-center space-y-4">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-xl font-bold text-slate-800">
        {locale === "sv" ? "Inloggningsfel" : "Sign-in error"}
      </h1>
      <p className="text-slate-500">{locale === "sv" ? msg.sv : msg.en}</p>
      <Link
        href="/auth/login"
        className="inline-block mt-4 px-5 py-2 rounded-lg bg-pitch-500 text-white font-medium
                   hover:bg-pitch-600 transition-colors"
      >
        {locale === "sv" ? "Försök igen" : "Try again"}
      </Link>
    </div>
  );
}
