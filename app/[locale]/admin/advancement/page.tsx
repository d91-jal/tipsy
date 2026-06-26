// app/[locale]/admin/advancement/page.tsx  — designsystem-styling
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { AdminAdvancementForm } from "@/components/admin/AdminAdvancementForm";

export default async function AdminAdvancementPage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) redirect({ href: "/auth/login", locale });
  if (session?.user.role !== "ADMIN") redirect({ href: "/", locale });

  const isSv = locale === "sv";

  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { slug: "wc2026" },
    select: { id: true },
  });

  const groups = await prisma.group.findMany({
    where: { tournamentId: tournament.id },
    orderBy: { name: "asc" },
    include: {
      teams: { orderBy: { nameSv: "asc" } },
      actualAdvancements: { include: { team: true } },
    },
  });

  const setCount = groups.filter((g) => g.actualAdvancements.length >= 2).length;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          Admin · VM 2026
        </p>
        <h1
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "-0.02em",
            color: "var(--green-deep)",
            margin: 0,
          }}
        >
          {isSv ? "Avancemang — Topp 2 per grupp" : "Advancement — Top 2 per group"}
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--ink-soft)",
            maxWidth: 560,
          }}
        >
          {isSv
            ? "Välj de två lag som gick vidare i varje grupp. Poängen för deltagarnas tips beräknas och sparas automatiskt när du sparar."
            : "Pick the two teams that advanced in each group. Points for participants' tips are calculated and saved automatically when you save."}
        </p>
      </div>

      {/* Progress */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 32,
          padding: "16px 20px",
          background: "#fff",
          borderRadius: "var(--r-card)",
          boxShadow: "var(--sh-card)",
        }}
      >
        {[
          {
            label: isSv ? "Klara" : "Set",
            val: setCount,
            color: "var(--green)",
          },
          {
            label: isSv ? "Återstår" : "Remaining",
            val: groups.length - setCount,
            color: "var(--gold)",
          },
          {
            label: isSv ? "Totalt" : "Total",
            val: groups.length,
            color: "var(--ink-faint)",
          },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontWeight: 700,
                fontSize: 28,
                color,
                lineHeight: 1,
              }}
            >
              {val}
            </div>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginTop: 4,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Group forms grid */}
      {groups.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {groups.map((group) => (
            <AdminAdvancementForm key={group.id} group={group} locale={locale} />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            border: "1px dashed var(--hairline)",
            borderRadius: "var(--r-card)",
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
          }}
        >
          {isSv ? "Inga grupper att visa" : "No groups to show"}
        </div>
      )}
    </div>
  );
}
