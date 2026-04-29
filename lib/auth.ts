// lib/auth.ts
// Full auth configuration — Node.js server only, never Edge Runtime.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
        secure: process.env.EMAIL_SERVER_SECURE === "true",
      },
      from: process.env.EMAIL_FROM ?? "noreply@tipsy.app",
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const { createTransport } = await import("nodemailer");
        const transport = createTransport(provider.server as any);
        await transport.sendMail({
          to: email,
          from: provider.from,
          subject: "Din inloggningslänk till Tipsy",
          html: magicLinkEmail(url),
          text: `Klicka på länken för att logga in: ${url}`,
        });
      },
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On sign in, persist id and role into the token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // Fetch locale from DB (lightweight, cached by Next.js)
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { locale: true },
        });
        session.user.locale = dbUser?.locale ?? "sv";
      }
      return session;
    },
  },
});

function magicLinkEmail(url: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 8px;">Tipsy ⚽</h1>
  <p style="color: #475569; margin-bottom: 24px;">
    Klicka på knappen nedan för att logga in. Länken är giltig i 24 timmar.
  </p>
  <a href="${url}"
     style="background: #16a34a; color: white; padding: 12px 24px;
            border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
    Logga in nu
  </a>
  <p style="color: #94a3b8; margin-top: 24px; font-size: 14px;">
    Om du inte begärt den här länken kan du ignorera detta e-postmeddelande.
  </p>
  <p style="color: #cbd5e1; margin-top: 8px; font-size: 12px;">${url}</p>
</body>
</html>`;
}
