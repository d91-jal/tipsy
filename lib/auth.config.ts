// lib/auth.config.ts
// Edge-compatible auth configuration — no Node.js-only modules.
// Used by middleware only. Full providers live in lib/auth.ts.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
