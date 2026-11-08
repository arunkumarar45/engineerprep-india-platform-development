/**
 * Authentication unit tests — EngineerPrep India
 *
 * Tests core auth utilities without requiring a database connection.
 * All DB-touching functions are tested via mocks.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock drizzle db so auth.ts can be imported without a real PostgreSQL connection
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// Mock schema
vi.mock("@/db/schema", () => ({
  refreshTokens: { id: "id", userId: "userId", tokenHash: "tokenHash", expiresAt: "expiresAt", revokedAt: "revokedAt", replacedBy: "replacedBy", userAgent: "userAgent", ipAddress: "ipAddress" },
  users: { id: "id", email: "email", isActive: "isActive" },
}));

import {
  hashPassword,
  verifyPassword,
  isLegacyBcryptHash,
  hashToken,
  createOpaqueToken,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  passwordStrength,
  AuthError,
  type SessionUser,
} from "@/lib/auth";

/* ------------------------------------------------------------------ */
/* hashPassword / verifyPassword                                       */
/* ------------------------------------------------------------------ */

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies it correctly", async () => {
    const password = "SecureP@ss123";
    const hash = await hashPassword(password);
    expect(hash).toBeTruthy();
    expect(hash).not.toEqual(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("CorrectPassword1");
    const result = await verifyPassword("WrongPassword1", hash);
    expect(result).toBe(false);
  });

  it("produces different hashes for the same password (salt)", async () => {
    const password = "SamePassword1!";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toEqual(hash2);
  });
});

/* ------------------------------------------------------------------ */
/* isLegacyBcryptHash                                                  */
/* ------------------------------------------------------------------ */

describe("isLegacyBcryptHash", () => {
  it("identifies bcrypt hashes", () => {
    expect(isLegacyBcryptHash("$2b$12$someHashValue")).toBe(true);
    expect(isLegacyBcryptHash("$2a$10$someHashValue")).toBe(true);
  });

  it("does not flag argon2id hashes as bcrypt", () => {
    expect(isLegacyBcryptHash("$argon2id$v=19$m=65536")).toBe(false);
  });

  it("does not flag plain strings as bcrypt", () => {
    expect(isLegacyBcryptHash("not-a-hash")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* hashToken                                                           */
/* ------------------------------------------------------------------ */

describe("hashToken", () => {
  it("produces a hex string", () => {
    const hash = hashToken("some-opaque-token");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    const token = "consistent-token";
    expect(hashToken(token)).toEqual(hashToken(token));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toEqual(hashToken("token-b"));
  });
});

/* ------------------------------------------------------------------ */
/* createOpaqueToken                                                   */
/* ------------------------------------------------------------------ */

describe("createOpaqueToken", () => {
  it("creates a hex string of default length", () => {
    const token = createOpaqueToken();
    expect(typeof token).toBe("string");
    // 48 bytes = 96 hex chars
    expect(token).toHaveLength(96);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("respects custom byte length", () => {
    const token = createOpaqueToken(32);
    expect(token).toHaveLength(64);
  });

  it("generates unique tokens", () => {
    const t1 = createOpaqueToken();
    const t2 = createOpaqueToken();
    expect(t1).not.toEqual(t2);
  });
});

/* ------------------------------------------------------------------ */
/* signAccessToken / verifyAccessToken                                 */
/* ------------------------------------------------------------------ */

const testUser: SessionUser = {
  id: "00000000-0000-0000-0000-000000000001",
  fullName: "Test Student",
  email: "test@example.com",
  role: "STUDENT",
  collegeName: "Test College",
  branchId: null,
  semesterId: null,
  graduationYear: 2025,
  profileImageUrl: null,
  emailVerified: true,
};

describe("signAccessToken / verifyAccessToken", () => {
  it("signs and verifies a valid access token", async () => {
    const token = await signAccessToken(testUser);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT format

    const payload = await verifyAccessToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(testUser.id);
    expect(payload?.email).toBe(testUser.email);
    expect(payload?.role).toBe(testUser.role);
  });

  it("returns null for an invalid token", async () => {
    const result = await verifyAccessToken("invalid.jwt.token");
    expect(result).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await signAccessToken(testUser);
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifyAccessToken(tampered);
    expect(result).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const result = await verifyAccessToken("");
    expect(result).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* signRefreshToken / verifyRefreshToken                               */
/* ------------------------------------------------------------------ */

describe("signRefreshToken / verifyRefreshToken", () => {
  it("signs and verifies a valid refresh token", async () => {
    const userId = "00000000-0000-0000-0000-000000000002";
    const token = await signRefreshToken(userId);
    expect(token).toBeTruthy();

    const payload = await verifyRefreshToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(userId);
  });

  it("rejects invalid refresh token", async () => {
    const result = await verifyRefreshToken("bad.token.value");
    expect(result).toBeNull();
  });

  it("rejects access token as refresh token", async () => {
    // An access token should not be accepted as a refresh token
    // because it doesn't have typ: "refresh"
    const accessToken = await signAccessToken(testUser);
    const result = await verifyRefreshToken(accessToken);
    expect(result).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* passwordStrength                                                     */
/* ------------------------------------------------------------------ */

describe("passwordStrength", () => {
  it("rates a strong password correctly", () => {
    const { score, label } = passwordStrength("MyStr0ng!Pass#2024");
    expect(score).toBeGreaterThanOrEqual(85);
    expect(label).toBe("Strong");
  });

  it("rates a medium password correctly", () => {
    const { score, label } = passwordStrength("Medium12");
    expect(score).toBeGreaterThanOrEqual(55);
    expect(score).toBeLessThan(85);
    expect(label).toBe("Medium");
  });

  it("rates a weak password correctly", () => {
    const { score, label } = passwordStrength("weakone");
    expect(score).toBeLessThan(55);
    expect(["Very weak", "Weak"]).toContain(label);
  });

  it("caps score at 100", () => {
    const { score } = passwordStrength("V3ryStr0ng!P@ssw0rd#2024AbcXyz");
    expect(score).toBeLessThanOrEqual(100);
  });
});

/* ------------------------------------------------------------------ */
/* AuthError                                                           */
/* ------------------------------------------------------------------ */

describe("AuthError", () => {
  it("creates an error with the correct status", () => {
    const err = new AuthError("Unauthorized", 401);
    expect(err.message).toBe("Unauthorized");
    expect(err.status).toBe(401);
    expect(err.name).toBe("AuthError");
  });

  it("defaults to status 401", () => {
    const err = new AuthError("No auth");
    expect(err.status).toBe(401);
  });

  it("is an instance of Error", () => {
    const err = new AuthError("Test", 403);
    expect(err).toBeInstanceOf(Error);
  });
});

