/**
 * Admin service — EngineerPrep India client
 * All calls require ADMIN role; the backend enforces this.
 */
import { api, type ApiResult } from "./api";

export interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalResources: number;
  totalOpportunities: number;
  totalDsaProblems: number;
  totalRoadmaps: number;
  totalMockTests: number;
  recentSignups: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  category: string;
  cronExpression?: string | null;
  queueName: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecution {
  id: string;
  ruleId?: string | null;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";
  triggerSource: string;
  attempts: number;
  message?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface StudentRecord {
  id: string;
  email: string;
  fullName: string;
  collegeName?: string | null;
  graduationYear?: number | null;
  role: "STUDENT" | "ADMIN";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Stats                                                                */
/* ------------------------------------------------------------------ */

export async function getAdminStats(): Promise<ApiResult<AdminStats>> {
  return api.get<AdminStats>("/api/v1/admin/stats");
}

/* ------------------------------------------------------------------ */
/* Students                                                             */
/* ------------------------------------------------------------------ */

export async function getAllStudents(): Promise<ApiResult<{ students: StudentRecord[] }>> {
  return api.get<{ students: StudentRecord[] }>("/api/v1/admin/students");
}

export async function updateStudent(
  studentId: string,
  payload: { isActive?: boolean; role?: "STUDENT" | "ADMIN" },
): Promise<ApiResult<{ id: string }>> {
  return api.put(`/api/v1/admin/students/${studentId}`, payload);
}

/* ------------------------------------------------------------------ */
/* Automations                                                          */
/* ------------------------------------------------------------------ */

export async function getAutomations(): Promise<
  ApiResult<{ rules: AutomationRule[]; executions: AutomationExecution[] }>
> {
  return api.get("/api/v1/admin/automations");
}

export async function createAutomationRule(payload: {
  name: string;
  description?: string;
  category: string;
  cronExpression?: string;
  queueName: string;
  status?: "ACTIVE" | "DISABLED";
}): Promise<ApiResult<{ rule: AutomationRule }>> {
  return api.post("/api/v1/admin/automations", payload);
}

export async function runAutomationRule(
  ruleId: string,
): Promise<ApiResult<unknown>> {
  return api.post(`/api/v1/admin/automations/run/${ruleId}`);
}

export async function toggleAutomationStatus(
  ruleId: string,
  status: "ACTIVE" | "DISABLED",
): Promise<ApiResult<{ id: string; status: string }>> {
  return api.put(`/api/v1/admin/automations/${ruleId}/status`, { status });
}

/* ------------------------------------------------------------------ */
/* Resources                                                            */
/* ------------------------------------------------------------------ */

export interface ResourcePayload {
  title: string;
  description?: string;
  resourceType: "NOTES" | "QUESTION_PAPER" | "SYLLABUS" | "LAB_MANUAL" | "ASSIGNMENT" | "OTHER";
  subjectId?: string;
  moduleNumber?: number;
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export async function createResource(
  payload: ResourcePayload,
): Promise<ApiResult<{ resource: unknown }>> {
  return api.post("/api/v1/admin/resources", payload);
}

export async function updateResource(
  id: string,
  payload: Partial<ResourcePayload>,
): Promise<ApiResult<{ id: string }>> {
  return api.put(`/api/v1/admin/resources/${id}`, payload);
}

export async function deleteResource(
  id: string,
): Promise<ApiResult<{ id: string }>> {
  return api.delete(`/api/v1/admin/resources/${id}`);
}

/* ------------------------------------------------------------------ */
/* DSA                                                                  */
/* ------------------------------------------------------------------ */

export async function createDsaSheet(payload: {
  title: string;
  author?: string;
  description?: string;
  difficulty?: string;
  slug?: string;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/dsa-sheets", payload);
}

export async function createDsaPattern(payload: {
  name: string;
  slug?: string;
  summary?: string;
  about?: string;
  icon?: string;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/dsa-patterns", payload);
}

export async function createDsaProblem(payload: {
  title: string;
  slug?: string;
  difficulty?: string;
  practiceUrl?: string;
  sheetId?: string;
  patternId?: string;
  orderIndex?: number;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/dsa-problems", payload);
}

export async function updateDsaProblem(
  id: string,
  payload: Record<string, unknown>,
): Promise<ApiResult<{ id: string }>> {
  return api.put(`/api/v1/admin/dsa-problems/${id}`, payload);
}

export async function deleteDsaProblem(
  id: string,
): Promise<ApiResult<{ id: string }>> {
  return api.delete(`/api/v1/admin/dsa-problems/${id}`);
}

/* ------------------------------------------------------------------ */
/* Roadmaps                                                             */
/* ------------------------------------------------------------------ */

export async function createRoadmap(payload: {
  title: string;
  slug?: string;
  description?: string;
  category: string;
  difficulty?: string;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/roadmaps", payload);
}

export async function createRoadmapStage(payload: {
  roadmapId: string;
  title: string;
  description?: string;
  orderIndex?: number;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/roadmap-stages", payload);
}

export async function createRoadmapTopic(payload: {
  stageId: string;
  title: string;
  resourceUrl?: string;
  estimatedMinutes?: number;
  orderIndex?: number;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/roadmap-topics", payload);
}

export async function deleteRoadmap(
  id: string,
): Promise<ApiResult<{ id: string }>> {
  return api.delete(`/api/v1/admin/roadmaps/${id}`);
}

/* ------------------------------------------------------------------ */
/* Mock Tests                                                           */
/* ------------------------------------------------------------------ */

export async function createMockTest(payload: {
  title: string;
  subject: string;
  description?: string;
  difficulty?: string;
  durationMinutes?: number;
  totalMarks?: number;
  isPublished?: boolean;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/mock-tests", payload);
}

export async function createQuestion(payload: {
  testId: string;
  topic?: string;
  text: string;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  orderIndex?: number;
  options: Array<{ label: string; text: string; isCorrect: boolean }>;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/questions", payload);
}

export async function deleteQuestion(
  id: string,
): Promise<ApiResult<{ id: string }>> {
  return api.delete(`/api/v1/admin/questions/${id}`);
}

/* ------------------------------------------------------------------ */
/* Export                                                               */
/* ------------------------------------------------------------------ */

export function getExportUrl(
  kind: "resources" | "opportunities" | "students" | "dsa-problems",
): string {
  return `/api/v1/admin/export?kind=${kind}`;
}

/* ------------------------------------------------------------------ */
/* Audit logs                                                           */
/* ------------------------------------------------------------------ */

export async function getAuditLogs(): Promise<ApiResult<{ logs: unknown[] }>> {
  return api.get("/api/v1/admin/audit-logs");
}

/* ------------------------------------------------------------------ */
/* Opportunities                                                        */
/* ------------------------------------------------------------------ */

export async function createOpportunity(payload: {
  title: string;
  description?: string;
  opportunityType: "JOB" | "INTERNSHIP" | "OFF_CAMPUS";
  companyId?: string;
  location: string;
  workMode?: "ONSITE" | "REMOTE" | "HYBRID";
  salaryMin?: number;
  salaryMax?: number;
  stipend?: number;
  applicationDeadline?: string;
  applicationUrl?: string;
  graduationBatch?: number;
}): Promise<ApiResult<unknown>> {
  return api.post("/api/v1/admin/opportunities", payload);
}

export async function deleteOpportunity(
  id: string,
): Promise<ApiResult<{ id: string }>> {
  return api.delete(`/api/v1/admin/opportunities/${id}`);
}

/* ------------------------------------------------------------------ */
/* Bulk import                                                          */
/* ------------------------------------------------------------------ */

export async function uploadBulkImport(
  file: File,
  kind: string,
): Promise<ApiResult<{ jobId: string; preview: unknown[]; totalRows: number }>> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  return api.upload("/api/v1/admin/bulk-import", form);
}

export async function confirmBulkImport(
  jobId: string,
): Promise<ApiResult<{ inserted: number; skipped: number }>> {
  return api.post(`/api/v1/admin/bulk-import/confirm`, { jobId });
}

