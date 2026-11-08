/**
 * Jobs & Applications service — EngineerPrep India client
 */
import { api, type ApiResult } from "./api";

export interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
}

export interface Opportunity {
  id: string;
  title: string;
  description?: string | null;
  opportunityType: "JOB" | "INTERNSHIP" | "OFF_CAMPUS";
  companyId?: string | null;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  location: string;
  workMode: "ONSITE" | "REMOTE" | "HYBRID";
  salaryMin?: number | null;
  salaryMax?: number | null;
  stipend?: number | null;
  duration?: string | null;
  applicationDeadline?: string | null;
  applicationUrl?: string | null;
  graduationBatch?: number | null;
  status: string;
  postedAt: string;
  isSaved?: boolean;
}

export interface JobApplication {
  id: string;
  opportunityId: string;
  userId: string;
  status: "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  opportunity?: Partial<Opportunity>;
}

export interface OpportunityFilters {
  q?: string;
  type?: "JOB" | "INTERNSHIP" | "OFF_CAMPUS";
  workMode?: "ONSITE" | "REMOTE" | "HYBRID";
  location?: string;
  batch?: string;
  status?: string;
}

export async function getOpportunities(
  filters: OpportunityFilters = {},
): Promise<ApiResult<Opportunity[]>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return api.get<Opportunity[]>(`/api/v1/jobs${qs ? `?${qs}` : ""}`);
}

export async function getOpportunity(
  id: string,
): Promise<ApiResult<Opportunity>> {
  return api.get<Opportunity>(`/api/v1/jobs/${id}`);
}

export async function applyToOpportunity(
  opportunityId: string,
  resume?: File,
): Promise<ApiResult<JobApplication>> {
  if (resume) {
    const form = new FormData();
    form.append("opportunityId", opportunityId);
    form.append("resume", resume);
    return api.upload<JobApplication>("/api/v1/jobs/apply", form);
  }
  return api.post<JobApplication>("/api/v1/jobs/apply", { opportunityId });
}

export async function getMyApplications(): Promise<ApiResult<JobApplication[]>> {
  return api.get<JobApplication[]>("/api/v1/jobs/applications");
}

export async function saveOpportunity(
  opportunityId: string,
): Promise<ApiResult<null>> {
  return api.post("/api/v1/jobs/saved", { opportunityId });
}

export async function unsaveOpportunity(
  opportunityId: string,
): Promise<ApiResult<null>> {
  return api.delete(`/api/v1/jobs/saved/${opportunityId}`);
}

export async function getSavedOpportunities(): Promise<
  ApiResult<Opportunity[]>
> {
  return api.get<Opportunity[]>("/api/v1/jobs/saved");
}

export async function getCompanies(): Promise<ApiResult<Company[]>> {
  return api.get<Company[]>("/api/v1/jobs/companies");
}

