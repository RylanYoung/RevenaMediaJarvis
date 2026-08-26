import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "revena_auth";

export function proxy(request: NextRequest) {
  // Vercel Cron hits /api/sync/* with its own bearer secret, not our
  // login cookie — let those through on their own auth, checked again
  // (defense in depth) inside each route's GET handler.
  if (request.nextUrl.pathname.startsWith("/api/sync/")) {
    const auth = request.headers.get("authorization");
    if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.next();
    }
  }

  // Stripe's servers hit /api/webhooks/* directly — no login cookie either.
  // Real auth is the Stripe-Signature check inside the route itself.
  if (request.nextUrl.pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  const username = process.env.DASHBOARD_USERNAME;
  const password = process.env.DASHBOARD_PASSWORD;

  // No credentials configured (e.g. local dev before you've set them) — don't lock yourself out.
  if (!username || !password) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE);
  if (cookie?.value === `${username}:${password}`) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Static assets (logo, favicon, etc.) stay public — the Next.js image
  // optimizer fetches them internally without the auth cookie, and they
  // aren't sensitive, unlike everything else in the app.
  matcher: [
    "/((?!login|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif)$).*)",
  ],
};
