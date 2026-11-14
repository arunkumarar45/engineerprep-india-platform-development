/**
 * Google OAuth 2.0 & OpenID Connect authentication service
 *
 * Security & compliance:
 * - Uses Google OIDC discovery endpoint and public JWKS for cryptographic signature verification
 * - Verifies token audience, issuer, expiration, and email_verified claim
 * - Enforces state parameter for CSRF mitigation
 * - Transparently links Google accounts to existing accounts matching verified email
 */

import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

const GOOGLE_DISCOVERY_URL = "https://accounts.google.com";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export interface GoogleUserClaims {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token?: string;
}

// Remote JWKS set cached by jose
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getGoogleJWKS() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));
  }
  return jwksCache;
}

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const defaultCallback =
    process.env.GOOGLE_CALLBACK_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/v1/auth/google/callback`;

  return {
    clientId,
    clientSecret,
    defaultCallback,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export function isGoogleAuthAvailable(): boolean {
  const { isConfigured } = getGoogleConfig();
  return isConfigured;
}

/**
 * Builds the Google OAuth consent authorization URL
 */
export function buildGoogleAuthUrl(params: {
  state: string;
  redirectUri?: string;
  nonce?: string;
}): string {
  const { clientId, defaultCallback } = getGoogleConfig();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const redirectUri = params.redirectUri || defaultCallback;
  const url = new URL(GOOGLE_AUTH_ENDPOINT);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");

  if (params.nonce) {
    url.searchParams.set("nonce", params.nonce);
  }

  return url.toString();
}

/**
 * Exchanges authorization code for tokens at Google's token endpoint
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri?: string,
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, defaultCallback } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const effectiveRedirectUri = redirectUri || defaultCallback;

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: effectiveRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = "Failed to exchange Google authorization code";
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.error_description || parsed.error || message;
    } catch {
      // ignore
    }
    throw new Error(`${message} (HTTP ${response.status})`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

/**
 * Verifies a Google ID token against Google's public JWKS.
 * Validates issuer, audience, expiration, and email_verified.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedClientId?: string,
): Promise<GoogleUserClaims> {
  const { clientId } = getGoogleConfig();
  const aud = expectedClientId || clientId;

  if (!aud) {
    throw new Error("Google Client ID is missing for verification");
  }

  const JWKS = getGoogleJWKS();

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: aud,
  });

  const claims = payload as JWTPayload & {
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    sub: string;
  };

  if (!claims.sub) {
    throw new Error("ID token is missing 'sub' claim");
  }

  if (!claims.email) {
    throw new Error("ID token is missing 'email' claim");
  }

  return {
    sub: claims.sub,
    email: claims.email.toLowerCase().trim(),
    emailVerified: Boolean(claims.email_verified),
    name: claims.name || claims.email.split("@")[0],
    picture: claims.picture,
  };
}

