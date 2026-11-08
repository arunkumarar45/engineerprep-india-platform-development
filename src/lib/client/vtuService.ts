/**
 * VTU Resources service — EngineerPrep India client
 */
import { api, type ApiResult } from "./api";

export interface Branch {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

export interface Semester {
  id: string;
  number: number;
  label: string;
}

export interface Scheme {
  id: string;
  name: string;
  year: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  branchId?: string | null;
  semesterId?: string | null;
  schemeId?: string | null;
  credits?: number | null;
}

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  resourceType: "NOTES" | "QUESTION_PAPER" | "SYLLABUS" | "LAB_MANUAL" | "ASSIGNMENT" | "OTHER";
  moduleNumber?: number | null;
  fileName: string;
  fileUrl: string;
  fileSize?: string | null;
  downloadCount: number;
  createdAt: string;
  subjectId?: string | null;
  subjectName?: string | null;
  subjectCode?: string | null;
  semesterNumber?: number | null;
  branchCode?: string | null;
  branchName?: string | null;
  schemeName?: string | null;
}

export interface VtuUpdate {
  id: string;
  title: string;
  category: string;
  summary?: string | null;
  fileUrl?: string | null;
  fileSize?: string | null;
  publishedAt: string;
}

export interface ResourceFilters {
  q?: string;
  branchId?: string;
  semesterId?: string;
  schemeId?: string;
  subjectId?: string;
  module?: string;
  type?: string;
}

export async function getBranches(): Promise<ApiResult<Branch[]>> {
  return api.get<Branch[]>("/api/v1/vtu/branches");
}

export async function getSemesters(): Promise<ApiResult<Semester[]>> {
  return api.get<Semester[]>("/api/v1/vtu/semesters");
}

export async function getSchemes(): Promise<ApiResult<Scheme[]>> {
  return api.get<Scheme[]>("/api/v1/vtu/schemes");
}

export async function getSubjects(filters?: {
  branchId?: string;
  semesterId?: string;
  schemeId?: string;
}): Promise<ApiResult<Subject[]>> {
  const params = new URLSearchParams();
  if (filters?.branchId) params.set("branchId", filters.branchId);
  if (filters?.semesterId) params.set("semesterId", filters.semesterId);
  if (filters?.schemeId) params.set("schemeId", filters.schemeId);
  const qs = params.toString();
  return api.get<Subject[]>(`/api/v1/vtu/subjects${qs ? `?${qs}` : ""}`);
}

export async function getResources(
  filters: ResourceFilters = {},
): Promise<ApiResult<Resource[]>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return api.get<Resource[]>(`/api/v1/vtu/resources${qs ? `?${qs}` : ""}`);
}

export async function downloadResource(
  resourceId: string,
): Promise<ApiResult<{ downloadUrl: string }>> {
  return api.post<{ downloadUrl: string }>(
    `/api/v1/vtu/resources/${resourceId}/download`,
  );
}

export async function getVtuUpdates(): Promise<ApiResult<VtuUpdate[]>> {
  return api.get<VtuUpdate[]>("/api/v1/vtu/updates");
}

export async function getDownloadHistory(): Promise<ApiResult<Resource[]>> {
  return api.get<Resource[]>("/api/v1/vtu/downloads");
}

