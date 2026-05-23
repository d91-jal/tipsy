// app/[locale]/tips/group-stage/page.tsx  — Fas 3 redesign
// Groups rendered as authentic .coupon components.
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { CouponMatchRow } from "@/components/tips/CouponMatchRow";

export default async function GroupStagePage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect({ href: "/auth/login", locale });

  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug: "wc2026" },
    select: { oddsLockDate: true },
  });

  const groups = await prisma.group.findMany({
    where: { tournament: { slug: "wc2026" } },
    orderBy: { name: "asc" },
    include: {
      matches: {
        where: { stage: "GROUP" },
        orderBy: { matchNumber: "asc" },
        include: {
          homeTeam: true,
          awayTeam: true,
          odds: true,
          matchTips: { where: { userId: session!.user.id } },
        },
      },
    },
  });

  const isSv = locale === "sv";
  const locked = new Date() > new Date(tournament.oddsLockDate);

  const totalMatches = groups.reduce((s, g) => s + g.matches.length, 0);
  const tipped = groups.reduce(
    (s, g) => s + g.matches.filter((m) => m.matchTips.length > 0).length,
    0,
  );

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow mb-3">
            {isSv ? "Tips · VM 2026" : "Predictions · WC 2026"}
          </p>
          <h1
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: 44,
              letterSpacing: "-0.02em",
              color: "var(--green-deep)",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            {isSv ? "Gruppspelet." : "Group Stage."}{" "}
            <span style={{ fontStyle: "italic", color: "var(--green)" }}>
              {isSv ? "1x2 per match." : "1x2 each match."}
            </span>
          </h1>
        </div>
        <div className="text-right">
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: 4,
            }}
          >
            {isSv ? "Ifyllt" : "Filled in"}
          </div>
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 600,
              fontSize: 36,
              color: "var(--green-deep)",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "var(--gold)", fontStyle: "italic" }}>
              {tipped}
            </span>
            <span style={{ color: "rgba(30,57,50,0.3)" }}>
              {" "}
              / {totalMatches}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{ height: 3, background: "var(--hairline)", borderRadius: 99 }}
      >
        <div
          style={{
            height: 3,
            borderRadius: 99,
            background: "var(--gold)",
            width: `${totalMatches > 0 ? (tipped / totalMatches) * 100 : 0}%`,
            transition: "width 0.4s var(--ease)",
          }}
        />
      </div>

      {/* Coupons — one per group */}
      {groups.map((group) => {
        const groupTipped = group.matches.filter(
          (m) => m.matchTips.length > 0,
        ).length;
        let rowIndex = 1;

        return (
          <div key={group.id} className="coupon" style={{ marginBottom: 8 }}>
            {/* Coupon head */}
            <div className="coupon-head">
              <div>
                <h2>{isSv ? `Grupp ${group.name}` : `Group ${group.name}`}</h2>
                <div className="sub">
                  VM-tipset · {isSv ? "Gruppspel" : "Group Stage"} · 1X2
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontFamily: "var(--f-mono)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.7,
                }}
              >
                <div>
                  {isSv ? "Matcher" : "Matches"}{" "}
                  <b style={{ color: "var(--cream)" }}>
                    {group.matches.length}
                  </b>
                </div>
                <div>
                  {isSv ? "Ifyllt" : "Filled"}{" "}
                  <b style={{ color: "var(--gold)" }}>
                    {groupTipped}/{group.matches.length}
                  </b>
                </div>
                {locked && (
                  <div
                    style={{
                      color: "var(--stamp-red)",
                      letterSpacing: "0.14em",
                      marginTop: 2,
                    }}
                  >
                    {isSv ? "STÄNGT" : "CLOSED"}
                  </div>
                )}
              </div>
            </div>

            {/* Column headers */}
            <div className="coupon-colhead">
              <div>{isSv ? "Nr" : "No"}</div>
              <div>{isSv ? "Match" : "Match"}</div>
              <div>1</div>
              <div>X</div>
              <div>2</div>
            </div>

            {/* Match rows */}
            {group.matches.map((match) => {
              const serialized = {
                ...match,
                scheduledAt: match.scheduledAt.toISOString(),
                tipDeadline:
                  (match as any).tipDeadline?.toISOString() ??
                  tournament.oddsLockDate.toISOString(),
              };
              return (
                <CouponMatchRow
                  key={match.id}
                  match={serialized as any}
                  locale={locale}
                />
              );
            })}

            {/* Coupon footer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "#2d251a",
                color: "var(--coupon-bg)",
                padding: "14px 22px",
                fontFamily: "var(--f-mono)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <div style={{ opacity: 0.6 }}>
                {isSv ? "Tips stängs" : "Tips close"}{" "}
                <b style={{ color: "var(--gold-soft)", opacity: 1 }}>
                  {new Date(tournament.oddsLockDate).toLocaleDateString(
                    isSv ? "sv-SE" : "en-GB",
                    { day: "numeric", month: "short", year: "numeric" },
                  )}
                </b>
              </div>
              <div style={{ textAlign: "right", color: "var(--gold-soft)" }}>
                {groupTipped === group.matches.length
                  ? isSv
                    ? "✓ Gruppen klar"
                    : "✓ Group complete"
                  : `${group.matches.length - groupTipped} ${isSv ? "kvar" : "remaining"}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
