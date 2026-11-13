export type VtuAcademicCategory =
  | "QUESTION_PAPER"
  | "SYLLABUS"
  | "ASSIGNMENT";

export interface DiscoveredResourceInput {
  title: string;
  category: VtuAcademicCategory;
  subjectCode?: string;
  subjectName?: string;
  branchCode?: string;
  schemeName?: string;
  semesterNumber?: number;
  examYear?: number;
  examMonth?: string;
  examType?: string;
  moduleNumber?: number;
  sourceWebsite: string;
  sourcePageUrl: string;
  originalFileUrl: string;
}

export interface ValidationResult {
  isValid: boolean;
  mimeType: string;
  fileHash: string;
  fileSizeBytes: number;
  fileSizeHuman: string;
  detectedCategory?: VtuAcademicCategory;
  isPdf: boolean;
  isHtmlErrorPage: boolean;
  notes?: string;
  error?: string;
}

export interface CollectionJobFilters {
  category?: VtuAcademicCategory;
  sourceWebsite?: string;
  branchCode?: string;
  schemeName?: string;
  semesterNumber?: number;
  subjectCode?: string;
  limit?: number;
}

export interface CollectionJobSummary {
  jobId: string;
  jobType: "DISCOVERY" | "DOWNLOAD" | "VALIDATION" | "UPLOAD";
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  totalItems: number;
  processedItems: number;
  successCount: number;
  failedCount: number;
  progress: number;
  errorMessage?: string;
}

