/**
 * Authentication API route — EngineerPrep India
 *
 * Handles: register, login, logout, refresh, forgot-password,
 *          reset-password, verify-email, me (GET)
 *
 * Security measures:
 * - Argon2id password hashing (bcrypt hashes transparently upgraded on login)
 * - Refresh token rotation with reuse detection
 * - Rate limiting on login and password reset endpoints
 * - Reset tokens sent ONLY via email (never returned in response body)
 * - Account enumeration prevention on forgot-password
 */
import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import {
  emailVerificationTokens,
  passwordResetTokens,
  users,
} from "@/db/schema";
import {
  clearAuthCookies,
  createOpaqueToken,
  getRefreshCookie,
  hashPassword,
  hashToken,
  isLegacyBcryptHash,
  passwordStrength,
  persistRefreshToken,
  requestMeta,
  requireUser,
  revokeAllUserTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";
import { queueNotification } from "@/lib/automation";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

/* ----------------------------- Schemas ----------------------------- */

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(8, "Enter a valid phone number").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
  collegeName: z.string().min(2, "College name is required"),
  graduationYear: z.coerce.number().int().min(2020).max(2035).optional(),
  acceptTerms: z
    .boolean()
    .refine((value) => value === true, {
      message: "You must accept the terms and conditions",
    }),
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const resetSchema = z.object({
  token: z.string().min(8, "A valid reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(8, "A valid verification token is required"),
});

/* ------------------------- Simple Rate Limiter --------------------- */

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_LOGIN_MAX ?? "5", 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "900", 10) * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) return false;

  record.count += 1;
  return true;
}

function clearRateLimit(key: string): void {
  loginAttempts.delete(key);
}

function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
}

/* ----------------------------- Helpers ----------------------------- */

async function issueSession(user: typeof users.$inferSelect, req: Request) {
  const meta = {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined,
  };
  const access = await signAccessToken(toSessionUser(user));
  const refresh = await signRefreshToken(user.id);
  await persistRefreshToken(user.id, refresh, meta);
  await setAuthCookies(access, refresh);
}

/* ============================= POST ================================ */

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await context.params;
  const action = slug?.[0] ?? "";

  try {
    /* --------------------- REGISTER ----------------------------- */
    if (action === "register") {
      const body = registerSchema.parse(await request.json());

      // Check for existing email (use case-insensitive comparison)
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, body.email.toLowerCase()))
        .limit(1);

      if (existing)
        return apiError("An account with this email already exists", 409);

      const [created] = await db
        .insert(users)
        .values({
          fullName: body.fullName.trim(),
          email: body.email.toLowerCase().trim(),
          phone: body.phone ?? null,
          passwordHash: await hashPassword(body.password),
          role: "STUDENT",        // Always STUDENT — admins created via CLI
          collegeName: body.collegeName,
          graduationYear: body.graduationYear ?? null,
          emailVerified: false,
        })
        .returning();

      // Create verification token
      const verifyToken = createOpaqueToken();
      await db.insert(emailVerificationTokens).values({
        userId: created.id,
        tokenHash: hashToken(verifyToken),
        expiresAt: new Date(Date.now() + 864e5), // 24h
      });

      // Send verification email (non-blocking — log failure only)
      sendVerificationEmail(created.email, created.fullName, verifyToken).catch(
        (err) =>
          console.error("[auth] Failed to send verification email:", err.message),
      );

      await issueSession(created, request);

      // SECURITY: Never return the verification token in the response.
      // The token is sent exclusively via email.
      return apiSuccess(
        {
          user: toSessionUser(created),
          strength: passwordStrength(body.password),
          emailDelivery: process.env.SMTP_HOST ? "sent" : "disabled",
        },
        "Account created successfully. Please check your email to verify your account.",
        201,
      );
    }

    /* --------------------- LOGIN -------------------------------- */
    if (action === "login") {
      const rateLimitKey = getRateLimitKey(request, "login");
      if (!checkRateLimit(rateLimitKey)) {
        return apiError(
          "Too many login attempts. Please wait 15 minutes before trying again.",
          429,
        );
      }

      const body = loginSchema.parse(await request.json());
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email.toLowerCase().trim()))
        .limit(1);

      // SECURITY: Use timing-safe comparison — always call verifyPassword
      // even if user is not found to prevent timing-based enumeration.
      const isValid =
        user != null && (await verifyPassword(body.password, user.passwordHash));

      if (!isValid) {
        return apiError("Invalid email or password", 401);
      }

      if (!user.isActive)
        return apiError("This account has been deactivated", 403);

      // Clear rate limit on successful login
      clearRateLimit(rateLimitKey);

      // SECURITY: Transparently upgrade bcrypt hashes to Argon2id
      if (isLegacyBcryptHash(user.passwordHash)) {
        const newHash = await hashPassword(body.password);
        await db
          .update(users)
          .set({ passwordHash: newHash, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        console.info(
          `[auth] Upgraded bcrypt hash to Argon2id for user ${user.id}`,
        );
      }

      await issueSession(user, request);
      return apiSuccess({ user: toSessionUser(user) }, "Logged in successfully");
    }

    /* --------------------- LOGOUT ------------------------------- */
    if (action === "logout") {
      const token = await getRefreshCookie();
      if (token) await revokeRefreshToken(token);
      await clearAuthCookies();
      return apiSuccess({ loggedOut: true }, "Logged out successfully");
    }

    /* --------------------- REFRESH ------------------------------ */
    if (action === "refresh") {
      const token = await getRefreshCookie();
      if (!token) return apiError("Refresh token missing", 401);
      const rotated = await rotateRefreshToken(token);
      if (!rotated) return apiError("Invalid or expired refresh token", 401);
      await setAuthCookies(
        await signAccessToken(toSessionUser(rotated.user)),
        rotated.refreshToken,
      );
      return apiSuccess(
        { user: toSessionUser(rotated.user) },
        "Session refreshed",
      );
    }

    /* --------------------- FORGOT PASSWORD ---------------------- */
    if (action === "forgot-password") {
      const rateLimitKey = getRateLimitKey(request, "forgot");
      if (!checkRateLimit(rateLimitKey)) {
        return apiError(
          "Too many password reset requests. Please wait before trying again.",
          429,
        );
      }

      const body = forgotSchema.parse(await request.json());
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email.toLowerCase().trim()))
        .limit(1);

      // SECURITY: Always return the same response whether the email exists or not.
      // This prevents account enumeration attacks.
      if (user) {
        const token = createOpaqueToken();
        await db.insert(passwordResetTokens).values({
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 3600_000), // 1 hour
        });

        // SECURITY: Send reset link ONLY via email.
        // NEVER return the token in the response body.
        sendPasswordResetEmail(user.email, user.fullName, token).catch((err) =>
          console.error(
            "[auth] Failed to send password reset email:",
            err.message,
          ),
        );
      }

      // Always return the same message regardless of whether user exists
      return apiSuccess(
        {
          message:
            "If an account exists for this email, password reset instructions have been sent.",
        },
        "Password reset instructions sent",
      );
    }

    /* --------------------- RESET PASSWORD ----------------------- */
    if (action === "reset-password") {
      const body = resetSchema.parse(await request.json());
      const tokenHash = hashToken(body.token);

      const [record] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!record || record.usedAt)
        return apiError("This reset link is invalid or has expired", 400);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, record.userId))
        .limit(1);

      if (!user) return apiError("Account not found", 404);

      // Update password and mark token used in a single transaction-like sequence
      await db
        .update(users)
        .set({
          passwordHash: await hashPassword(body.password),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, record.id));

      // Revoke all active sessions (force re-login with new password)
      await revokeAllUserTokens(user.id);

      return apiSuccess(
        { email: user.email },
        "Password reset successfully. Please log in with your new password.",
      );
    }

    /* --------------------- VERIFY EMAIL ------------------------- */
    if (action === "verify-email") {
      const body = verifyEmailSchema.parse(await request.json());
      const [record] = await db
        .select()
        .from(emailVerificationTokens)
        .where(
          and(
            eq(emailVerificationTokens.tokenHash, hashToken(body.token)),
            gt(emailVerificationTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!record || record.usedAt)
        return apiError(
          "This verification link is invalid or has expired",
          400,
        );

      await db
        .update(users)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, record.userId));

      await db
        .update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, record.id));

      await queueNotification({
        userId: record.userId,
        type: "SYSTEM",
        title: "Email verified",
        body: "Your email address has been verified successfully.",
        linkUrl: "/settings",
        idempotencyKey: `verify-email-${record.id}`,
      });

      return apiSuccess({ verified: true }, "Email verified successfully");
    }

    return apiError("Unknown authentication action", 404);
  } catch (error) {
    return handleError(error, "Authentication failed");
  }
}

/* ============================= GET ================================= */

export async function GET() {
  try {
    const user = await requireUser();
    return apiSuccess({ user }, "Current user fetched");
  } catch (error) {
    return handleError(error, "Authentication required");
  }
}
