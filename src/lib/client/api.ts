/**
 * Centralized API client — EngineerPrep India
 *
 * A thin fetch wrapper that:
 * - Prefixes all requests with the configured API base URL
 * - Attaches the JWT access token from localStorage (client-side)
 * - Handles 401 → automatic refresh token rotation
 * - Returns typed ApiResponse objects
 * - Never throws on HTTP errors — returns { ok: false, error } instead
 *
 * Usage (from any client component):
 *   import { api } from "@/lib/client/api";
 *   const result = await api.get<User[]>("/api/v1/users");
 *   if (!result.ok) console.error(result.error);
 */

export interface ApiResponse<T = unknown> {
  ok: true;
  data: T;
  message?: string;
}

export interface ApiError {
  ok: false;
  error: string;
  status: number;
}

export type ApiResult<T = unknown> = ApiResponse<T> | ApiError;

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */

const BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "")
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "");

/* ------------------------------------------------------------------ */
/* Token management (client-side only)                                  */
/* ------------------------------------------------------------------ */

let accessToken: string | null = null;
let refreshInProgress: Promise<boolean> | null = null;

/** Call this after login / registration to store the token in memory */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Attempt to refresh using the refresh token cookie */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include", // Send refresh token cookie
    });
    if (!res.ok) {
      accessToken = null;
      return false;
    }
    const body = await res.json();
    if (body?.data?.accessToken) {
      accessToken = body.data.accessToken;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Core request function                                                */
/* ------------------------------------------------------------------ */

type RequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Set to true to send FormData — skips JSON Content-Type */
  isFormData?: boolean;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  // Attach bearer token when available
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Set Content-Type for JSON bodies (not FormData)
  if (body !== undefined && !options.isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions: RequestInit = {
    method,
    credentials: "include", // Always include cookies (for refresh token)
    headers,
    signal: options.signal,
  };

  if (body !== undefined) {
    fetchOptions.body = options.isFormData
      ? (body as FormData)
      : JSON.stringify(body);
  }

  let res: Response;

  try {
    res = await fetch(url, fetchOptions);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }

  // ── Handle 401 — try refresh once ─────────────────────────────────
  if (res.status === 401 && accessToken) {
    // Deduplicate refresh calls
    if (!refreshInProgress) {
      refreshInProgress = refreshAccessToken().finally(() => {
        refreshInProgress = null;
      });
    }

    const refreshed = await refreshInProgress;

    if (refreshed) {
      // Retry the original request with the new token
      headers["Authorization"] = `Bearer ${accessToken}`;
      try {
        res = await fetch(url, { ...fetchOptions, headers });
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Network error",
          status: 0,
        };
      }
    } else {
      // Refresh failed — user needs to log in again
      return { ok: false, error: "Session expired. Please log in again.", status: 401 };
    }
  }

  // ── Parse response ────────────────────────────────────────────────
  let parsed: { success?: boolean; data?: T; message?: string; error?: string };

  try {
    parsed = await res.json();
  } catch {
    return {
      ok: false,
      error: `Unexpected response format (HTTP ${res.status})`,
      status: res.status,
    };
  }

  if (!res.ok || parsed.success === false) {
    return {
      ok: false,
      error: parsed.error ?? parsed.message ?? `HTTP ${res.status}`,
      status: res.status,
    };
  }

  return {
    ok: true,
    data: parsed.data as T,
    message: parsed.message,
  };
}

/* ------------------------------------------------------------------ */
/* Public API surface                                                   */
/* ------------------------------------------------------------------ */

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),

  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>("POST", path, formData, { ...options, isFormData: true }),
};

