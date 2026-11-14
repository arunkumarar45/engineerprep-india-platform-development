export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl, isGoogleAuthAvailable } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let nextUrl = searchParams.get("next") || "/dashboard";

    // Prevent open redirect vulnerabilities: Ensure nextUrl is relative and doesn't begin with //
    if (!nextUrl.startsWith("/") || nextUrl.startsWith("//")) {
      nextUrl = "/dashboard";
    }

    if (!isGoogleAuthAvailable()) {
      return NextResponse.redirect(
        new URL("/login?error=google_not_configured", request.nextUrl.origin),
      );
    }

    const state = randomBytes(24).toString("hex");
    const nonce = randomBytes(16).toString("hex");

    const statePayload = JSON.stringify({ state, next: nextUrl, nonce });
    const cookieStore = await cookies();

    cookieStore.set("epi_oauth_state", statePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    const redirectUri = new URL(
      "/api/v1/auth/google/callback",
      request.nextUrl.origin,
    ).toString();

    const authUrl = buildGoogleAuthUrl({
      state,
      redirectUri,
      nonce,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[auth/google] Failed to initialize Google OAuth:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.nextUrl.origin),
    );
  }
}

