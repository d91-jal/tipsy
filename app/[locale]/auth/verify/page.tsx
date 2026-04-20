// app/[locale]/auth/verify/page.tsx
import { getLocale } from "next-intl/server";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const locale = await getLocale();
  const email = searchParams.email;

  return (
    <div className="max-w-md mx-auto mt-12 text-center space-y-4">
      <div className="text-5xl">📬</div>
      <h1 className="text-2xl font-bold text-slate-800">
        {locale === "sv" ? "Kolla din inkorg!" : "Check your inbox!"}
      </h1>
      <p className="text-slate-500">
        {email
          ? locale === "sv"
            ? `Vi har skickat en inloggningslänk till ${email}. Klicka på länken för att logga in.`
            : `We sent a login link to ${email}. Click the link to sign in.`
          : locale === "sv"
            ? "En inloggningslänk har skickats till din e-postadress."
            : "A login link has been sent to your email address."
        }
      </p>
      <p className="text-xs text-slate-400">
        {locale === "sv"
          ? "Länken är giltig i 24 timmar. Kolla skräpposten om du inte hittar mailet."
          : "The link is valid for 24 hours. Check your spam folder if you can't find the email."}
      </p>
    </div>
  );
}
