/**
 * EngineerPrep India — PostgreSQL schema (Drizzle ORM)
 * Covers: users/auth, VTU resources, DSA, roadmaps, mock tests,
 * jobs & applications, dashboard, notifications, admin & automation.
 */
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  varchar,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
  numeric,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", ["STUDENT", "ADMIN"]);
export const resourceType = pgEnum("resource_type", [
  "NOTES",
  "QUESTION_PAPER",
  "SYLLABUS",
  "LAB_MANUAL",
  "ASSIGNMENT",
  "OTHER",
]);
export const resourceStatus = pgEnum("resource_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);
export const difficulty = pgEnum("difficulty", [
  "EASY",
  "MEDIUM",
  "HARD",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);
export const opportunityType = pgEnum("opportunity_type", [
  "JOB",
  "INTERNSHIP",
  "OFF_CAMPUS",
]);
export const workMode = pgEnum("work_mode", [
  "ONSITE",
  "REMOTE",
  "HYBRID",
]);
export const applicationStatus = pgEnum("application_status", [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
]);
export const notificationType = pgEnum("notification_type", [
  "VTU_UPDATE",
  "JOB_ALERT",
  "INTERNSHIP_ALERT",
  "APPLICATION_UPDATE",
  "DEADLINE_REMINDER",
  "DSA_REMINDER",
  "ROADMAP_REMINDER",
  "MOCK_TEST_REMINDER",
  "WEEKLY_REPORT",
  "SYSTEM",
]);
export const deliveryStatus = pgEnum("delivery_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "SKIPPED",
]);
export const importStatus = pgEnum("import_status", [
  "PENDING",
  "VALIDATED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
export const automationStatus = pgEnum("automation_status", [
  "ACTIVE",
  "DISABLED",
]);
export const executionStatus = pgEnum("execution_status", [
  "QUEUED",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "SKIPPED",
]);
export const bookmarkKind = pgEnum("bookmark_kind", [
  "RESOURCE",
  "JOB",
  "PROBLEM",
  "ROADMAP",
  "TEST",
]);
export const testAttemptStatus = pgEnum("test_attempt_status", [
  "IN_PROGRESS",
  "SUBMITTED",
  "AUTO_SUBMITTED",
  "ABANDONED",
]);

/* ------------------------------------------------------------------ */
/* A. Users & authentication                                          */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 24 }),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("STUDENT"),
    collegeName: varchar("college_name", { length: 200 }),
    branchId: uuid("branch_id"),
    semesterId: uuid("semester_id"),
    graduationYear: integer("graduation_year"),
    profileImageUrl: text("profile_image_url"),
    emailVerified: boolean("email_verified").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  }),
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedBy: uuid("replaced_by"),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("refresh_tokens_hash_idx").on(t.tokenHash),
    userIdx: index("refresh_tokens_user_idx").on(t.userId),
  }),
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("password_reset_tokens_hash_idx").on(t.tokenHash),
  }),
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("email_verification_tokens_hash_idx").on(t.tokenHash),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 120 }).notNull(),
    entity: varchar("entity", { length: 120 }).notNull(),
    entityId: varchar("entity_id", { length: 120 }),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    actorIdx: index("audit_logs_actor_idx").on(t.actorId),
    entityIdx: index("audit_logs_entity_idx").on(t.entity, t.entityId),
  }),
);

/* ------------------------------------------------------------------ */
/* B. VTU resources                                                   */
/* ------------------------------------------------------------------ */

export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
});

export const schemes = pgTable("schemes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 40 }).notNull(),
});

export const semesters = pgTable("semesters", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: integer("number").notNull(),
  label: varchar("label", { length: 80 }).notNull(),
});

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "cascade",
    }),
    semesterId: uuid("semester_id").references(() => semesters.id, {
      onDelete: "cascade",
    }),
    schemeId: uuid("scheme_id").references(() => schemes.id, {
      onDelete: "set null",
    }),
    credits: integer("credits").default(3),
  },
  (t) => ({
    codeIdx: index("subjects_code_idx").on(t.code),
    branchIdx: index("subjects_branch_idx").on(t.branchId, t.semesterId),
  }),
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 260 }).notNull(),
    description: text("description"),
    resourceType: resourceType("resource_type").notNull().default("NOTES"),
    subjectId: uuid("subject_id").references(() => subjects.id, {
      onDelete: "set null",
    }),
    moduleNumber: integer("module_number"),
    fileName: varchar("file_name", { length: 260 }).notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: varchar("file_size", { length: 40 }).notNull().default("—"),
    uploadedBy: uuid("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    status: resourceStatus("status").notNull().default("PUBLISHED"),
    downloadCount: integer("download_count").notNull().default(0),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "set null",
    }),
    schemeId: uuid("scheme_id").references(() => schemes.id, {
      onDelete: "set null",
    }),
    semesterId: uuid("semester_id").references(() => semesters.id, {
      onDelete: "set null",
    }),
    subjectCode: varchar("subject_code", { length: 40 }),
    examYear: integer("exam_year"),
    examMonth: varchar("exam_month", { length: 30 }),
    examType: varchar("exam_type", { length: 40 }),
    sourceWebsite: varchar("source_website", { length: 120 }),
    sourcePageUrl: text("source_page_url"),
    originalFileUrl: text("original_file_url"),
    fileHash: varchar("file_hash", { length: 64 }),
    mimeType: varchar("mime_type", { length: 80 }).default("application/pdf"),
    downloadStatus: varchar("download_status", { length: 40 }).default("COMPLETED"),
    verificationStatus: varchar("verification_status", { length: 40 }).default("VERIFIED"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    typeIdx: index("resources_type_idx").on(t.resourceType),
    subjectIdx: index("resources_subject_idx").on(t.subjectId),
    statusIdx: index("resources_status_idx").on(t.status),
    branchIdx: index("resources_branch_idx").on(t.branchId),
    schemeIdx: index("resources_scheme_idx").on(t.schemeId),
    semesterIdx: index("resources_semester_idx").on(t.semesterId),
    hashIdx: index("resources_file_hash_idx").on(t.fileHash),
  }),
);

export const vtuUpdates = pgTable(
  "vtu_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 260 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    summary: text("summary"),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    fileUrl: text("file_url"),
    fileSize: varchar("file_size", { length: 40 }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    publishedIdx: index("vtu_updates_published_idx").on(t.publishedAt),
  }),
);

export const vtuDiscoveredResources = pgTable(
  "vtu_discovered_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: resourceType("category").notNull().default("QUESTION_PAPER"),
    title: varchar("title", { length: 300 }).notNull(),
    subjectCode: varchar("subject_code", { length: 40 }),
    subjectName: varchar("subject_name", { length: 260 }),
    branchCode: varchar("branch_code", { length: 40 }),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "set null",
    }),
    schemeName: varchar("scheme_name", { length: 60 }),
    schemeId: uuid("scheme_id").references(() => schemes.id, {
      onDelete: "set null",
    }),
    semesterNumber: integer("semester_number"),
    semesterId: uuid("semester_id").references(() => semesters.id, {
      onDelete: "set null",
    }),
    examYear: integer("exam_year"),
    examMonth: varchar("exam_month", { length: 30 }),
    examType: varchar("exam_type", { length: 40 }),
    moduleNumber: integer("module_number"),
    sourceWebsite: varchar("source_website", { length: 120 }).notNull(),
    sourcePageUrl: text("source_page_url"),
    originalFileUrl: text("original_file_url").notNull(),
    storedFilePath: text("stored_file_path"),
    fileSize: varchar("file_size", { length: 40 }).default("—"),
    fileHash: varchar("file_hash", { length: 64 }),
    mimeType: varchar("mime_type", { length: 80 }).default("application/pdf"),
    downloadStatus: varchar("download_status", { length: 40 })
      .notNull()
      .default("DISCOVERED"), // DISCOVERED, DOWNLOADING, DOWNLOADED, FAILED
    validationStatus: varchar("validation_status", { length: 40 })
      .notNull()
      .default("PENDING"), // PENDING, VALID, INVALID, FLAGGED
    validationNotes: text("validation_notes"),
    approvalStatus: varchar("approval_status", { length: 40 })
      .notNull()
      .default("PENDING_REVIEW"), // PENDING_REVIEW, APPROVED, REJECTED
    isUploaded: boolean("is_uploaded").notNull().default(false),
    uploadedResourceId: uuid("uploaded_resource_id").references(
      () => resources.id,
      { onDelete: "set null" },
    ),
    errorLog: text("error_log"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    categoryIdx: index("vtu_discovered_category_idx").on(t.category),
    sourceWebsiteIdx: index("vtu_discovered_source_idx").on(t.sourceWebsite),
    approvalIdx: index("vtu_discovered_approval_idx").on(t.approvalStatus),
    downloadStatusIdx: index("vtu_discovered_download_status_idx").on(
      t.downloadStatus,
    ),
    validationStatusIdx: index("vtu_discovered_validation_status_idx").on(
      t.validationStatus,
    ),
    hashIdx: index("vtu_discovered_hash_idx").on(t.fileHash),
    origUrlIdx: index("vtu_discovered_orig_url_idx").on(t.originalFileUrl),
  }),
);

export const vtuCollectionJobs = pgTable(
  "vtu_collection_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobType: varchar("job_type", { length: 40 }).notNull(), // DISCOVERY, DOWNLOAD, VALIDATION, UPLOAD
    category: resourceType("category"),
    sourceWebsite: varchar("source_website", { length: 120 }),
    status: varchar("status", { length: 40 }).notNull().default("QUEUED"), // QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED
    progress: integer("progress").notNull().default(0),
    totalItems: integer("total_items").notNull().default(0),
    processedItems: integer("processed_items").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    filters: jsonb("filters").default(sql`'{}'::jsonb`),
    result: jsonb("result").default(sql`'{}'::jsonb`),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    statusIdx: index("vtu_jobs_status_idx").on(t.status),
    typeIdx: index("vtu_jobs_type_idx").on(t.jobType),
    createdAtIdx: index("vtu_jobs_created_idx").on(t.createdAt),
  }),
);

export const downloads = pgTable(
  "downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "cascade",
    }),
    downloadedAt: timestamp("downloaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("downloads_user_idx").on(t.userId),
    resourceIdx: index("downloads_resource_idx").on(t.resourceId),
  }),
);

/* ------------------------------------------------------------------ */
/* C. DSA management                                                  */
/* ------------------------------------------------------------------ */

export const dsaSheets = pgTable("dsa_sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 160 }),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailSource: varchar("thumbnail_source", { length: 120 }),
  thumbnailSourceUrl: text("thumbnail_source_url"),
  thumbnailAlt: varchar("thumbnail_alt", { length: 240 }),
  thumbnailStatus: varchar("thumbnail_status", { length: 40 }).default("ACTIVE"),
  coverTint: varchar("cover_tint", { length: 40 }).default("#FF5A00"),
  difficulty: difficulty("difficulty").notNull().default("BEGINNER"),
  totalProblems: integer("total_problems").notNull().default(0),
  slug: varchar("slug", { length: 120 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 240 }).notNull(),
    category: varchar("category", { length: 60 }).notNull().default("dsa"),
    instructor: varchar("instructor", { length: 160 }),
    channel: varchar("channel", { length: 160 }),
    totalVideos: integer("total_videos").notNull().default(0),
    totalDuration: varchar("total_duration", { length: 60 }),
    rating: numeric("rating", { precision: 3, scale: 1 }).default("4.8"),
    badge: varchar("badge", { length: 120 }),
    description: text("description"),
    playlistUrl: text("playlist_url").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    thumbnailSource: varchar("thumbnail_source", { length: 120 }),
    thumbnailSourceUrl: text("thumbnail_source_url"),
    thumbnailAlt: varchar("thumbnail_alt", { length: 240 }),
    thumbnailStatus: varchar("thumbnail_status", { length: 40 }).notNull().default("ACTIVE"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("playlists_slug_idx").on(t.slug),
    categoryIdx: index("playlists_category_idx").on(t.category),
  }),
);

export const dsaPatterns = pgTable("dsa_patterns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  summary: text("summary"),
  about: text("about"),
  whenToUse: jsonb("when_to_use").default(sql`'[]'::jsonb`),
  templates: jsonb("templates").default(sql`'{}'::jsonb`),
  icon: varchar("icon", { length: 60 }).default("sparkles"),
  tint: varchar("tint", { length: 40 }).default("#FF5A00"),
});

export const dsaProblems = pgTable(
  "dsa_problems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 240 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    statement: text("statement"),
    examples: jsonb("examples").default(sql`'[]'::jsonb`),
    constraints: jsonb("constraints").default(sql`'[]'::jsonb`),
    hints: jsonb("hints").default(sql`'[]'::jsonb`),
    editorial: text("editorial"),
    practiceUrl: text("practice_url"),
    topic: varchar("topic", { length: 160 }),
    subtopic: varchar("subtopic", { length: 160 }),
    platform: varchar("platform", { length: 60 }),
    videoUrl: text("video_url"),
    difficulty: difficulty("difficulty").notNull().default("EASY"),
    orderIndex: integer("order_index").notNull().default(0),
    sheetId: uuid("sheet_id").references(() => dsaSheets.id, {
      onDelete: "set null",
    }),
    patternId: uuid("pattern_id").references(() => dsaPatterns.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    sheetIdx: index("dsa_problems_sheet_idx").on(t.sheetId),
    patternIdx: index("dsa_problems_pattern_idx").on(t.patternId),
    slugIdx: uniqueIndex("dsa_problems_slug_idx").on(t.slug),
  }),
);

export const dsaSolutions = pgTable(
  "dsa_solutions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => dsaProblems.id, { onDelete: "cascade" }),
    language: varchar("language", { length: 40 }).notNull(),
    code: text("code").notNull(),
    complexity: varchar("complexity", { length: 80 }),
  },
  (t) => ({
    problemIdx: index("dsa_solutions_problem_idx").on(t.problemId),
  }),
);

export const dsaProgress = pgTable(
  "dsa_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => dsaProblems.id, { onDelete: "cascade" }),
    sheetId: uuid("sheet_id").references(() => dsaSheets.id, {
      onDelete: "cascade",
    }),
    completed: boolean("completed").notNull().default(true),
    solvedAt: timestamp("solved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userProblemIdx: uniqueIndex("dsa_progress_user_problem_idx").on(
      t.userId,
      t.problemId,
    ),
    userIdx: index("dsa_progress_user_idx").on(t.userId),
  }),
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: bookmarkKind("kind").notNull().default("RESOURCE"),
    refId: uuid("ref_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userKindIdx: uniqueIndex("bookmarks_user_kind_idx").on(
      t.userId,
      t.kind,
      t.refId,
    ),
  }),
);

/* ------------------------------------------------------------------ */
/* D. Developer roadmaps                                              */
/* ------------------------------------------------------------------ */

export const roadmaps = pgTable("roadmaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 60 }).notNull().default("Web Dev"),
  coverImageUrl: text("cover_image_url"),
  coverTint: varchar("cover_tint", { length: 40 }).default("#FF5A00"),
  icon: varchar("icon", { length: 60 }).default("route"),
  stepCount: integer("step_count").notNull().default(0),
  estimatedDuration: varchar("estimated_duration", { length: 60 }),
  difficulty: difficulty("difficulty").notNull().default("BEGINNER"),
});

export const roadmapStages = pgTable(
  "roadmap_stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roadmapId: uuid("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => ({
    roadmapIdx: index("roadmap_stages_roadmap_idx").on(t.roadmapId),
  }),
);

export const roadmapTopics = pgTable(
  "roadmap_topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => roadmapStages.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    resourceUrl: text("resource_url"),
    resourceLabel: varchar("resource_label", { length: 160 }),
    estimatedMinutes: integer("estimated_minutes").default(60),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => ({
    stageIdx: index("roadmap_topics_stage_idx").on(t.stageId),
  }),
);

export const roadmapProgress = pgTable(
  "roadmap_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roadmapId: uuid("roadmap_id")
      .notNull()
      .references(() => roadmaps.id, { onDelete: "cascade" }),
    topicId: uuid("topic_id").references(() => roadmapTopics.id, {
      onDelete: "cascade",
    }),
    completed: boolean("completed").notNull().default(true),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userRoadmapIdx: uniqueIndex("roadmap_progress_user_roadmap_topic_idx").on(
      t.userId,
      t.roadmapId,
      t.topicId,
    ),
    userIdx: index("roadmap_progress_user_idx").on(t.userId),
  }),
);

/* ------------------------------------------------------------------ */
/* E. Mock tests & assessments                                        */
/* ------------------------------------------------------------------ */

export const mockTests = pgTable("mock_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  subject: varchar("subject", { length: 120 }).notNull(),
  description: text("description"),
  difficulty: difficulty("difficulty").notNull().default("MEDIUM"),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  totalMarks: integer("total_marks").notNull().default(100),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .notNull()
      .references(() => mockTests.id, { onDelete: "cascade" }),
    topic: varchar("topic", { length: 120 }).notNull().default("General"),
    text: text("text").notNull(),
    explanation: text("explanation"),
    marks: integer("marks").notNull().default(2),
    negativeMarks: numeric("negative_marks", { precision: 4, scale: 2 })
      .notNull()
      .default("0"),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => ({
    testIdx: index("questions_test_idx").on(t.testId),
  }),
);

export const questionOptions = pgTable(
  "question_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 8 }).notNull(),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
  },
  (t) => ({
    questionIdx: index("question_options_question_idx").on(t.questionId),
  }),
);

export const testAttempts = pgTable(
  "test_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    testId: uuid("test_id")
      .notNull()
      .references(() => mockTests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: testAttemptStatus("status").notNull().default("IN_PROGRESS"),
    score: integer("score").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    incorrectCount: integer("incorrect_count").notNull().default(0),
    unattemptedCount: integer("unattempted_count").notNull().default(0),
    percentage: numeric("percentage", { precision: 5, scale: 2 }).default("0"),
    topicPerformance: jsonb("topic_performance").default(
      sql`'{}'::jsonb`,
    ),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("test_attempts_user_idx").on(t.userId),
    testIdx: index("test_attempts_test_idx").on(t.testId),
  }),
);

export const testResponses = pgTable(
  "test_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => testAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    optionId: uuid("option_id").references(() => questionOptions.id, {
      onDelete: "set null",
    }),
    markedForReview: boolean("marked_for_review").notNull().default(false),
    isCorrect: boolean("is_correct"),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
  },
  (t) => ({
    attemptIdx: index("test_responses_attempt_idx").on(t.attemptId),
    attemptQuestionIdx: uniqueIndex("test_responses_attempt_question_idx").on(
      t.attemptId,
      t.questionId,
    ),
  }),
);

/* ------------------------------------------------------------------ */
/* F. Jobs & applications                                             */
/* ------------------------------------------------------------------ */

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  logoText: varchar("logo_text", { length: 8 }).notNull(),
  logoColor: varchar("logo_color", { length: 40 }).default("#17212B"),
  website: text("website"),
  about: text("about"),
});

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 220 }).notNull(),
    description: text("description"),
    responsibilities: jsonb("responsibilities").default(sql`'[]'::jsonb`),
    eligibility: jsonb("eligibility").default(sql`'[]'::jsonb`),
    hiringProcess: jsonb("hiring_process").default(sql`'[]'::jsonb`),
    opportunityType: opportunityType("opportunity_type")
      .notNull()
      .default("JOB"),
    location: varchar("location", { length: 160 }).notNull(),
    workMode: workMode("work_mode").notNull().default("ONSITE"),
    branchEligibility: jsonb("branch_eligibility").default(
      sql`'[]'::jsonb`,
    ),
    graduationBatch: integer("graduation_batch"),
    requiredSkills: jsonb("required_skills").default(sql`'[]'::jsonb`),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    stipend: integer("stipend"),
    duration: varchar("duration", { length: 60 }),
    applicationDeadline: timestamp("application_deadline", {
      withTimezone: true,
    }),
    applicationUrl: text("application_url"),
    status: varchar("status", { length: 40 }).notNull().default("OPEN"),
    postedAt: timestamp("posted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    typeIdx: index("opportunities_type_idx").on(t.opportunityType),
    statusIdx: index("opportunities_status_idx").on(t.status),
    companyIdx: index("opportunities_company_idx").on(t.companyId),
    postedIdx: index("opportunities_posted_idx").on(t.postedAt),
  }),
);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    status: applicationStatus("status").notNull().default("APPLIED"),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 24 }),
    college: varchar("college", { length: 200 }),
    branch: varchar("branch", { length: 120 }),
    graduationYear: integer("graduation_year"),
    resumeUrl: text("resume_url"),
    portfolioUrl: text("portfolio_url"),
    notes: text("notes"),
    appliedAt: timestamp("applied_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("job_applications_user_idx").on(t.userId),
    opportunityIdx: index("job_applications_opportunity_idx").on(
      t.opportunityId,
    ),
    userOpportunityIdx: uniqueIndex(
      "job_applications_user_opportunity_idx",
    ).on(t.userId, t.opportunityId),
  }),
);

export const savedOpportunities = pgTable(
  "saved_opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userOppIdx: uniqueIndex("saved_opportunities_user_opportunity_idx").on(
      t.userId,
      t.opportunityId,
    ),
  }),
);

/* ------------------------------------------------------------------ */
/* G. Dashboard, notifications, activity                              */
/* ------------------------------------------------------------------ */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull().default("SYSTEM"),
    title: varchar("title", { length: 220 }).notNull(),
    body: text("body"),
    linkUrl: text("link_url"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId, t.isRead),
    createdAtIdx: index("notifications_created_idx").on(t.createdAt),
  }),
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vtuUpdates: boolean("vtu_updates").notNull().default(true),
    jobAlerts: boolean("job_alerts").notNull().default(true),
    internshipAlerts: boolean("internship_alerts").notNull().default(true),
    applicationUpdates: boolean("application_updates").notNull().default(true),
    deadlineReminders: boolean("deadline_reminders").notNull().default(true),
    dsaReminders: boolean("dsa_reminders").notNull().default(true),
    roadmapReminders: boolean("roadmap_reminders").notNull().default(true),
    mockTestReminders: boolean("mock_test_reminders").notNull().default(true),
    weeklyReports: boolean("weekly_reports").notNull().default(true),
    emailNotifications: boolean("email_notifications").notNull().default(false),
    inAppNotifications: boolean("in_app_notifications")
      .notNull()
      .default(true),
    timezone: varchar("timezone", { length: 80 }).notNull().default(
      "Asia/Kolkata",
    ),
    reminderTime: varchar("reminder_time", { length: 10 }).notNull().default(
      "19:00",
    ),
    quietHoursStart: varchar("quiet_hours_start", { length: 10 }).default(
      "22:00",
    ),
    quietHoursEnd: varchar("quiet_hours_end", { length: 10 }).default("07:00"),
    digestFrequency: varchar("digest_frequency", { length: 20 })
      .notNull()
      .default("WEEKLY"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: uniqueIndex("notification_preferences_user_idx").on(t.userId),
  }),
);

export const learningActivities = pgTable(
  "learning_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityType: varchar("activity_type", { length: 60 }).notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    detail: text("detail"),
    points: integer("points").notNull().default(0),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("learning_activities_user_idx").on(t.userId, t.occurredAt),
  }),
);

export const studentStreaks = pgTable(
  "student_streaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActiveDate: timestamp("last_active_date", { withTimezone: true }),
    dailyGoal: integer("daily_goal").notNull().default(3),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: uniqueIndex("student_streaks_user_idx").on(t.userId),
  }),
);

/* ------------------------------------------------------------------ */
/* H. Admin & bulk import                                             */
/* ------------------------------------------------------------------ */

export const importJobs = pgTable(
  "import_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: varchar("category", { length: 80 }).notNull(),
    fileName: varchar("file_name", { length: 260 }).notNull(),
    fileSize: varchar("file_size", { length: 40 }),
    status: importStatus("status").notNull().default("PENDING"),
    totalRows: integer("total_rows").notNull().default(0),
    validRows: integer("valid_rows").notNull().default(0),
    invalidRows: integer("invalid_rows").notNull().default(0),
    importedRows: integer("imported_rows").notNull().default(0),
    preview: jsonb("preview").default(sql`'[]'::jsonb`),
    errors: jsonb("errors").default(sql`'[]'::jsonb`),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    createdByIdx: index("import_jobs_created_by_idx").on(t.createdBy),
    statusIdx: index("import_jobs_status_idx").on(t.status),
  }),
);

/* ------------------------------------------------------------------ */
/* I. Automation engine                                               */
/* ------------------------------------------------------------------ */

export const automationRules = pgTable(
  "automation_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 80 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 60 }).notNull(),
    cronExpression: varchar("cron_expression", { length: 80 }),
    queueName: varchar("queue_name", { length: 80 }).notNull(),
    status: automationStatus("status").notNull().default("ACTIVE"),
    idempotencyKey: varchar("idempotency_key", { length: 120 }),
    lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }),
    nextExecutionAt: timestamp("next_execution_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    keyIdx: uniqueIndex("automation_rules_key_idx").on(t.key),
    statusIdx: index("automation_rules_status_idx").on(t.status),
  }),
);

export const automationExecutions = pgTable(
  "automation_executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ruleId: uuid("rule_id").references(() => automationRules.id, {
      onDelete: "cascade",
    }),
    status: executionStatus("status").notNull().default("QUEUED"),
    triggerSource: varchar("trigger_source", { length: 40 }).notNull().default(
      "SCHEDULE",
    ),
    attempts: integer("attempts").notNull().default(0),
    message: text("message"),
    result: jsonb("result").default(sql`'{}'::jsonb`),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    ruleIdx: index("automation_executions_rule_idx").on(t.ruleId),
    statusIdx: index("automation_executions_status_idx").on(t.status),
    createdAtIdx: index("automation_executions_created_idx").on(t.createdAt),
  }),
);

export const scheduledTasks = pgTable(
  "scheduled_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 180 }).notNull(),
    queueName: varchar("queue_name", { length: 80 }).notNull(),
    cronExpression: varchar("cron_expression", { length: 80 }).notNull(),
    payload: jsonb("payload").default(sql`'{}'::jsonb`),
    isActive: boolean("is_active").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  },
  (t) => ({
    nameIdx: uniqueIndex("scheduled_tasks_name_idx").on(t.name),
  }),
);

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 80 }).notNull(),
    channel: varchar("channel", { length: 20 }).notNull().default("IN_APP"),
    subject: varchar("subject", { length: 220 }),
    body: text("body").notNull(),
    variables: jsonb("variables").default(sql`'[]'::jsonb`),
  },
  (t) => ({
    keyIdx: uniqueIndex("notification_templates_key_idx").on(t.key),
  }),
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id").references(() => notifications.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    channel: varchar("channel", { length: 20 }).notNull().default("IN_APP"),
    status: deliveryStatus("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    notificationIdx: index("notification_deliveries_notification_idx").on(
      t.notificationId,
    ),
    statusIdx: index("notification_deliveries_status_idx").on(t.status),
    idempotencyIdx: uniqueIndex("notification_deliveries_idempotency_idx").on(
      t.notificationId,
      t.channel,
    ),
  }),
);

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    idempotencyKey: varchar("idempotency_key", { length: 160 }).notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    type: notificationType("type").notNull().default("SYSTEM"),
    title: varchar("title", { length: 220 }).notNull(),
    body: text("body"),
    linkUrl: text("link_url"),
    channel: varchar("channel", { length: 20 }).notNull().default("IN_APP"),
    status: deliveryStatus("status").notNull().default("PENDING"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    idempotencyIdx: uniqueIndex("notification_outbox_idempotency_idx").on(
      t.idempotencyKey,
    ),
    statusIdx: index("notification_outbox_status_idx").on(t.status),
  }),
);

export const automationSettings = pgTable("automation_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 80 }).notNull(),
  value: jsonb("value").default(sql`'{}'::jsonb`),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* Convenience relation map (kept as plain object for query ergonomics) */
export const schema = {
  users,
  refreshTokens,
  passwordResetTokens,
  emailVerificationTokens,
  auditLogs,
  branches,
  schemes,
  semesters,
  subjects,
  resources,
  vtuUpdates,
  downloads,
  dsaSheets,
  playlists,
  dsaPatterns,
  dsaProblems,
  dsaSolutions,
  dsaProgress,
  bookmarks,
  roadmaps,
  roadmapStages,
  roadmapTopics,
  roadmapProgress,
  mockTests,
  questions,
  questionOptions,
  testAttempts,
  testResponses,
  companies,
  opportunities,
  jobApplications,
  savedOpportunities,
  notifications,
  notificationPreferences,
  learningActivities,
  studentStreaks,
  importJobs,
  automationRules,
  automationExecutions,
  scheduledTasks,
  notificationTemplates,
  notificationDeliveries,
  notificationOutbox,
  automationSettings,
};

export type Schema = typeof schema;

/* Unique composite helper kept for tests/imports */
export const uniquePair = primaryKey;
