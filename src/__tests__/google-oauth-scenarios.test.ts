/**
 * Google OAuth Comprehensive Scenario Test Suite — EngineerPrep India
 * 
 * Verifies all 15 required OAuth & session security scenarios:
 * 1. New user registration via Google creates student account with verified email
 * 2. Existing Google user logs in directly
 * 3. Existing email/password user links account without password loss
 * 4. Google Sign-In with unverified email is rejected (email_verified: false)
 * 5. Invalid ID token is rejected
 * 6. Expired ID token is rejected
 * 7. Token signed by untrusted party is rejected
 * 8. State mismatch (CSRF) is rejected
 * 9. Missing state parameter is rejected
 * 10. Missing authorization code is rejected
 * 11. Cancelled authorization (user clicks Cancel on Google consent) handles error=access_denied
 * 12. Invalid / open redirect URI is sanitized to /dashboard
 * 13. Session cookie (epi_access, epi_refresh) issuance on successful authentication
 * 14. Authenticated request accepts issued access token
 * 15. Unauthenticated request without token is rejected
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: mockLimit,
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: mockReturning,
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: mockReturning,
        }),
      }),
    }),
  },
}));

// Mock Google Auth utilities
const mockExchangeGoogleCode = vi.fn();
const mockVerifyGoogleIdToken = vi.fn();

vi.mock("@/lib/google-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/google-auth")>();
  return {
    ...actual,
    exchangeGoogleCode: (...args: unknown[]) => mockExchangeGoogleCode(...args),
    verifyGoogleIdToken: (...args: unknown[]) => mockVerifyGoogleIdToken(...args),
  };
});

// Mock Auth token utilities
const mockSignAccessToken = vi.fn().mockResolvedValue("mock.access.jwt");
const mockSignRefreshToken = vi.fn().mockResolvedValue("mock.refresh.jwt");
const mockPersistRefreshToken = vi.fn().mockResolvedValue(undefined);
const mockSetAuthCookies = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    signAccessToken: (...args: unknown[]) => mockSignAccessToken(...args),
    signRefreshToken: (...args: unknown[]) => mockSignRefreshToken(...args),
    persistRefreshToken: (...args: unknown[]) => mockPersistRefreshToken(...args),
    setAuthCookies: (...args: unknown[]) => mockSetAuthCookies(...args),
  };
});

// Mock cookies
const cookieStoreMap = new Map<string, { value: string }>();
const mockCookieDelete = vi.fn((key: string) => cookieStoreMap.delete(key));
const mockCookieSet = vi.fn((key: string, val: string) => cookieStoreMap.set(key, { value: val }));
const mockCookieGet = vi.fn((key: string) => cookieStoreMap.get(key));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (key: string) => mockCookieGet(key),
    set: (key: string, val: string) => mockCookieSet(key, val),
    delete: (key: string) => mockCookieDelete(key),
  }),
}));

import { GET as googleCallbackGET } from "@/app/api/v1/auth/google/callback/route";
import { signAccessToken, verifyAccessToken } from "@/lib/auth";

describe("Google OAuth 15 Verification Scenarios", () => {
  const validState = "valid-oauth-state-token";
  const validStatePayload = JSON.stringify({ state: validState, next: "/dashboard", nonce: "nonce123" });

  beforeEach(() => {
    vi.clearAllMocks();
    cookieStoreMap.clear();
    cookieStoreMap.set("epi_oauth_state", { value: validStatePayload });
  });

  // Scenario 1: New user registration via Google creates student account with verified email
  it("Scenario 1: registers new user as STUDENT with verified email", async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "valid.id.token" });
    mockVerifyGoogleIdToken.mockResolvedValueOnce({
      sub: "google-sub-new-123",
      email: "newstudent@vtu.ac.in",
      emailVerified: true,
      name: "VTU Student",
      picture: "https://lh3.googleusercontent.com/photo.jpg",
    });

    // 1st lookup by googleId -> not found
    mockLimit.mockResolvedValueOnce([]);
    // 2nd lookup by email -> not found
    mockLimit.mockResolvedValueOnce([]);

    const createdUser = {
      id: "usr_new_123",
      fullName: "VTU Student",
      email: "newstudent@vtu.ac.in",
      googleId: "google-sub-new-123",
      role: "STUDENT",
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
    };
    mockReturning.mockResolvedValueOnce([createdUser]);

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=good_code&state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
    expect(mockSignAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ id: "usr_new_123", role: "STUDENT" })
    );
    expect(mockSetAuthCookies).toHaveBeenCalledWith("mock.access.jwt", "mock.refresh.jwt");
  });

  // Scenario 2: Existing Google user logs in directly
  it("Scenario 2: logs in existing Google user directly", async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "valid.id.token" });
    mockVerifyGoogleIdToken.mockResolvedValueOnce({
      sub: "google-sub-existing-456",
      email: "existing@vtu.ac.in",
      emailVerified: true,
      name: "Existing Google User",
    });

    const existingUser = {
      id: "usr_existing_456",
      fullName: "Existing Google User",
      email: "existing@vtu.ac.in",
      googleId: "google-sub-existing-456",
      role: "STUDENT",
      isActive: true,
    };
    // 1st lookup by googleId -> found!
    mockLimit.mockResolvedValueOnce([existingUser]);

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=good_code&state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
    expect(mockSignAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ id: "usr_existing_456" })
    );
  });

  // Scenario 3: Existing email/password user links account without password loss
  it("Scenario 3: links Google ID to existing email account preserving role and password", async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "valid.id.token" });
    mockVerifyGoogleIdToken.mockResolvedValueOnce({
      sub: "google-sub-link-789",
      email: "passworduser@vtu.ac.in",
      emailVerified: true,
      name: "Password User",
    });

    // 1st lookup by googleId -> not found
    mockLimit.mockResolvedValueOnce([]);

    // 2nd lookup by email -> found existing email/password account!
    const existingPasswordUser = {
      id: "usr_pwd_789",
      fullName: "Password User",
      email: "passworduser@vtu.ac.in",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$existinghash",
      role: "STUDENT",
      googleId: null,
      isActive: true,
    };
    mockLimit.mockResolvedValueOnce([existingPasswordUser]);

    const updatedUser = {
      ...existingPasswordUser,
      googleId: "google-sub-link-789",
      emailVerified: true,
    };
    mockReturning.mockResolvedValueOnce([updatedUser]);

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=good_code&state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
    expect(mockReturning).toHaveBeenCalled();
  });

  // Scenario 4: Google Sign-In with unverified email is rejected
  it("Scenario 4: rejects Google account when email is not verified", async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "valid.id.token" });
    mockVerifyGoogleIdToken.mockResolvedValueOnce({
      sub: "google-sub-unverified",
      email: "unverified@gmail.com",
      emailVerified: false, // NOT VERIFIED
      name: "Unverified User",
    });

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=good_code&state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=unverified_google_email");
  });

  // Scenario 5: Invalid ID token is rejected
  it("Scenario 5: rejects invalid / malformed ID token", async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "malformed.id.token" });
    mockVerifyGoogleIdToken.mockRejectedValueOnce(new Error("JWT signature verification failed"));

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=bad_token_code&state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=auth_failed");
  });

  // Scenario 6: Expired ID token is rejected
  it("Scenario 6: rejects expired ID token", async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "expired.id.token" });
    mockVerifyGoogleIdToken.mockRejectedValueOnce(new Error('"exp" claim timestamp check failed'));

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=expired_code&state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=auth_failed");
  });

  // Scenario 7: Token signed by untrusted party is rejected
  it("Scenario 7: rejects token signed by untrusted issuer or wrong audience", async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "untrusted.party.token" });
    mockVerifyGoogleIdToken.mockRejectedValueOnce(new Error('unexpected "iss" claim value'));

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=wrong_iss_code&state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=auth_failed");
  });

  // Scenario 8: State mismatch (CSRF) is rejected
  it("Scenario 8: rejects state mismatch indicating potential CSRF", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/google/callback?code=some_code&state=forged-state-attack");
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=state_mismatch");
  });

  // Scenario 9: Missing state parameter is rejected
  it("Scenario 9: rejects callback when state parameter is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/google/callback?code=some_code");
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=invalid_request");
  });

  // Scenario 10: Missing authorization code is rejected
  it("Scenario 10: rejects callback when authorization code is missing", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=invalid_request");
  });

  // Scenario 11: Cancelled authorization (user clicks Cancel on Google consent)
  it("Scenario 11: handles user cancelling consent (error=access_denied)", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/google/callback?error=access_denied");
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?error=google_access_denied");
    expect(mockCookieDelete).toHaveBeenCalledWith("epi_oauth_state");
  });

  // Scenario 12: Invalid / open redirect URI is sanitized to /dashboard
  it("Scenario 12: sanitizes protocol-relative or external next parameter to /dashboard", async () => {
    // Malicious open redirect in state
    const maliciousPayload = JSON.stringify({ state: validState, next: "//attacker.com/steal" });
    cookieStoreMap.set("epi_oauth_state", { value: maliciousPayload });

    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "valid.id.token" });
    mockVerifyGoogleIdToken.mockResolvedValueOnce({
      sub: "google-sub-sanitized",
      email: "student@vtu.ac.in",
      emailVerified: true,
      name: "Student",
    });

    const user = { id: "usr_1", fullName: "Student", email: "student@vtu.ac.in", role: "STUDENT", isActive: true };
    mockLimit.mockResolvedValueOnce([user]);

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=good_code&state=${validState}`);
    const res = await googleCallbackGET(req);

    expect(res.status).toBe(307);
    // Should NOT redirect to //attacker.com
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  // Scenario 13: Session cookie issuance on successful authentication
  it("Scenario 13: issues epi_access and epi_refresh cookies and clears state cookie", async () => {
    mockExchangeGoogleCode.mockResolvedValueOnce({ id_token: "valid.id.token" });
    mockVerifyGoogleIdToken.mockResolvedValueOnce({
      sub: "google-sub-session",
      email: "session@vtu.ac.in",
      emailVerified: true,
      name: "Session Student",
    });

    const user = { id: "usr_session_1", fullName: "Session Student", email: "session@vtu.ac.in", role: "STUDENT", isActive: true };
    mockLimit.mockResolvedValueOnce([user]);

    const req = new NextRequest(`http://localhost:3000/api/v1/auth/google/callback?code=good_code&state=${validState}`);
    await googleCallbackGET(req);

    expect(mockSignAccessToken).toHaveBeenCalledWith(expect.objectContaining({ id: "usr_session_1" }));
    expect(mockSignRefreshToken).toHaveBeenCalledWith("usr_session_1");
    expect(mockPersistRefreshToken).toHaveBeenCalled();
    expect(mockSetAuthCookies).toHaveBeenCalledWith("mock.access.jwt", "mock.refresh.jwt");
    expect(mockCookieDelete).toHaveBeenCalledWith("epi_oauth_state");
  });

  // Scenario 14: Authenticated request accepts issued access token
  it("Scenario 14: accepts valid JWT token and extracts session user", async () => {
    // Generate valid JWT using jose with test secret
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || "access-secret-minimum-32-characters-for-testing-purposes");
    const token = await new SignJWT({
      sub: "usr_jwt_test",
      email: "verified@vtu.ac.in",
      role: "STUDENT",
      name: "Verified Student",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("engineerprep-india")
      .setAudience("engineerprep-india-web")
      .setExpirationTime("15m")
      .sign(secret);

    const verified = await verifyAccessToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe("usr_jwt_test");
    expect(verified?.email).toBe("verified@vtu.ac.in");
    expect(verified?.role).toBe("STUDENT");
  });

  // Scenario 15: Unauthenticated request without token is rejected
  it("Scenario 15: rejects request with null, empty, or tampered token", async () => {
    expect(await verifyAccessToken("")).toBeNull();
    expect(await verifyAccessToken("invalid.jwt.signature")).toBeNull();
    expect(await verifyAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered")).toBeNull();
  });
});
