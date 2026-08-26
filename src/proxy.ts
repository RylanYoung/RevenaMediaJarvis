import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "revena_auth";

export function proxy(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;

  // No password configured (e.g. local dev before you've set one) — don't lock yourself out.
  if (!password) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE);
  if (cookie?.value === password) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
