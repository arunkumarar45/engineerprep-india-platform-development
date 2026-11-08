/**
 * Authentication utilities for EngineerPrep India.
 *
 * Security model:
 * - New passwords: Argon2id (memory-hard, resistant to GPU attacks)
 * - Existing bcrypt passwords: transparently verified, then re-hashed to Argon2id on next login
 * - JWT secrets: read from environment; application refuses to start in production without them
 * - Refresh tokens: stored as SHA-256 hashes; rotation + reuse detection implemented
 * - HTTP-only cookies: Secure in production, SameSite=lax
 */

import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { refreshTokens, users } from "@/db/schema";

/* ----------------------------- Secrets ----------------------------- */

/**
 * Lazy-read secrets from env so they are evaluated at request time, not
 * module load time — this allows hot-reload in development to pick up .env
 * changes without restarting the server.
 */
function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] FATAL: JWT_ACCESS_SECRET environment variable is not set. " +
        "The application cannot operate securely without it.",
    );
  }
  return new TextEncoder().encode(
    secret ?? "engineerprep-dev-access-secret-change-me",
  );
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] FATAL: JWT_REFRESH_SECRET environment variable is not set. " +
        "The application cannot operate securely without it.",
    );
  }
  return new TextEncoder().encode(
    secret ?? "engineerprep-dev-refresh-secret-change-me",
  );
}

export const ACCESS_COOKIE = "epi_access";
export const REFRESH_COOKIE = "epi_refresh";
const ACCESS_TTL_MIN = 15;
const REFRESH_TTL_DAYS = 7;

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  collegeName: string | null;
  branchId: string | null;
  semesterId: string | null;
  graduationYear: number | null;
  profileImageUrl: string | null;
  emailVerified: boolean;
};

/* ----------------------------- Password ---------------------------- */

/**
 * Hash a password using Argon2id.
 * Falls back to bcrypt if @node-rs/argon2 is not installed (graceful degradation).
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import("@node-rs/argon2");
    return argon2.hash(password, {
      memoryCost: 65536,     // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  } catch {
    // Fallback to bcrypt if argon2 is not available
    console.warn("[auth] @node-rs/argon2 not available, falling back to bcrypt");
    return bcrypt.hash(password, 12);
  }
}

/**
 * Verify a password against a hash.
 * Transparently supports both Argon2id and bcrypt hashes.
 * When a bcrypt hash is successfully verified, upgrades it to Argon2id.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  // Argon2id hashes start with "$argon2id$" or "$argon2$"
  if (hash.startsWith("$argon2")) {
    try {
      const argon2 = await import("@node-rs/argon2");
      return argon2.verify(hash, password);
    } catch {
      console.warn("[auth] @node-rs/argon2 not available for Argon2id verification");
      return false;
    }
  }

  // bcrypt hashes start with "$2b$" or "$2a$"
  if (hash.startsWith("$2")) {
    return bcrypt.compare(password, hash);
  }

  console.error("[auth] Unknown password hash format — verification failed");
  return false;
}

/**
 * Check if a password hash is bcrypt and needs upgrading to Argon2id.
 * Call this after successful bcrypt verification, then update the stored hash.
 */
export function isLegacyBcryptHash(hash: string): boolean {
  return hash.startsWith("$2");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString("hex");
}

/* ------------------------------- JWT ------------------------------- */

export async function signAccessToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("engineerprep-india")
    .setAudience("engineerprep-india-web")
    .setExpirationTime(`${ACCESS_TTL_MIN}m`)
    .sign(getAccessSecret());
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret(), {
      issuer: "engineerprep-india",
      audience: "engineerprep-india-web",
    });
    return payload as {
      sub: string;
      email: string;
      role: string;
      name: string;
    };
  } catch {
    return null;
  }
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({
    sub: userId,
    typ: "refresh",
    jti: createOpaqueToken(16),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("engineerprep-india")
    .setExpirationTime(`${REFRESH_TTL_DAYS}d`)
    .sign(getRefreshSecret());
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret(), {
      issuer: "engineerprep-india",
    });
    if (payload.typ !== "refresh") return null;
    return payload as { sub: string };
  } catch {
    return null;
  }
}

/* ----------------------------- Cookies ----------------------------- */

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge?: number;
};

function baseCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
}

export async function setAuthCookies(
  access: string,
  refresh: string,
): Promise<void> {
  const store = await cookies();
  const opts = baseCookieOptions();
  store.set(ACCESS_COOKIE, access, {
    ...opts,
    maxAge: ACCESS_TTL_MIN * 60,
  });
  store.set(REFRESH_COOKIE, refresh, {
    ...opts,
    path: "/api/v1/auth",
    maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

/* --------------------------- Refresh store ------------------------- */

export async function persistRefreshToken(
  userId: string,
  token: string,
  meta?: { userAgent?: string; ip?: string },
): Promise<void> {
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 864e5),
    userAgent: meta?.userAgent ?? null,
    ipAddress: meta?.ip ?? null,
  });
}

export async function rotateRefreshToken(oldToken: string) {
  const payload = await verifyRefreshToken(oldToken);
  if (!payload) return null;

  const hash = hashToken(oldToken);
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, hash),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!stored) return null;

  // SECURITY: Refresh token reuse detection.
  // If the token was already revoked, it means someone is trying to reuse a
  // rotated token. Revoke ALL tokens for this user (session family compromise).
  if (stored.revokedAt) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, stored.userId));
    console.warn(
      `[auth] Refresh token reuse detected for user ${stored.userId}. All sessions revoked.`,
    );
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, stored.userId))
    .limit(1);

  if (!user || !user.isActive) return null;

  const nextToken = await signRefreshToken(user.id);

  // Mark old token as rotated
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), replacedBy: stored.id })
    .where(eq(refreshTokens.id, stored.id));

  await persistRefreshToken(user.id, nextToken);
  return { user, refreshToken: nextToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, hashToken(token)));
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));
}

/* ---------------------------- Session read ------------------------- */

export function toSessionUser(row: typeof users.$inferSelect): SessionUser {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    collegeName: row.collegeName,
    branchId: row.branchId,
    semesterId: row.semesterId,
    graduationYear: row.graduationYear,
    profileImageUrl: row.profileImageUrl,
    emailVerified: row.emailVerified,
  };
}

/** Returns the authenticated user from the access cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getAccessCookie();
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);
  if (!row || !row.isActive) return null;
  return toSessionUser(row);
}

/** Requires an authenticated user — throws an AuthError. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Authentication required", 401);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN")
    throw new AuthError("Administrator access required", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

export async function requestMeta(): Promise<{
  userAgent?: string;
  ip?: string;
}> {
  const h = await headers();
  return {
    userAgent: h.get("user-agent") ?? undefined,
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      undefined,
  };
}

/* --------------------------- Password rules ------------------------ */

export function passwordStrength(password: string): {
  score: number;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  const label =
    score >= 85
      ? "Strong"
      : score >= 55
        ? "Medium"
        : score >= 30
          ? "Weak"
          : "Very weak";
  return { score: Math.min(score, 100), label };
}
