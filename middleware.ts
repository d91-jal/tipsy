// middleware.ts
import { auth } from "@/lib/auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication
const PROTECTED_PATTERNS = [
  /^\/[a-z]{2}\/tips/,
  /^\/[a-z]{2}\/standings/,
  /^\/[a-z]{2}\/competitions/,
  /^\/[a-z]{2}\/admin/,
];

// Routes only accessible to admins
const ADMIN_PATTERNS = [/^\/[a-z]{2}\/admin/];

export default auth(async function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Handle i18n routing first
  const intlResponse = intlMiddleware(req);

  // Check if route needs auth
  const needsAuth = PROTECTED_PATTERNS.some((p) => p.test(pathname));
  if (needsAuth && !session) {
    const loginUrl = new URL(`/${getLocale(pathname)}/auth/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if route needs admin
  const needsAdmin = ADMIN_PATTERNS.some((p) => p.test(pathname));
  if (needsAdmin && session?.user?.role !== "ADMIN") {
    const homeUrl = new URL(`/${getLocale(pathname)}`, req.url);
    return NextResponse.redirect(homeUrl);
  }

  return intlResponse;
});

function getLocale(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})\//);
  return match?.[1] ?? "sv";
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|flags).*)",
  ],
};
