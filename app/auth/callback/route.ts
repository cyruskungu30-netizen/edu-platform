 import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(value: string | null) {
  if (!value) {
    return "/";
  }

  const trimmed = value.trim();

  /*
   * Only allow internal application paths.
   *
   * Block:
   *   https://evil-site.com
   *   //evil-site.com
   *   javascript:...
   *   other external destinations
   */
  if (!trimmed.startsWith("/")) {
    return "/";
  }

  if (trimmed.startsWith("//")) {
    return "/";
  }

  if (trimmed.includes("\\")) {
    return "/";
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");

    if (parsed.origin !== "http://localhost") {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  /*
   * Supabase may also return an error through the callback URL.
   */
  const errorDescription =
    requestUrl.searchParams.get("error_description");

  if (errorDescription) {
    const loginUrl = new URL("/auth/login", request.url);

    loginUrl.searchParams.set(
      "error",
      "Your authentication link is invalid or has expired.",
    );

    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/auth/login", request.url);

    loginUrl.searchParams.set(
      "error",
      "The authentication link is missing or invalid.",
    );

    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "Supabase authentication callback error:",
      error.message,
    );

    const loginUrl = new URL("/auth/login", request.url);

    loginUrl.searchParams.set(
      "error",
      "Your authentication link has expired or is no longer valid.",
    );

    return NextResponse.redirect(loginUrl);
  }

  const safePath = getSafeRedirectPath(next);

  return NextResponse.redirect(
    new URL(safePath, request.url),
  );
}