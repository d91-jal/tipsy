// app/[locale]/auth/login/page.tsx  — Fas 3 redesign
"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? `/${locale}/competitions`;
  const isSv = locale === "sv";

  const [tab, setTab] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError(
          isSv
            ? "Kunde inte skicka e-post. Försök igen."
            : "Could not send email. Try again.",
        );
      } else {
        setMagicSent(true);
      }
    });
  }

  async function handlePassword(e: React.FormEvent) {
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
        setError(
          isSv
            ? "Felaktig e-post eller lösenord."
            : "Incorrect email or password.",
        );
      } else {
        window.location.href = callbackUrl;
      }
    });
  }

  if (magicSent) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
        <div className="coupon" style={{ padding: "0 0 24px" }}>
          <div className="coupon-head">
            <div>
              <h2 style={{ fontSize: 18 }}>
                {isSv ? "Kolla inkorgen" : "Check your inbox"}
              </h2>
              <div className="sub">
                {isSv ? "Inloggningslänk skickad" : "Login link sent"}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "28px 28px 8px",
              fontFamily: "var(--f-sans)",
              color: "var(--ink-soft)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {isSv
              ? `Vi har skickat en länk till ${email}. Länken är giltig i 24 timmar.`
              : `We sent a link to ${email}. The link is valid for 24 hours.`}
          </div>
          <div style={{ padding: "0 28px" }}>
            <div
              style={{
                height: 1,
                borderTop: "2px dashed var(--coupon-rule)",
                margin: "16px 0",
              }}
            />
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.4)",
              }}
            >
              {isSv
                ? "Kolla skräpposten om du inte hittar det"
                : "Check spam if you can't find it"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "72px auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            display: "inline-flex",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--green-deep)",
            color: "var(--gold)",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--f-display)",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 26,
            marginBottom: 16,
          }}
        >
          T
        </div>
        <h1
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "-0.02em",
            color: "var(--green-deep)",
            margin: "0 0 6px",
          }}
        >
          Tipsy
        </h1>
        <p className="eyebrow">
          {isSv ? "VM 2026 · Logga in" : "WC 2026 · Sign in"}
        </p>
      </div>

      {/* Coupon-style login form */}
      <div className="coupon">
        <div className="coupon-head" style={{ padding: "12px 24px 10px" }}>
          <div>
            <div
              style={{
                display: "flex",
                gap: 0,
                fontFamily: "var(--f-mono)",
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {(["magic", "password"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setError("");
                  }}
                  style={{
                    padding: "6px 16px",
                    background:
                      tab === t ? "rgba(255,255,255,0.15)" : "transparent",
                    color: tab === t ? "var(--cream)" : "rgba(255,255,255,0.5)",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "var(--r-coupon)",
                    transition: "all 0.15s",
                    fontFamily: "var(--f-mono)",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {t === "magic"
                    ? isSv
                      ? "Inloggningslänk"
                      : "Magic link"
                    : isSv
                      ? "Lösenord"
                      : "Password"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{ padding: "24px 24px 28px", background: "var(--coupon-bg)" }}
        >
          {tab === "magic" ? (
            <form
              onSubmit={handleMagicLink}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  {isSv ? "E-postadress" : "Email address"}
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isSv ? "du@exempel.se" : "you@example.com"}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontFamily: "var(--f-sans)",
                    fontSize: 14,
                    background: "#fff",
                    color: "var(--ink)",
                    border: "1px solid var(--coupon-rule-soft)",
                    borderRadius: "var(--r-input)",
                    outline: "none",
                  }}
                />
              </div>
              {error && (
                <p
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 11,
                    color: "var(--stamp-red)",
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-dark"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isPending
                  ? isSv
                    ? "Skickar…"
                    : "Sending…"
                  : isSv
                    ? "Skicka inloggningslänk →"
                    : "Send login link →"}
              </button>
              <p
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(0,0,0,0.4)",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                {isSv
                  ? "Ingen kod behövs · Länk giltig 24h"
                  : "No code needed · Link valid 24h"}
              </p>
            </form>
          ) : (
            <form
              onSubmit={handlePassword}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {[
                {
                  label: isSv ? "E-postadress" : "Email",
                  type: "email",
                  val: email,
                  set: setEmail,
                  auto: "email",
                },
                {
                  label: isSv ? "Lösenord" : "Password",
                  type: "password",
                  val: password,
                  set: setPassword,
                  auto: "current-password",
                },
              ].map(({ label, type, val, set, auto }) => (
                <div key={type}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>
                    {label}
                  </div>
                  <input
                    type={type}
                    autoComplete={auto}
                    required
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontFamily:
                        type === "password" ? "var(--f-mono)" : "var(--f-sans)",
                      fontSize: 14,
                      background: "#fff",
                      color: "var(--ink)",
                      border: "1px solid var(--coupon-rule-soft)",
                      borderRadius: "var(--r-input)",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
              {error && (
                <p
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: 11,
                    color: "var(--stamp-red)",
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-dark"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isPending ? "…" : isSv ? "Logga in →" : "Log in →"}
              </button>
            </form>
          )}
        </div>

        {/* Coupon footer strip */}
        <div
          style={{
            background: "#2d251a",
            color: "var(--coupon-bg)",
            padding: "10px 24px",
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          VM-tipset · 2026 · Tipsy
        </div>
      </div>
    </div>
  );
}
