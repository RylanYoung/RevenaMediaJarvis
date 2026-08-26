"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");
  const expectedUsername = process.env.DASHBOARD_USERNAME;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  const from = formData.get("from");
  const redirectTarget = typeof from === "string" && from.startsWith("/") ? from : "/";

  if (
    !expectedUsername ||
    !expectedPassword ||
    username !== expectedUsername ||
    password !== expectedPassword
  ) {
    redirect(`/login?error=1&from=${encodeURIComponent(redirectTarget)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("revena_auth", `${expectedUsername}:${expectedPassword}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(redirectTarget);
}
