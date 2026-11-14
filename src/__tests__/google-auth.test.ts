/**
 * Google OAuth unit tests — EngineerPrep India
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

import {
  isGoogleAuthAvailable,
  getGoogleConfig,
  buildGoogleAuthUrl,
  verifyGoogleIdToken,
} from "@/lib/google-auth";

describe("Google OAuth Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Configuration & Availability", () => {
    it("reports unavailable when credentials are not configured", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      expect(isGoogleAuthAvailable()).toBe(false);
      const config = getGoogleConfig();
      expect(config.isConfigured).toBe(false);
      expect(config.clientId).toBe("");
    });

    it("reports available when client ID and secret are configured", () => {
      process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret";

      expect(isGoogleAuthAvailable()).toBe(true);
      const config = getGoogleConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.clientId).toBe("test-client-id.apps.googleusercontent.com");
      expect(config.clientSecret).toBe("test-secret");
    });
  });

  describe("buildGoogleAuthUrl", () => {
    it("throws if GOOGLE_CLIENT_ID is not configured", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      expect(() => buildGoogleAuthUrl({ state: "random-state-123" })).toThrow(
        "GOOGLE_CLIENT_ID is not configured",
      );
    });

    it("builds valid authorization URL with standard parameters", () => {
      process.env.GOOGLE_CLIENT_ID = "my-client-id";
      process.env.GOOGLE_CALLBACK_URL = "http://localhost:3000/api/v1/auth/google/callback";

      const urlString = buildGoogleAuthUrl({
        state: "state-token-xyz",
        nonce: "nonce-token-abc",
      });

      const url = new URL(urlString);
      expect(url.origin).toBe("https://accounts.google.com");
      expect(url.pathname).toBe("/o/oauth2/v2/auth");
      expect(url.searchParams.get("client_id")).toBe("my-client-id");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "http://localhost:3000/api/v1/auth/google/callback",
      );
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("scope")).toBe("openid email profile");
      expect(url.searchParams.get("state")).toBe("state-token-xyz");
      expect(url.searchParams.get("nonce")).toBe("nonce-token-abc");
      expect(url.searchParams.get("access_type")).toBe("offline");
      expect(url.searchParams.get("prompt")).toBe("select_account");
    });

    it("allows custom redirectUri override", () => {
      process.env.GOOGLE_CLIENT_ID = "my-client-id";

      const customUri = "https://engineerprep.in/api/v1/auth/google/callback";
      const urlString = buildGoogleAuthUrl({
        state: "xyz",
        redirectUri: customUri,
      });

      const url = new URL(urlString);
      expect(url.searchParams.get("redirect_uri")).toBe(customUri);
    });
  });

  describe("verifyGoogleIdToken", () => {
    it("throws if client ID is missing", async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      await expect(verifyGoogleIdToken("fake.jwt.token")).rejects.toThrow(
        "Google Client ID is missing for verification",
      );
    });
  });
});

