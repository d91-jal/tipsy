// app/[locale]/admin/users/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { InviteForm } from "@/components/admin/InviteForm";
import { ResendInviteButton } from "@/components/admin/ResendInviteButton";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect({ href: "/", locale });
  }

  const isSv = locale === "sv";

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          matchTips: true,
          groupAdvancementTips: true,
        },
      },
    },
  });

  const unverified = users.filter((u) => !u.emailVerified);
  const verified = users.filter((u) => u.emailVerified);

  return (
    <div style={{ maxWidth: 900 }}>
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
          {isSv ? "Användare" : "Users"}
        </h1>
      </div>

      {/* Invite form */}
      <section style={{ marginBottom: 40 }}>
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          {isSv ? "Bjud in ny spelare" : "Invite new player"}
        </p>
        <InviteForm locale={locale} />
      </section>

      {/* Unverified users — resend invite */}
      {unverified.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            {isSv
              ? `Ej verifierade (${unverified.length}) — skicka om inbjudan`
              : `Unverified (${unverified.length}) — resend invite`}
          </p>
          <div
            style={{
              borderRadius: "var(--r-card)",
              overflow: "hidden",
              boxShadow: "var(--sh-card)",
              border: "1px solid var(--hairline)",
            }}
          >
            {unverified.map((user, idx) => (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 20px",
                  borderTop: idx > 0 ? "1px solid var(--hairline)" : "none",
                  background: idx % 2 === 0 ? "#fff" : "var(--cream)",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--f-serif)",
                      fontWeight: 600,
                      fontSize: 15,
                      color: "var(--ink)",
                    }}
                  >
                    {user.name ?? "—"}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      marginTop: 2,
                    }}
                  >
                    {user.email}
                  </div>
                </div>
                <ResendInviteButton email={user.email} locale={locale} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full user list */}
      <section>
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          {isSv
            ? `Alla användare (${users.length})`
            : `All users (${users.length})`}
        </p>
        <div
          style={{
            borderRadius: "var(--r-card)",
            overflow: "hidden",
            boxShadow: "var(--sh-card)",
            border: "1px solid var(--hairline)",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "var(--green-deep)" }}>
                {[
                  isSv ? "Namn / E-post" : "Name / Email",
                  "Roll",
                  "Tips",
                  isSv ? "Verifierad" : "Verified",
                  isSv ? "Registrerad" : "Registered",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontFamily: "var(--f-mono)",
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr
                  key={user.id}
                  style={{
                    borderTop: "1px solid var(--hairline)",
                    background: idx % 2 === 0 ? "#fff" : "var(--cream)",
                  }}
                >
                  {/* Name + email */}
                  <td style={{ padding: "12px 20px" }}>
                    <div
                      style={{
                        fontFamily: "var(--f-serif)",
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--ink)",
                      }}
                    >
                      {user.name ?? "—"}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: 11,
                        color: "var(--ink-faint)",
                        marginTop: 2,
                      }}
                    >
                      {user.email}
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: "12px 20px" }}>
                    <span
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: 9.5,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: "var(--r-pill)",
                        background:
                          user.role === "ADMIN"
                            ? "rgba(203,162,88,0.15)"
                            : "var(--green-pale)",
                        color:
                          user.role === "ADMIN"
                            ? "var(--gold)"
                            : "var(--green-deep)",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Tips count */}
                  <td
                    style={{
                      padding: "12px 20px",
                      fontFamily: "var(--f-mono)",
                      fontSize: 13,
                      color: "var(--ink-soft)",
                    }}
                  >
                    {user._count.matchTips + user._count.groupAdvancementTips}
                  </td>

                  {/* Verified */}
                  <td style={{ padding: "12px 20px" }}>
                    {user.emailVerified ? (
                      <span style={{ color: "var(--green)", fontSize: 14 }}>
                        ✓
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-faint)", fontSize: 11 }}>
                        —
                      </span>
                    )}
                  </td>

                  {/* Registered */}
                  <td
                    style={{
                      padding: "12px 20px",
                      fontFamily: "var(--f-mono)",
                      fontSize: 11,
                      color: "var(--ink-faint)",
                    }}
                  >
                    {formatDate(user.createdAt, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
