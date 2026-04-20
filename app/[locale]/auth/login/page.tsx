// app/[locale]/auth/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

type Tab = "magic" | "password";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}`;

  const [tab, setTab] = useState<Tab>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError(locale === "sv" ? "Kunde inte skicka e-post. Försök igen." : "Could not send email. Try again.");
      } else {
        setMagicSent(true);
      }
    });
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError(t("invalidCredentials"));
      } else {
        router.push(callbackUrl);
      }
    });
  };

  if (magicSent) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <div className="text-5xl">📬</div>
            <h2 className="text-xl font-semibold">{t("checkEmail")}</h2>
            <p className="text-slate-500 text-sm">{t("checkEmailDesc", { email })}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="mb-8 text-center">
        <div className="text-4xl mb-2">⚽</div>
        <h1 className="text-2xl font-bold text-slate-800">VM-Tippning 2026</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {locale === "sv" ? "Logga in för att tippa" : "Log in to predict"}
        </p>
      </div>

      <Card>
        {/* Tab switcher */}
        <div className="flex border-b border-slate-100">
          {(["magic", "password"] as Tab[]).map((t_) => (
            <button
              key={t_}
              onClick={() => { setTab(t_); setError(""); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t_
                  ? "text-pitch-600 border-b-2 border-pitch-500 bg-pitch-50/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t_ === "magic"
                ? (locale === "sv" ? "Inloggningslänk" : "Magic link")
                : (locale === "sv" ? "Lösenord" : "Password")}
            </button>
          ))}
        </div>

        <CardContent className="space-y-4 pt-5">
          {tab === "magic" ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="du@exempel.se"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" loading={isPending}>
                {t("magicLink")}
              </Button>
              <p className="text-xs text-slate-400 text-center">
                {locale === "sv"
                  ? "Vi skickar en länk till din e-post. Ingen kod behövs."
                  : "We'll send a link to your email. No code needed."}
              </p>
            </form>
          ) : (
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email-pw">{t("email")}</Label>
                <Input
                  id="email-pw"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="du@exempel.se"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" loading={isPending}>
                {t("login")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
