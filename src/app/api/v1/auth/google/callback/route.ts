import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  exchangeGoogleCode,
  verifyGoogleIdToken,
} from "@/lib/google-auth";
import {
  hashPassword,
  createOpaqueToken,
  signAccessToken,
  signRefreshToken,
  persistRefreshToken,
  setAuthCookies,
  toSessionUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const cookieStore = await cookies();

  try {
    const searchParams = request.nextUrl.searchParams;
    const error = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const clearStateCookie = () => {
      cookieStore.delete("epi_oauth_state");
    };

    if (error) {
      clearStateCookie();
      const codeError =
        error === "access_denied" ? "google_access_denied" : "auth_failed";
      return NextResponse.redirect(new URL(`/login?error=${codeError}`, origin));
    }

    if (!code || !state) {
      clearStateCookie();
      return NextResponse.redirect(new URL("/login?error=invalid_request", origin));
    }

    const stateCookie = cookieStore.get("epi_oauth_state")?.value;
    if (!stateCookie) {
      clearStateCookie();
      return NextResponse.redirect(new URL("/login?error=state_expired", origin));
    }

    let parsedState: { state: string; next?: string; nonce?: string };
    try {
      parsedState = JSON.parse(stateCookie);
    } catch {
      clearStateCookie();
      return NextResponse.redirect(new URL("/login?error=invalid_state", origin));
    }

    if (!parsedState.state || parsedState.state !== state) {
      clearStateCookie();
      return NextResponse.redirect(new URL("/login?error=state_mismatch", origin));
    }

    const redirectUri = new URL(
      "/api/v1/auth/google/callback",
      origin,
    ).toString();

    const tokenResponse = await exchangeGoogleCode(code, redirectUri);
    const claims = await verifyGoogleIdToken(tokenResponse.id_token);

    if (!claims.emailVerified) {
      clearStateCookie();
      return NextResponse.redirect(
        new URL("/login?error=unverified_google_email", origin),
      );
    }

    // Account resolution
    // 1. Look up by Google ID
    const [existingByGoogle] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, claims.sub))
      .limit(1);

    let user = existingByGoogle;

    if (!user) {
      // 2. Look up by verified email
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, claims.email))
        .limit(1);

      if (existingByEmail) {
        // Link Google ID to existing account
        const [updated] = await db
          .update(users)
          .set({
            googleId: claims.sub,
            emailVerified: true,
            profileImageUrl:
              existingByEmail.profileImageUrl || claims.picture || null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByEmail.id))
          .returning();
        user = updated;
      } else {
        // 3. Create new user account
        const [created] = await db
          .insert(users)
          .values({
            fullName: claims.name || claims.email.split("@")[0],
            email: claims.email,
            googleId: claims.sub,
            passwordHash: await hashPassword(createOpaqueToken(32)),
            role: "STUDENT",
            profileImageUrl: claims.picture || null,
            emailVerified: true,
            isActive: true,
          })
          .returning();
        user = created;
      }
    }

    if (!user.isActive) {
      clearStateCookie();
      return NextResponse.redirect(
        new URL("/login?error=account_deactivated", origin),
      );
    }

    // Issue session tokens
    const meta = {
      userAgent: request.headers.get("user-agent") ?? undefined,
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        undefined,
    };

    const sessionUser = toSessionUser(user);
    const access = await signAccessToken(sessionUser);
    const refresh = await signRefreshToken(user.id);

    await persistRefreshToken(user.id, refresh, meta);
    await setAuthCookies(access, refresh);
    clearStateCookie();

    let targetUrl = parsedState.next || "/dashboard";
    if (!targetUrl.startsWith("/") || targetUrl.startsWith("//")) {
      targetUrl = "/dashboard";
    }

    return NextResponse.redirect(new URL(targetUrl, origin));
  } catch (err) {
    console.error("[auth/google/callback] OAuth error:", err);
    cookieStore.delete("epi_oauth_state");
    return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
  }
}
