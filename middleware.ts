// middleware.ts
// Uses auth.config.ts (edge-safe) — NOT lib/auth.ts (which imports nodemailer/bcrypt).

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERNS = [
  /^\/[a-z]{2}\/tips/,
  /^\/[a-z]{2}\/standings/,
  /^\/[a-z]{2}\/competitions/,
  /^\/[a-z]{2}\/admin/,
];

export default auth(function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const intlResponse = intlMiddleware(req);

  const needsAuth = PROTECTED_PATTERNS.some((p) => p.test(pathname));
  if (needsAuth && !session) {
    const locale = pathname.match(/^\/([a-z]{2})\//)?.[1] ?? "sv";
    const loginUrl = new URL(`/${locale}/auth/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|flags).*)"],
};
