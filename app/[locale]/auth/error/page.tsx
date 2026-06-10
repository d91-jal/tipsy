// app/[locale]/auth/error/page.tsx  — Fas 3 redesign
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

const ERRORS: Record<string, { sv: string; en: string }> = {
  Configuration: {
    sv: "Konfigurationsfel — kontakta admin.",
    en: "Configuration error — contact admin.",
  },
  AccessDenied: { sv: "Åtkomst nekad.", en: "Access denied." },
  Verification: {
    sv: "Länken är ogiltig eller har gått ut.",
    en: "Link is invalid or has expired.",
  },
  Default: {
    sv: "Något gick fel vid inloggningen.",
    en: "Something went wrong during sign-in.",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const locale = await getLocale();
  const isSv = locale === "sv";
  const msg = ERRORS[searchParams.error ?? "Default"] ?? ERRORS.Default;

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
      <div className="coupon" style={{ padding: "0 0 24px" }}>
        <div
          className="coupon-head"
          style={{
            background: "var(--stamp-red)",
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, color: "var(--cream)" }}>
              {isSv ? "Inloggningsfel" : "Sign-in error"}
            </h2>
            <div className="sub" style={{ color: "rgba(255,255,255,0.6)" }}>
              Tipsify · VM 2026
            </div>
          </div>
          <div
            className="stamp"
            style={{ transform: "rotate(8deg)", fontSize: 14 }}
          >
            {isSv ? "FEL" : "ERROR"}
          </div>
        </div>

        <div
          style={{
            padding: "28px 28px 8px",
            fontFamily: "var(--f-sans)",
            color: "var(--ink-soft)",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {isSv ? msg.sv : msg.en}
        </div>

        <div style={{ padding: "0 28px" }}>
          <div
            style={{
              borderTop: "2px dashed var(--coupon-rule)",
              margin: "16px 0",
            }}
          />
        </div>

        <div style={{ padding: "0 28px 4px" }}>
          <Link
            href="/auth/login"
            style={{
              display: "inline-block",
              fontFamily: "var(--f-sans)",
              fontWeight: 600,
              fontSize: 13,
              padding: "9px 24px",
              borderRadius: "var(--r-pill)",
              background: "var(--green-deep)",
              color: "var(--cream)",
              textDecoration: "none",
            }}
          >
            {isSv ? "Försök igen →" : "Try again →"}
          </Link>
        </div>

        <div
          style={{
            background: "#2d251a",
            color: "var(--coupon-bg)",
            padding: "10px 28px",
            marginTop: 24,
            fontFamily: "var(--f-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            textAlign: "center",
            opacity: 0.8,
          }}
        >
          VM-tipset · 2026 · Tipsify
        </div>
      </div>
    </div>
  );
}
