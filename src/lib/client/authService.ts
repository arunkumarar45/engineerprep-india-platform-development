/**
 * Auth service — EngineerPrep India client
 * Handles login, registration, logout, password reset, token management.
 */
import { api, setAccessToken, type ApiResult } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "STUDENT" | "ADMIN";
  isActive: boolean;
  emailVerified: boolean;
  profileImageUrl?: string | null;
  collegeName?: string | null;
  graduationYear?: number | null;
}

export interface AuthTokens {
  accessToken: string;
  user: AuthUser;
}

/* ------------------------------------------------------------------ */
/* Login                                                                */
/* ------------------------------------------------------------------ */

export async function login(
  email: string,
  password: string,
): Promise<ApiResult<AuthTokens>> {
  const result = await api.post<AuthTokens>("/api/v1/auth/login", {
    email,
    password,
  });

  if (result.ok && result.data.accessToken) {
    setAccessToken(result.data.accessToken);
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* Register                                                             */
/* ------------------------------------------------------------------ */

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  collegeName?: string;
  graduationYear?: number;
  branch?: string;
}

export async function register(
  payload: RegisterPayload,
): Promise<ApiResult<AuthTokens>> {
  const result = await api.post<AuthTokens>("/api/v1/auth/register", payload);

  if (result.ok && result.data.accessToken) {
    setAccessToken(result.data.accessToken);
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* Logout                                                               */
/* ------------------------------------------------------------------ */

export async function logout(): Promise<void> {
  await api.post("/api/v1/auth/logout");
  setAccessToken(null);
}

/* ------------------------------------------------------------------ */
/* Get current user                                                     */
/* ------------------------------------------------------------------ */

export async function getCurrentUser(): Promise<ApiResult<AuthUser>> {
  return api.get<AuthUser>("/api/v1/auth/me");
}

/* ------------------------------------------------------------------ */
/* Password management                                                  */
/* ------------------------------------------------------------------ */

export async function forgotPassword(email: string): Promise<ApiResult<null>> {
  return api.post("/api/v1/auth/forgot-password", { email });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<ApiResult<null>> {
  return api.post("/api/v1/auth/reset-password", { token, password });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ApiResult<null>> {
  return api.post("/api/v1/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

/* ------------------------------------------------------------------ */
/* Email verification                                                   */
/* ------------------------------------------------------------------ */

export async function verifyEmail(token: string): Promise<ApiResult<null>> {
  return api.post("/api/v1/auth/verify-email", { token });
}

export async function resendVerification(): Promise<ApiResult<null>> {
  return api.post("/api/v1/auth/resend-verification");
}

/* ------------------------------------------------------------------ */
/* Profile update                                                       */
/* ------------------------------------------------------------------ */

export interface ProfileUpdatePayload {
  fullName?: string;
  collegeName?: string;
  graduationYear?: number;
  branch?: string;
  cgpa?: number;
  profileImageUrl?: string;
  bio?: string;
}

export async function updateProfile(
  payload: ProfileUpdatePayload,
): Promise<ApiResult<AuthUser>> {
  return api.put<AuthUser>("/api/v1/auth/profile", payload);
}

