/**
 * Server-side data access layer for EngineerPrep India.
 * All pages read through these functions so business logic stays out of
 * route handlers / components.
 */
import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  automationExecutions,
  automationRules,
  bookmarks,
  branches,
  companies,
  downloads,
  dsaPatterns,
  dsaProblems,
  dsaProgress,
  dsaSheets,
  dsaSolutions,
  importJobs,
  jobApplications,
  learningActivities,
  mockTests,
  notificationPreferences,
  notifications,
  opportunities,
  questionOptions,
  questions,
  resources,
  roadmapProgress,
  roadmapStages,
  roadmapTopics,
  roadmaps,
  savedOpportunities,
  schemes,
  semesters,
  studentStreaks,
  subjects,
  testAttempts,
  users,
  vtuUpdates,
  type difficulty,
} from "@/db/schema";

/* ------------------------------ VTU --------------------------------- */

export async function getBranches() {
  return db.select().from(branches).orderBy(branches.code);
}

export async function getSemesters() {
  return db.select().from(semesters).orderBy(semesters.number);
}

export async function getSchemes() {
  return db.select().from(schemes).orderBy(schemes.name);
}

export async function getSubjects(filter?: {
  branchId?: string;
  semesterId?: string;
  schemeId?: string;
}) {
  const conds = [];
  if (filter?.branchId) conds.push(eq(subjects.branchId, filter.branchId));
  if (filter?.semesterId)
    conds.push(eq(subjects.semesterId, filter.semesterId));
  if (filter?.schemeId) conds.push(eq(subjects.schemeId, filter.schemeId));
  return db
    .select()
    .from(subjects)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(subjects.name);
}

export type ResourceFilters = {
  q?: string;
  branchId?: string;
  semesterId?: string;
  schemeId?: string;
  subjectId?: string;
  module?: string;
  type?: string;
};

export async function getResources(filters: ResourceFilters = {}) {
  const conds = [eq(resources.status, "PUBLISHED")];
  if (filters.type) conds.push(eq(resources.resourceType, filters.type as never));
  if (filters.subjectId) conds.push(eq(resources.subjectId, filters.subjectId));
  if (filters.module)
    conds.push(eq(resources.moduleNumber, Number(filters.module)));
  if (filters.q)
    conds.push(
      or(
        ilike(resources.title, `%${filters.q}%`),
        ilike(subjects.name, `%${filters.q}%`),
        ilike(subjects.code, `%${filters.q}%`),
      )!,
    );

  const baseQuery = db
    .select({
      id: resources.id,
      title: resources.title,
      description: resources.description,
      resourceType: resources.resourceType,
      moduleNumber: resources.moduleNumber,
      fileName: resources.fileName,
      fileUrl: resources.fileUrl,
      fileSize: resources.fileSize,
      downloadCount: resources.downloadCount,
      createdAt: resources.createdAt,
      subjectId: subjects.id,
      subjectName: subjects.name,
      subjectCode: subjects.code,
      semesterNumber: semesters.number,
      branchCode: branches.code,
      branchName: branches.name,
      schemeName: schemes.name,
    })
    .from(resources)
    .leftJoin(subjects, eq(resources.subjectId, subjects.id))
    .leftJoin(semesters, eq(subjects.semesterId, semesters.id))
    .leftJoin(branches, eq(subjects.branchId, branches.id))
    .leftJoin(schemes, eq(subjects.schemeId, schemes.id));

  let rows = await baseQuery
    .where(and(...conds))
    .orderBy(desc(resources.createdAt));

  if (filters.semesterId) {
    const [sem] = await db
      .select()
      .from(semesters)
      .where(eq(semesters.id, filters.semesterId))
      .limit(1);
    if (sem) rows = rows.filter((r) => r.semesterNumber === sem.number);
  }

  if (filters.branchId) {
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, filters.branchId))
      .limit(1);
    if (branch)
      rows = rows.filter(
        (r) => !r.branchCode || r.branchCode === branch.code,
      );
  }

  if (filters.schemeId) {
    const [scheme] = await db
      .select()
      .from(schemes)
      .where(eq(schemes.id, filters.schemeId))
      .limit(1);
    if (scheme) rows = rows.filter((r) => !r.schemeName || r.schemeName === scheme.name);
  }

  return rows;
}

export async function getResourceStats() {
  const rows = await db
    .select({ type: resources.resourceType, count: sql<number>`count(*)::int` })
    .from(resources)
    .where(eq(resources.status, "PUBLISHED"))
    .groupBy(resources.resourceType);
  const map: Record<string, number> = {
    NOTES: 0,
    QUESTION_PAPER: 0,
    SYLLABUS: 0,
    LAB_MANUAL: 0,
    ASSIGNMENT: 0,
    OTHER: 0,
  };
  rows.forEach((r) => {
    map[r.type] = r.count;
  });
  return map;
}

export async function getVtuUpdates() {
  return db.select().from(vtuUpdates).orderBy(desc(vtuUpdates.publishedAt));
}

export async function getDownloads(userId: string) {
  return db
    .select({
      id: downloads.id,
      downloadedAt: downloads.downloadedAt,
      resourceId: resources.id,
      title: resources.title,
      fileSize: resources.fileSize,
      fileUrl: resources.fileUrl,
      resourceType: resources.resourceType,
    })
    .from(downloads)
    .leftJoin(resources, eq(downloads.resourceId, resources.id))
    .where(eq(downloads.userId, userId))
    .orderBy(desc(downloads.downloadedAt));
}

/* ------------------------------------------------------------------ */
/* Download tracking                                                    */
/* ------------------------------------------------------------------ */

/**
 * Record a download event and increment the resource's download counter.
 * Idempotent for the same user+resource within a 24-hour window.
 */
export async function recordDownload(userId: string, resourceId: string) {
  // Upsert into downloads (userId + resourceId are not unique by schema,
  // so we insert each access; callers may debounce if needed).
  await db.insert(downloads).values({ userId, resourceId });

  // Increment the counter on the resource itself
  await db
    .update(resources)
    .set({ downloadCount: sql`${resources.downloadCount} + 1` })
    .where(eq(resources.id, resourceId));
}

/* ------------------------------- DSA -------------------------------- */

export async function getDsaSheets() {
  return db.select().from(dsaSheets).orderBy(dsaSheets.title);
}

export async function getDsaSheet(slug: string) {
  const [sheet] = await db
    .select()
    .from(dsaSheets)
    .where(eq(dsaSheets.slug, slug))
    .limit(1);
  return sheet ?? null;
}

export async function getDsaPatterns() {
  return db.select().from(dsaPatterns).orderBy(dsaPatterns.name);
}

export async function getDsaPattern(slug: string) {
  const [pattern] = await db
    .select()
    .from(dsaPatterns)
    .where(eq(dsaPatterns.slug, slug))
    .limit(1);
  if (!pattern) return null;
  const problems = await db
    .select()
    .from(dsaProblems)
    .where(eq(dsaProblems.patternId, pattern.id))
    .orderBy(dsaProblems.orderIndex);
  return { pattern, problems };
}

export async function getDsaProblems(filters: {
  difficulty?: string;
  sheetId?: string;
  patternId?: string;
} = {}) {
  const rows = await db
    .select({
      id: dsaProblems.id,
      title: dsaProblems.title,
      slug: dsaProblems.slug,
      difficulty: dsaProblems.difficulty,
      orderIndex: dsaProblems.orderIndex,
      patternId: dsaProblems.patternId,
      patternName: dsaPatterns.name,
      sheetId: dsaProblems.sheetId,
      sheetTitle: dsaSheets.title,
    })
    .from(dsaProblems)
    .leftJoin(dsaPatterns, eq(dsaProblems.patternId, dsaPatterns.id))
    .leftJoin(dsaSheets, eq(dsaProblems.sheetId, dsaSheets.id))
    .orderBy(dsaProblems.orderIndex);

  return rows.filter((row) => {
    if (filters.difficulty && filters.difficulty !== "ALL") {
      if (!difficultyMatches(row.difficulty, filters.difficulty)) return false;
    }
    if (filters.sheetId && row.sheetId !== filters.sheetId) return false;
    if (filters.patternId && row.patternId !== filters.patternId) return false;
    return true;
  });
}

function difficultyMatches(value: string, filter: string) {
  const v = value.toUpperCase();
  const f = filter.toUpperCase();
  if (f === "BEGINNER") return v === "EASY" || v === "BEGINNER";
  if (f === "INTERMEDIATE") return v === "MEDIUM" || v === "INTERMEDIATE";
  if (f === "ADVANCED") return v === "HARD" || v === "ADVANCED";
  return v === f;
}

export async function getDsaProgress(userId: string) {
  const rows = await db
    .select({ problemId: dsaProgress.problemId, solvedAt: dsaProgress.solvedAt })
    .from(dsaProgress)
    .where(eq(dsaProgress.userId, userId));
  return new Map(rows.map((r) => [r.problemId, r.solvedAt]));
}

export async function getProblemBySlug(slug: string) {
  const [problem] = await db
    .select()
    .from(dsaProblems)
    .where(eq(dsaProblems.slug, slug))
    .limit(1);
  if (!problem) return null;
  const solutions = await db
    .select()
    .from(dsaSolutions)
    .where(eq(dsaSolutions.problemId, problem.id));
  const [pattern] = problem.patternId
    ? await db
        .select()
        .from(dsaPatterns)
        .where(eq(dsaPatterns.id, problem.patternId))
        .limit(1)
    : [null];
  return { problem, solutions, pattern };
}

/* ----------------------------- Roadmaps ----------------------------- */

export async function getRoadmaps(category?: string) {
  const rows = await db.select().from(roadmaps).orderBy(roadmaps.title);
  if (!category || category === "All") return rows;
  return rows.filter(
    (r) => r.category.toLowerCase() === category.toLowerCase(),
  );
}

export async function getRoadmap(slug: string) {
  const [roadmap] = await db
    .select()
    .from(roadmaps)
    .where(eq(roadmaps.slug, slug))
    .limit(1);
  if (!roadmap) return null;
  const stages = await db
    .select()
    .from(roadmapStages)
    .where(eq(roadmapStages.roadmapId, roadmap.id))
    .orderBy(roadmapStages.orderIndex);
  const stageIds = stages.map((s) => s.id);
  const topics = stageIds.length
    ? await db
        .select()
        .from(roadmapTopics)
        .where(inArray(roadmapTopics.stageId, stageIds))
        .orderBy(roadmapTopics.orderIndex)
    : [];
  return { roadmap, stages, topics };
}

export async function getRoadmapProgress(userId: string) {
  const rows = await db
    .select({ roadmapId: roadmapProgress.roadmapId, topicId: roadmapProgress.topicId })
    .from(roadmapProgress)
    .where(eq(roadmapProgress.userId, userId));
  const byRoadmap = new Map<string, Set<string>>();
  rows.forEach((r) => {
    if (!r.topicId) return;
    const set = byRoadmap.get(r.roadmapId) ?? new Set<string>();
    set.add(r.topicId);
    byRoadmap.set(r.roadmapId, set);
  });
  return byRoadmap;
}

/* ---------------------------- Mock tests ---------------------------- */

export async function getMockTests() {
  return db
    .select()
    .from(mockTests)
    .where(eq(mockTests.isPublished, true))
    .orderBy(mockTests.title);
}

export async function getMockTest(id: string) {
  const [test] = await db
    .select()
    .from(mockTests)
    .where(eq(mockTests.id, id))
    .limit(1);
  if (!test) return null;
  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.testId, test.id))
    .orderBy(questions.orderIndex);
  const qIds = qs.map((q) => q.id);
  const opts = qIds.length
    ? await db
        .select()
        .from(questionOptions)
        .where(inArray(questionOptions.questionId, qIds))
    : [];
  return { test, questions: qs, options: opts };
}

export async function getAttempts(userId: string) {
  return db
    .select({
      id: testAttempts.id,
      status: testAttempts.status,
      score: testAttempts.score,
      correctCount: testAttempts.correctCount,
      incorrectCount: testAttempts.incorrectCount,
      unattemptedCount: testAttempts.unattemptedCount,
      percentage: testAttempts.percentage,
      topicPerformance: testAttempts.topicPerformance,
      submittedAt: testAttempts.submittedAt,
      startedAt: testAttempts.startedAt,
      testId: testAttempts.testId,
      testTitle: mockTests.title,
      subject: mockTests.subject,
      totalMarks: mockTests.totalMarks,
      durationMinutes: mockTests.durationMinutes,
    })
    .from(testAttempts)
    .leftJoin(mockTests, eq(testAttempts.testId, mockTests.id))
    .where(eq(testAttempts.userId, userId))
    .orderBy(desc(testAttempts.startedAt));
}

/* ------------------------------- Jobs ------------------------------- */

export async function getCompanies() {
  return db.select().from(companies).orderBy(companies.name);
}

export type OpportunityFilters = {
  q?: string;
  type?: string;
  branch?: string;
  batch?: string;
  location?: string;
  mode?: string;
  sort?: string;
  includeAll?: boolean; // admin use: include PENDING jobs
};

export async function getOpportunities(filters: OpportunityFilters = {}) {
  const rows = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      description: opportunities.description,
      opportunityType: opportunities.opportunityType,
      location: opportunities.location,
      workMode: opportunities.workMode,
      branchEligibility: opportunities.branchEligibility,
      graduationBatch: opportunities.graduationBatch,
      requiredSkills: opportunities.requiredSkills,
      salaryMin: opportunities.salaryMin,
      salaryMax: opportunities.salaryMax,
      stipend: opportunities.stipend,
      duration: opportunities.duration,
      applicationDeadline: opportunities.applicationDeadline,
      applicationUrl: opportunities.applicationUrl,
      status: opportunities.status,
      postedAt: opportunities.postedAt,
      companyId: companies.id,
      companyName: companies.name,
      companyLogoText: companies.logoText,
      companyLogoColor: companies.logoColor,
    })
    .from(opportunities)
    .leftJoin(companies, eq(opportunities.companyId, companies.id))
    .orderBy(desc(opportunities.postedAt));

  return rows.filter((row) => {
    // Only show OPEN jobs publicly; PENDING goes to admin review only
    if (!filters.includeAll && row.status !== "OPEN") return false;
    if (filters.type && filters.type !== "ALL" && row.opportunityType !== filters.type)
      return false;
    if (filters.branch) {
      const list = Array.isArray(row.branchEligibility)
        ? (row.branchEligibility as string[])
        : [];
      if (list.length && !list.some((b) => b.toLowerCase().includes(filters.branch!.toLowerCase())))
        return false;
    }
    if (filters.batch && String(row.graduationBatch ?? "") !== filters.batch)
      return false;
    if (
      filters.location &&
      !(row.location ?? "").toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;
    if (filters.mode && filters.mode !== "ALL" && row.workMode !== filters.mode)
      return false;
    if (filters.q) {
      const needle = filters.q.toLowerCase();
      const skills = Array.isArray(row.requiredSkills)
        ? (row.requiredSkills as string[]).join(" ")
        : "";
      const hay = `${row.title} ${row.companyName ?? ""} ${skills} ${row.location ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

export async function getOpportunity(id: string) {
  const [row] = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      description: opportunities.description,
      responsibilities: opportunities.responsibilities,
      eligibility: opportunities.eligibility,
      hiringProcess: opportunities.hiringProcess,
      opportunityType: opportunities.opportunityType,
      location: opportunities.location,
      workMode: opportunities.workMode,
      branchEligibility: opportunities.branchEligibility,
      graduationBatch: opportunities.graduationBatch,
      requiredSkills: opportunities.requiredSkills,
      salaryMin: opportunities.salaryMin,
      salaryMax: opportunities.salaryMax,
      stipend: opportunities.stipend,
      duration: opportunities.duration,
      applicationDeadline: opportunities.applicationDeadline,
      applicationUrl: opportunities.applicationUrl,
      status: opportunities.status,
      postedAt: opportunities.postedAt,
      companyId: companies.id,
      companyName: companies.name,
      companyLogoText: companies.logoText,
      companyLogoColor: companies.logoColor,
      companyAbout: companies.about,
      companyWebsite: companies.website,
    })
    .from(opportunities)
    .leftJoin(companies, eq(opportunities.companyId, companies.id))
    .where(eq(opportunities.id, id))
    .limit(1);
  return row ?? null;
}

export async function getSavedOpportunityIds(userId: string) {
  const rows = await db
    .select({ id: savedOpportunities.opportunityId })
    .from(savedOpportunities)
    .where(eq(savedOpportunities.userId, userId));
  return new Set(rows.map((r) => r.id));
}

export async function getApplications(userId: string) {
  return db
    .select({
      id: jobApplications.id,
      status: jobApplications.status,
      appliedAt: jobApplications.appliedAt,
      fullName: jobApplications.fullName,
      resumeUrl: jobApplications.resumeUrl,
      opportunityId: opportunities.id,
      title: opportunities.title,
      opportunityType: opportunities.opportunityType,
      location: opportunities.location,
      companyName: companies.name,
      companyLogoText: companies.logoText,
      companyLogoColor: companies.logoColor,
      applicationDeadline: opportunities.applicationDeadline,
    })
    .from(jobApplications)
    .leftJoin(opportunities, eq(jobApplications.opportunityId, opportunities.id))
    .leftJoin(companies, eq(opportunities.companyId, companies.id))
    .where(eq(jobApplications.userId, userId))
    .orderBy(desc(jobApplications.appliedAt));
}

/* --------------------------- Dashboard data ------------------------- */

export async function getNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(30);
}

export async function getLearningActivity(userId: string) {
  return db
    .select()
    .from(learningActivities)
    .where(eq(learningActivities.userId, userId))
    .orderBy(desc(learningActivities.occurredAt))
    .limit(20);
}

export async function getStreak(userId: string) {
  const [row] = await db
    .select()
    .from(studentStreaks)
    .where(eq(studentStreaks.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getBookmarks(userId: string) {
  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}

export async function getPreference(userId: string) {
  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getDashboardSummary(userId: string) {
  const [progressRows, attemptRows, applicationRows, savedRows] =
    await Promise.all([
      db
        .select({ problemId: dsaProgress.problemId })
        .from(dsaProgress)
        .where(eq(dsaProgress.userId, userId)),
      db
        .select()
        .from(testAttempts)
        .where(eq(testAttempts.userId, userId))
        .orderBy(desc(testAttempts.startedAt)),
      db
        .select({ id: jobApplications.id, status: jobApplications.status })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId)),
      db
        .select({ id: savedOpportunities.id })
        .from(savedOpportunities)
        .where(eq(savedOpportunities.userId, userId)),
    ]);

  const submitted = attemptRows.filter((a) => a.status !== "IN_PROGRESS");
  const avgScore = submitted.length
    ? Math.round(
        submitted.reduce((sum, a) => sum + Number(a.percentage ?? 0), 0) /
          submitted.length,
      )
    : 0;

  const totalProblems = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dsaProblems);

  return {
    dsaSolved: progressRows.length,
    dsaTotal: totalProblems[0]?.count ?? 0,
    testsCompleted: submitted.length,
    avgScore,
    applications: applicationRows.length,
    applicationsInProgress: applicationRows.filter(
      (a) =>
        a.status === "APPLIED" ||
        a.status === "UNDER_REVIEW" ||
        a.status === "SHORTLISTED" ||
        a.status === "INTERVIEW",
    ).length,
    savedJobs: savedRows.length,
    attempts: attemptRows,
  };
}

/* ------------------------------- Admin ------------------------------ */

export async function getAdminStats() {
  const [
    studentRows,
    resourceRows,
    problemRows,
    roadmapRows,
    testRows,
    opportunityRows,
    updateRows,
    importRows,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "STUDENT")),
    db.select({ count: sql<number>`count(*)::int` }).from(resources),
    db.select({ count: sql<number>`count(*)::int` }).from(dsaProblems),
    db.select({ count: sql<number>`count(*)::int` }).from(roadmaps),
    db.select({ count: sql<number>`count(*)::int` }).from(mockTests),
    db.select({ count: sql<number>`count(*)::int` }).from(opportunities),
    db.select({ count: sql<number>`count(*)::int` }).from(vtuUpdates),
    db.select().from(importJobs).orderBy(desc(importJobs.createdAt)).limit(10),
  ]);

  return {
    students: studentRows[0]?.count ?? 0,
    resources: resourceRows[0]?.count ?? 0,
    problems: problemRows[0]?.count ?? 0,
    roadmaps: roadmapRows[0]?.count ?? 0,
    tests: testRows[0]?.count ?? 0,
    opportunities: opportunityRows[0]?.count ?? 0,
    vtuUpdates: updateRows[0]?.count ?? 0,
    imports: importRows,
  };
}

export async function getAutomationRules() {
  return db.select().from(automationRules).orderBy(automationRules.category);
}

export async function getAutomationExecutions(limit = 25) {
  return db
    .select({
      id: automationExecutions.id,
      status: automationExecutions.status,
      triggerSource: automationExecutions.triggerSource,
      attempts: automationExecutions.attempts,
      message: automationExecutions.message,
      result: automationExecutions.result,
      createdAt: automationExecutions.createdAt,
      ruleName: automationRules.name,
      queueName: automationRules.queueName,
    })
    .from(automationExecutions)
    .leftJoin(automationRules, eq(automationExecutions.ruleId, automationRules.id))
    .orderBy(desc(automationExecutions.createdAt))
    .limit(limit);
}

export async function getAllUsers() {
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      collegeName: users.collegeName,
      graduationYear: users.graduationYear,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function getContentForAdmin() {
  const [resourceRows, sheetRows, roadmapRows, testRows, oppRows, updateRows] =
    await Promise.all([
      db
        .select({
          id: resources.id,
          title: resources.title,
          status: resources.status,
          resourceType: resources.resourceType,
          downloadCount: resources.downloadCount,
        })
        .from(resources)
        .orderBy(desc(resources.createdAt))
        .limit(12),
      db
        .select({ id: dsaSheets.id, title: dsaSheets.title, totalProblems: dsaSheets.totalProblems })
        .from(dsaSheets)
        .orderBy(dsaSheets.title)
        .limit(12),
      db
        .select({ id: roadmaps.id, title: roadmaps.title, stepCount: roadmaps.stepCount })
        .from(roadmaps)
        .orderBy(roadmaps.title)
        .limit(12),
      db
        .select({ id: mockTests.id, title: mockTests.title, subject: mockTests.subject })
        .from(mockTests)
        .orderBy(mockTests.title)
        .limit(12),
      db
        .select({ id: opportunities.id, title: opportunities.title, status: opportunities.status })
        .from(opportunities)
        .orderBy(desc(opportunities.postedAt))
        .limit(12),
      db
        .select({ id: vtuUpdates.id, title: vtuUpdates.title, category: vtuUpdates.category })
        .from(vtuUpdates)
        .orderBy(desc(vtuUpdates.publishedAt))
        .limit(12),
    ]);
  return {
    resources: resourceRows,
    sheets: sheetRows,
    roadmaps: roadmapRows,
    tests: testRows,
    opportunities: oppRows,
    updates: updateRows,
  };
}

/* ------------------------------ Search ------------------------------ */

export async function searchAll(rawQuery: string) {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return [];
  const limit = 8;

  const [resourceRows, problemRows, opportunityRows, roadmapRows, testRows, subjectRows] =
    await Promise.all([
      db
        .select({ id: resources.id, title: resources.title, subjectName: subjects.name })
        .from(resources)
        .leftJoin(subjects, eq(resources.subjectId, subjects.id))
        .where(ilike(resources.title, `%${q}%`))
        .limit(limit),
      db
        .select({ id: dsaProblems.id, title: dsaProblems.title, patternName: dsaPatterns.name })
        .from(dsaProblems)
        .leftJoin(dsaPatterns, eq(dsaProblems.patternId, dsaPatterns.id))
        .where(ilike(dsaProblems.title, `%${q}%`))
        .limit(limit),
      db
        .select({ id: opportunities.id, title: opportunities.title, companyName: companies.name })
        .from(opportunities)
        .leftJoin(companies, eq(opportunities.companyId, companies.id))
        .where(ilike(opportunities.title, `%${q}%`))
        .limit(limit),
      db
        .select({ id: roadmaps.id, title: roadmaps.title, category: roadmaps.category })
        .from(roadmaps)
        .where(ilike(roadmaps.title, `%${q}%`))
        .limit(limit),
      db
        .select({ id: mockTests.id, title: mockTests.title, subject: mockTests.subject })
        .from(mockTests)
        .where(ilike(mockTests.title, `%${q}%`))
        .limit(limit),
      db
        .select({ id: subjects.id, name: subjects.name, code: subjects.code })
        .from(subjects)
        .where(or(ilike(subjects.name, `%${q}%`), ilike(subjects.code, `%${q}%`)))
        .limit(limit),
    ]);

  const hits: Array<{
    id: string;
    kind: string;
    title: string;
    subtitle: string;
    href: string;
  }> = [];

  resourceRows.forEach((r) =>
    hits.push({
      id: r.id,
      kind: "Resource",
      title: r.title,
      subtitle: r.subjectName ?? "VTU resource",
      href: "/vtu/resources",
    }),
  );
  problemRows.forEach((p) =>
    hits.push({
      id: p.id,
      kind: "DSA Problem",
      title: p.title,
      subtitle: p.patternName ?? "DSA",
      href: `/placements/dsa-patterns/${slugifySafe(p.patternName ?? "patterns")}`,
    }),
  );
  opportunityRows.forEach((o) =>
    hits.push({
      id: o.id,
      kind: "Opportunity",
      title: o.title,
      subtitle: o.companyName ?? "Company",
      href: `/jobs/${o.id}`,
    }),
  );
  roadmapRows.forEach((r) =>
    hits.push({
      id: r.id,
      kind: "Roadmap",
      title: r.title,
      subtitle: r.category,
      href: `/placements/roadmaps/${slugifySafe(r.title)}`,
    }),
  );
  testRows.forEach((t) =>
    hits.push({
      id: t.id,
      kind: "Mock Test",
      title: t.title,
      subtitle: t.subject,
      href: `/placements/mock-tests/${t.id}`,
    }),
  );
  subjectRows.forEach((s) =>
    hits.push({
      id: s.id,
      kind: "Subject",
      title: s.name,
      subtitle: s.code,
      href: `/vtu/resources?subject=${s.id}`,
    }),
  );

  return hits.slice(0, 10);
}

function slugifySafe(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type Difficulty = (typeof difficulty)["enumValues"][number];
export { gte, lte };
