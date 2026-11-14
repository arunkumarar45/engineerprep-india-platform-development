/**
 * Admin API route — EngineerPrep India
 *
 * Covers: stats, students, automations, executions, content,
 *         imports, exports (real DB data), manual automation triggers,
 *         DSA CRUD (sheets / patterns / problems), and roadmap CRUD.
 *
 * All endpoints require admin authentication.
 * Sensitive operations are logged to the audit_logs table.
 */
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  auditLogs,
  automationExecutions,
  automationRules,
  branches,
  companies,
  dsaPatterns,
  dsaProblems,
  dsaSheets,
  importJobs,
  mockTests,
  opportunities,
  questions,
  questionOptions,
  resources,
  roadmapStages,
  roadmapTopics,
  roadmaps,
  subjects,
  users,
  vtuUpdates,
} from "@/db/schema";
import {
  getAdminStats,
  getAllUsers,
  getAutomationExecutions,
  getAutomationRules,
  getContentForAdmin,
} from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import {
  enqueueJob,
  runRule,
  sweepExpiredOpportunities,
} from "@/lib/automation";
import { apiError, apiSuccess, handleError, toCsv } from "@/lib/api";

/* ----------------------------- Audit ----------------------------- */

async function writeAuditLog(
  actorId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await db.insert(auditLogs).values({
      actorId,
      action,
      entity,
      entityId: entityId ?? null,
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}

/* ============================= GET ================================= */

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const admin = await requireAdmin();
    const { slug } = await context.params;
    const section = slug?.[0] ?? "overview";
    const url = new URL(request.url);

    /* ---- Stats ---- */
    if (section === "stats") {
      const stats = await getAdminStats();
      return apiSuccess(stats, "Admin statistics fetched");
    }

    /* ---- Automations ---- */
    if (section === "automations") {
      const [rules, executions] = await Promise.all([
        getAutomationRules(),
        getAutomationExecutions(30),
      ]);
      return apiSuccess({ rules, executions }, "Automation data fetched");
    }

    /* ---- Executions ---- */
    if (section === "executions") {
      const limit = parseInt(url.searchParams.get("limit") ?? "60", 10);
      const executions = await getAutomationExecutions(Math.min(limit, 200));
      return apiSuccess({ executions }, "Executions fetched");
    }

    /* ---- Content ---- */
    if (section === "content") {
      const content = await getContentForAdmin();
      return apiSuccess(content, "Content fetched");
    }

    /* ---- Students ---- */
    if (section === "students") {
      const students = await getAllUsers();
      return apiSuccess({ students }, "Students fetched");
    }

    /* ---- Pending community job submissions ---- */
    if (section === "pending-jobs") {
      const rows = await db
        .select({
          id: opportunities.id,
          title: opportunities.title,
          description: opportunities.description,
          opportunityType: opportunities.opportunityType,
          location: opportunities.location,
          workMode: opportunities.workMode,
          applicationUrl: opportunities.applicationUrl,
          status: opportunities.status,
          postedAt: opportunities.postedAt,
          companyName: companies.name,
          companyLogoText: companies.logoText,
          companyLogoColor: companies.logoColor,
        })
        .from(opportunities)
        .leftJoin(companies, eq(opportunities.companyId, companies.id))
        .where(eq(opportunities.status, "PENDING"))
        .orderBy(desc(opportunities.postedAt));
      void admin;
      return apiSuccess({ jobs: rows, count: rows.length }, "Pending jobs fetched");
    }

    /* ---- Imports ---- */
    if (section === "imports") {
      const imports = await db
        .select()
        .from(importJobs)
        .orderBy(desc(importJobs.createdAt))
        .limit(100);
      return apiSuccess({ imports }, "Import history fetched");
    }

    /* ---- Export (real database data) ---- */
    if (section === "export") {
      const kind = url.searchParams.get("kind") ?? "resources";

      if (kind === "resources") {
        const rows = await db
          .select({
            title: resources.title,
            type: resources.resourceType,
            status: resources.status,
            downloadCount: resources.downloadCount,
            fileSize: resources.fileSize,
            subjectName: subjects.name,
            subjectCode: subjects.code,
            createdAt: resources.createdAt,
          })
          .from(resources)
          .leftJoin(subjects, eq(resources.subjectId, subjects.id))
          .orderBy(desc(resources.createdAt));

        const headers = [
          "title",
          "type",
          "status",
          "downloadCount",
          "fileSize",
          "subjectName",
          "subjectCode",
          "createdAt",
        ];
        return new Response(toCsv(headers, rows as never[]), {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="resources-${Date.now()}.csv"`,
          },
        });
      }

      if (kind === "opportunities") {
        const rows = await db
          .select({
            title: opportunities.title,
            type: opportunities.opportunityType,
            status: opportunities.status,
            location: opportunities.location,
            workMode: opportunities.workMode,
            graduationBatch: opportunities.graduationBatch,
            applicationDeadline: opportunities.applicationDeadline,
            companyName: companies.name,
            postedAt: opportunities.postedAt,
          })
          .from(opportunities)
          .leftJoin(companies, eq(opportunities.companyId, companies.id))
          .orderBy(desc(opportunities.postedAt));

        const headers = [
          "title",
          "type",
          "status",
          "location",
          "workMode",
          "graduationBatch",
          "applicationDeadline",
          "companyName",
          "postedAt",
        ];
        return new Response(toCsv(headers, rows as never[]), {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="opportunities-${Date.now()}.csv"`,
          },
        });
      }

      if (kind === "students") {
        const rows = await db
          .select({
            fullName: users.fullName,
            email: users.email,
            collegeName: users.collegeName,
            graduationYear: users.graduationYear,
            isActive: users.isActive,
            emailVerified: users.emailVerified,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.role, "STUDENT"))
          .orderBy(desc(users.createdAt));

        const headers = [
          "fullName",
          "email",
          "collegeName",
          "graduationYear",
          "isActive",
          "emailVerified",
          "createdAt",
        ];
        return new Response(toCsv(headers, rows as never[]), {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="students-${Date.now()}.csv"`,
          },
        });
      }

      if (kind === "dsa-problems") {
        const rows = await db
          .select({
            title: dsaProblems.title,
            slug: dsaProblems.slug,
            difficulty: dsaProblems.difficulty,
            practiceUrl: dsaProblems.practiceUrl,
            sheetTitle: dsaSheets.title,
            orderIndex: dsaProblems.orderIndex,
          })
          .from(dsaProblems)
          .leftJoin(dsaSheets, eq(dsaProblems.sheetId, dsaSheets.id))
          .orderBy(dsaProblems.orderIndex);

        const headers = [
          "title",
          "slug",
          "difficulty",
          "practiceUrl",
          "sheetTitle",
          "orderIndex",
        ];
        return new Response(toCsv(headers, rows as never[]), {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="dsa-problems-${Date.now()}.csv"`,
          },
        });
      }

      return apiError(`Unknown export kind: ${kind}`, 400);
    }

    /* ---- Audit logs ---- */
    if (section === "audit-logs") {
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
      return apiSuccess({ logs }, "Audit logs fetched");
    }

    return apiError("Unknown admin section", 404);
  } catch (error) {
    return handleError(error, "Admin request failed");
  }
}

/* ========================= Validation Schemas ====================== */

const automationSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.string().min(2),
  cronExpression: z.string().optional(),
  queueName: z.string().min(2),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
});

const resourceCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  resourceType: z.enum(["NOTES", "QUESTION_PAPER", "SYLLABUS", "LAB_MANUAL", "ASSIGNMENT", "OTHER"]),
  subjectId: z.string().uuid().optional(),
  moduleNumber: z.coerce.number().int().optional(),
  fileName: z.string(),
  fileUrl: z.string().url("File URL must be a valid URL"),
  fileSize: z.string().default("—"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

const opportunityCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  opportunityType: z.enum(["JOB", "INTERNSHIP", "OFF_CAMPUS"]),
  companyId: z.string().uuid().optional(),
  location: z.string().min(2),
  workMode: z.enum(["ONSITE", "REMOTE", "HYBRID"]).default("ONSITE"),
  salaryMin: z.coerce.number().int().optional(),
  salaryMax: z.coerce.number().int().optional(),
  stipend: z.coerce.number().int().optional(),
  duration: z.string().optional(),
  applicationDeadline: z.string().datetime().optional(),
  applicationUrl: z.string().url().optional(),
  graduationBatch: z.coerce.number().int().optional(),
});

const mockTestCreateSchema = z.object({
  title: z.string().min(2),
  subject: z.string().min(2),
  description: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("MEDIUM"),
  durationMinutes: z.coerce.number().int().min(5).max(300).default(60),
  totalMarks: z.coerce.number().int().min(1).max(1000).default(100),
  isPublished: z.boolean().default(false),
});

const vtuUpdateCreateSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  summary: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileSize: z.string().optional(),
});

/* -- DSA schemas ------------------------------------------ */

const dsaSheetCreateSchema = z.object({
  title: z.string().min(2),
  author: z.string().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  coverTint: z.string().optional(),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD", "BEGINNER", "INTERMEDIATE", "ADVANCED"])
    .default("BEGINNER"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, digits and hyphens only")
    .optional(),
});

const dsaPatternCreateSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  summary: z.string().optional(),
  about: z.string().optional(),
  icon: z.string().optional(),
});

const dsaProblemCreateSchema = z.object({
  title: z.string().min(2),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  statement: z.string().optional(),
  editorial: z.string().optional(),
  practiceUrl: z.string().url().optional(),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD", "BEGINNER", "INTERMEDIATE", "ADVANCED"])
    .default("EASY"),
  orderIndex: z.coerce.number().int().default(0),
  sheetId: z.string().uuid().optional(),
  patternId: z.string().uuid().optional(),
  examples: z.array(z.any()).optional(),
  hints: z.array(z.string()).optional(),
});

/* -- Roadmap schemas --------------------------------------- */

const roadmapCreateSchema = z.object({
  title: z.string().min(2),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional(),
  category: z.string().min(2).default("Web Dev"),
  coverImageUrl: z.string().url().optional(),
  coverTint: z.string().optional(),
  icon: z.string().optional(),
  estimatedDuration: z.string().optional(),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD", "BEGINNER", "INTERMEDIATE", "ADVANCED"])
    .default("BEGINNER"),
});

const roadmapStageCreateSchema = z.object({
  roadmapId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  orderIndex: z.coerce.number().int().default(0),
  icon: z.string().optional(),
});

const roadmapTopicCreateSchema = z.object({
  stageId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  orderIndex: z.coerce.number().int().default(0),
  resourceUrl: z.string().url().optional(),
  estimatedMinutes: z.coerce.number().int().optional(),
  isOptional: z.boolean().default(false),
});

/* -- Mock test question schemas --------------------------- */

const questionCreateSchema = z.object({
  mockTestId: z.string().uuid(),
  text: z.string().min(2),
  explanation: z.string().optional(),
  marks: z.coerce.number().int().default(1),
  negativeMarks: z.coerce.number().default(0),
  orderIndex: z.coerce.number().int().default(0),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean().default(false),
        orderIndex: z.coerce.number().int().default(0),
      }),
    )
    .min(2)
    .max(6),
});

/* ============================= POST ================================ */

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const admin = await requireAdmin();
    const { slug } = await context.params;
    const section = slug?.[0];

    /* ---- Manual automation run ---- */
    if (section === "automations" && slug?.[1] === "run") {
      const id = slug[2];
      if (!id) return apiError("Rule id is required", 400);
      const result = await runRule(id);
      await writeAuditLog(admin.id, "RUN_AUTOMATION", "automation_rules", id);
      return apiSuccess(result, "Automation executed");
    }

    /* ---- Create automation rule ---- */
    if (section === "automations") {
      const body = automationSchema.parse(await request.json());
      const key = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const [created] = await db
        .insert(automationRules)
        .values({
          ...body,
          key,
          idempotencyKey: `${key}-${Date.now()}`,
        })
        .returning();
      await writeAuditLog(admin.id, "CREATE", "automation_rules", created.id);
      return apiSuccess({ rule: created }, "Automation rule created", 201);
    }

    /* ---- Sweep expired opportunities ---- */
    if (section === "sweep") {
      const result = await sweepExpiredOpportunities();
      await enqueueJob("cleanup-queue", result as Record<string, unknown>);
      await writeAuditLog(admin.id, "SWEEP_EXPIRED", "opportunities");
      return apiSuccess(result, "Expired opportunities cleaned up");
    }

    /* ---- Create VTU resource ---- */
    if (section === "resources") {
      const body = resourceCreateSchema.parse(await request.json());
      const [created] = await db
        .insert(resources)
        .values({ ...body, uploadedBy: admin.id })
        .returning();
      await writeAuditLog(admin.id, "CREATE", "resources", created.id);
      return apiSuccess({ resource: created }, "Resource created", 201);
    }

    /* ---- Create VTU update ---- */
    if (section === "vtu-updates") {
      const body = vtuUpdateCreateSchema.parse(await request.json());
      const [created] = await db
        .insert(vtuUpdates)
        .values({ ...body, createdBy: admin.id })
        .returning();
      await writeAuditLog(admin.id, "CREATE", "vtu_updates", created.id);
      return apiSuccess({ update: created }, "VTU update created", 201);
    }

    /* ---- Approve / Reject community job submission ---- */
    if (section === "opportunities" && slug?.[1] === "approve") {
      const id = slug[2];
      if (!id) return apiError("Opportunity id is required", 400);
      await db
        .update(opportunities)
        .set({ status: "OPEN" })
        .where(eq(opportunities.id, id));
      await writeAuditLog(admin.id, "APPROVE_JOB", "opportunities", id);
      return apiSuccess({ id, status: "OPEN" }, "Job approved and published");
    }

    if (section === "opportunities" && slug?.[1] === "reject") {
      const id = slug[2];
      if (!id) return apiError("Opportunity id is required", 400);
      await db
        .update(opportunities)
        .set({ status: "CLOSED" })
        .where(eq(opportunities.id, id));
      await writeAuditLog(admin.id, "REJECT_JOB", "opportunities", id);
      return apiSuccess({ id, status: "CLOSED" }, "Job rejected");
    }

    /* ---- Create opportunity ---- */
    if (section === "opportunities") {
      const body = opportunityCreateSchema.parse(await request.json());
      const [created] = await db
        .insert(opportunities)
        .values({
          ...body,
          applicationDeadline: body.applicationDeadline
            ? new Date(body.applicationDeadline)
            : null,
        })
        .returning();
      await writeAuditLog(admin.id, "CREATE", "opportunities", created.id);
      return apiSuccess({ opportunity: created }, "Opportunity created", 201);
    }

    /* ---- Create mock test ---- */
    if (section === "mock-tests") {
      const body = mockTestCreateSchema.parse(await request.json());
      const slug_val = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const [created] = await db
        .insert(mockTests)
        .values({ ...body, slug: slug_val })
        .returning();
      await writeAuditLog(admin.id, "CREATE", "mock_tests", created.id);
      return apiSuccess({ test: created }, "Mock test created", 201);
    }

    return apiError("Unknown admin action", 404);
  } catch (error) {
    return handleError(error, "Admin action failed");
  }
}

/* ============================= PUT ================================= */

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const admin = await requireAdmin();
    const { slug } = await context.params;

    /* ---- Toggle automation status ---- */
    if (slug?.[0] === "automations" && slug?.[2] === "status") {
      const id = slug[1];
      const { status } = z
        .object({ status: z.enum(["ACTIVE", "DISABLED"]) })
        .parse(await request.json());

      await db
        .update(automationRules)
        .set({ status, updatedAt: new Date() })
        .where(eq(automationRules.id, id));

      await db.insert(automationExecutions).values({
        ruleId: id,
        status: "SKIPPED",
        triggerSource: "MANUAL",
        attempts: 0,
        message: `Rule ${status === "ACTIVE" ? "enabled" : "disabled"} by administrator`,
      });

      await writeAuditLog(admin.id, `SET_STATUS_${status}`, "automation_rules", id);
      return apiSuccess({ id, status }, "Automation rule updated");
    }

    /* ---- Update student account ---- */
    if (slug?.[0] === "students" && slug?.[1]) {
      const studentId = slug[1];
      const { isActive, role } = z
        .object({
          isActive: z.boolean().optional(),
          role: z.enum(["STUDENT", "ADMIN"]).optional(),
        })
        .parse(await request.json());

      await db
        .update(users)
        .set({
          ...(isActive !== undefined ? { isActive } : {}),
          ...(role ? { role } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, studentId));

      await writeAuditLog(admin.id, "UPDATE_STUDENT", "users", studentId, {
        isActive,
        role,
      });

      return apiSuccess({ id: studentId }, "Student updated");
    }

    /* ---- Update resource ---- */
    if (slug?.[0] === "resources" && slug?.[1]) {
      const resourceId = slug[1];
      const body = resourceCreateSchema.partial().parse(await request.json());
      await db
        .update(resources)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(resources.id, resourceId));
      await writeAuditLog(admin.id, "UPDATE", "resources", resourceId);
      return apiSuccess({ id: resourceId }, "Resource updated");
    }

    /* ---- Update opportunity ---- */
    if (slug?.[0] === "opportunities" && slug?.[1]) {
      const oppId = slug[1];
      const body = opportunityCreateSchema.partial().parse(await request.json());
      await db
        .update(opportunities)
        .set({
          ...body,
          applicationDeadline:
            body.applicationDeadline != null
              ? new Date(body.applicationDeadline)
              : undefined,
        })
        .where(eq(opportunities.id, oppId));
      await writeAuditLog(admin.id, "UPDATE", "opportunities", oppId);
      return apiSuccess({ id: oppId }, "Opportunity updated");
    }

    return apiError("Unknown admin action", 404);
  } catch (error) {
    return handleError(error, "Admin action failed");
  }
}

/* ============================= DELETE ============================== */

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const admin = await requireAdmin();
    const { slug } = await context.params;
    void request;

    /* ---- Delete resource ---- */
    if (slug?.[0] === "resources" && slug?.[1]) {
      const resourceId = slug[1];
      await db.delete(resources).where(eq(resources.id, resourceId));
      await writeAuditLog(admin.id, "DELETE", "resources", resourceId);
      return apiSuccess({ id: resourceId }, "Resource deleted");
    }

    /* ---- Delete opportunity ---- */
    if (slug?.[0] === "opportunities" && slug?.[1]) {
      const oppId = slug[1];
      await db.delete(opportunities).where(eq(opportunities.id, oppId));
      await writeAuditLog(admin.id, "DELETE", "opportunities", oppId);
      return apiSuccess({ id: oppId }, "Opportunity deleted");
    }

    /* ---- Delete VTU update ---- */
    if (slug?.[0] === "vtu-updates" && slug?.[1]) {
      const updateId = slug[1];
      await db.delete(vtuUpdates).where(eq(vtuUpdates.id, updateId));
      await writeAuditLog(admin.id, "DELETE", "vtu_updates", updateId);
      return apiSuccess({ id: updateId }, "VTU update deleted");
    }

    /* ---- Delete mock test ---- */
    if (slug?.[0] === "mock-tests" && slug?.[1]) {
      const testId = slug[1];
      await db.delete(mockTests).where(eq(mockTests.id, testId));
      await writeAuditLog(admin.id, "DELETE", "mock_tests", testId);
      return apiSuccess({ id: testId }, "Mock test deleted");
    }

    return apiError("Unknown admin action", 404);
  } catch (error) {
    return handleError(error, "Admin action failed");
  }
}
