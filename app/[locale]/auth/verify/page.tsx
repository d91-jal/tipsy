// app/[locale]/auth/verify/page.tsx  — Fas 3 redesign
import { getLocale } from "next-intl/server";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const locale = await getLocale();
  const email = searchParams.email;
  const isSv = locale === "sv";

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
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
            lineHeight: 1.7,
          }}
        >
          {email ? (
            isSv ? (
              <>
                Vi har skickat en inloggningslänk till{" "}
                <strong style={{ color: "var(--ink)" }}>{email}</strong>. Klicka
                på länken för att logga in.
              </>
            ) : (
              <>
                We sent a login link to{" "}
                <strong style={{ color: "var(--ink)" }}>{email}</strong>. Click
                the link to sign in.
              </>
            )
          ) : isSv ? (
            "En inloggningslänk har skickats till din e-postadress."
          ) : (
            "A login link has been sent to your email address."
          )}
        </div>
        <div style={{ padding: "0 28px" }}>
          <div
            style={{
              borderTop: "2px dashed var(--coupon-rule)",
              margin: "16px 0",
            }}
          />
          <p
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.4)",
              margin: 0,
            }}
          >
            {isSv
              ? "Länken är giltig i 24 timmar · Kolla skräpposten om du inte hittar det"
              : "Link valid 24 hours · Check spam if you can't find it"}
          </p>
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
