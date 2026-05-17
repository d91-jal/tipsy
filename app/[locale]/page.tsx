// app/[locale]/page.tsx  — Fas 3 redesign
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  const isSv = locale === "sv";

  const tournament = await prisma.tournament.findUnique({
    where: { slug: "wc2026" },
    select: { nameSv: true, nameEn: true, startDate: true, oddsLockDate: true },
  });

  const now = new Date();
  const lockDate = tournament?.oddsLockDate;
  const isLocked = lockDate ? now > lockDate : false;
  const daysUntilLock = lockDate
    ? Math.max(0, Math.ceil((lockDate.getTime() - now.getTime()) / 86400000))
    : null;

  const sections = [
    {
      href: "/tips/group-stage" as const,
      eyebrow: isSv ? "72 matcher" : "72 matches",
      title: isSv ? "Gruppspel" : "Group Stage",
      sub: isSv ? "1X2 på varje match" : "1X2 on every match",
    },
    {
      href: "/tips/advancement" as const,
      eyebrow: isSv ? "12 grupper" : "12 groups",
      title: isSv ? "Avancemang" : "Advancement",
      sub: isSv ? "Vilka 2 lag går vidare?" : "Which 2 teams advance?",
    },
    {
      href: "/tips/knockout" as const,
      eyebrow: isSv ? "32 matcher" : "32 matches",
      title: isSv ? "Slutspel" : "Knockout",
      sub: isSv ? "Öppnas löpande" : "Opens progressively",
    },
    {
      href: "/tips/tournament" as const,
      eyebrow: isSv ? "Final" : "Final",
      title: isSv ? "Vinnare" : "Winner",
      sub: isSv ? "Finallag och mästare" : "Finalists and champion",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <div
        style={{ paddingBottom: 56, borderBottom: "1px solid var(--hairline)" }}
      >
        <div
          style={{
            marginBottom: 22,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 28,
              height: 1,
              background: "var(--ink-faint)",
            }}
          />
          <span className="eyebrow">
            {isLocked
              ? isSv
                ? "Tips stängda · VM 2026"
                : "Tips closed · WC 2026"
              : daysUntilLock !== null
                ? isSv
                  ? `Stänger om ${daysUntilLock} dagar · VM 2026`
                  : `Closes in ${daysUntilLock} days · WC 2026`
                : "VM 2026"}
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: "clamp(40px, 6vw, 76px)",
            margin: "0 0 24px",
            letterSpacing: "-0.025em",
            lineHeight: 1.0,
            color: "var(--green-deep)",
          }}
        >
          {isSv ? "Tipset på " : "Predictions for "}
          <span style={{ fontStyle: "italic", color: "var(--green)" }}>
            {isSv ? "världsmästerskapet." : "the World Cup."}
          </span>
        </h1>

        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "var(--ink-soft)",
            maxWidth: 540,
            margin: "0 0 36px",
            letterSpacing: "-0.01em",
          }}
        >
          {isSv
            ? "Tippa 1X2 på varje match. Poäng baserat på verkliga odds. Tävla mot dina vänner."
            : "Predict 1X2 on every match. Points based on real odds. Compete with your friends."}
        </p>

        {session ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link
              href="/tips/group-stage"
              className="btn btn-primary btn-lg"
              style={{ fontFamily: "var(--f-sans)" }}
            >
              {isSv ? "Fyll i kupong →" : "Fill in coupon →"}
            </Link>
            <Link
              href="/competitions"
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                textDecoration: "none",
              }}
            >
              {isSv ? "Se ställning" : "View standings"}
            </Link>
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="btn btn-primary btn-lg"
            style={{ fontFamily: "var(--f-sans)" }}
          >
            {isSv ? "Logga in och tippa →" : "Log in and predict →"}
          </Link>
        )}
      </div>

      {/* Sections grid */}
      {session && (
        <div style={{ paddingTop: 48 }}>
          <div style={{ marginBottom: 28 }}>
            <p className="eyebrow">
              {isSv ? "Tipskategorier" : "Tip categories"}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 2,
            }}
          >
            {sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                style={{ textDecoration: "none" }}
              >
                <div className="section-link" style={{ color: "inherit" }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>
                    {s.eyebrow}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--f-display)",
                      fontWeight: 600,
                      fontSize: 26,
                      letterSpacing: "-0.02em",
                      color: "var(--green-deep)",
                      marginBottom: 6,
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                    {s.sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
