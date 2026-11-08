/**
 * DSA service — EngineerPrep India client
 */
import { api, type ApiResult } from "./api";

export interface DsaSheet {
  id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  coverTint?: string | null;
  difficulty: string;
  totalProblems: number;
  slug: string;
}

export interface DsaPattern {
  id: string;
  name: string;
  slug: string;
  summary?: string | null;
  about?: string | null;
  icon?: string | null;
}

export interface DsaProblem {
  id: string;
  title: string;
  slug: string;
  statement?: string | null;
  practiceUrl?: string | null;
  difficulty: string;
  orderIndex: number;
  sheetId?: string | null;
  patternId?: string | null;
  createdAt: string;
  completed?: boolean;
  bookmarked?: boolean;
}

export interface DsaProgress {
  problemId: string;
  userId: string;
  completed: boolean;
  completedAt?: string | null;
}

export async function getDsaSheets(): Promise<ApiResult<DsaSheet[]>> {
  return api.get<DsaSheet[]>("/api/v1/dsa/sheets");
}

export async function getDsaSheet(slug: string): Promise<ApiResult<DsaSheet>> {
  return api.get<DsaSheet>(`/api/v1/dsa/sheets/${slug}`);
}

export async function getDsaPatterns(): Promise<ApiResult<DsaPattern[]>> {
  return api.get<DsaPattern[]>("/api/v1/dsa/patterns");
}

export async function getDsaPattern(slug: string): Promise<ApiResult<DsaPattern>> {
  return api.get<DsaPattern>(`/api/v1/dsa/patterns/${slug}`);
}

export async function getDsaProblems(filters?: {
  sheetId?: string;
  patternId?: string;
  difficulty?: string;
  q?: string;
}): Promise<ApiResult<DsaProblem[]>> {
  const params = new URLSearchParams();
  if (filters?.sheetId) params.set("sheetId", filters.sheetId);
  if (filters?.patternId) params.set("patternId", filters.patternId);
  if (filters?.difficulty) params.set("difficulty", filters.difficulty);
  if (filters?.q) params.set("q", filters.q);
  const qs = params.toString();
  return api.get<DsaProblem[]>(`/api/v1/dsa/problems${qs ? `?${qs}` : ""}`);
}

export async function getDsaProblem(
  slug: string,
): Promise<ApiResult<DsaProblem>> {
  return api.get<DsaProblem>(`/api/v1/dsa/problems/${slug}`);
}

export async function markProblemComplete(
  problemId: string,
): Promise<ApiResult<DsaProgress>> {
  return api.post<DsaProgress>(`/api/v1/dsa/progress`, { problemId, completed: true });
}

export async function markProblemIncomplete(
  problemId: string,
): Promise<ApiResult<DsaProgress>> {
  return api.post<DsaProgress>(`/api/v1/dsa/progress`, {
    problemId,
    completed: false,
  });
}

export async function getDsaProgress(): Promise<ApiResult<DsaProgress[]>> {
  return api.get<DsaProgress[]>("/api/v1/dsa/progress");
}

export async function bookmarkProblem(
  problemId: string,
): Promise<ApiResult<null>> {
  return api.post("/api/v1/dsa/bookmarks", { problemId });
}

export async function unbookmarkProblem(
  problemId: string,
): Promise<ApiResult<null>> {
  return api.delete(`/api/v1/dsa/bookmarks/${problemId}`);
}

