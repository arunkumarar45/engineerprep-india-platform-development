import { db } from "@/db";
import {
  vtuDiscoveredResources,
  vtuCollectionJobs,
  auditLogs,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";
import { collectorEngine } from "@/lib/vtu-collector";
import { VtuAcademicCategory } from "@/lib/vtu-collector/types";

async function logAudit(
  actorId: string,
  action: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await db.insert(auditLogs).values({
      actorId,
      action,
      entity: "VTU_COLLECTOR",
      metadata: metadata ?? {},
    });
  } catch (err) {
    console.error("[VTU Collector Audit] Error writing log:", err);
  }
}

/* ============================= GET ============================= */

export async function GET(
  request: Request,
  context: { params: Promise<{ collectorSlug?: string[] }> },
) {
  try {
    const admin = await requireAdmin();
    const { collectorSlug } = await context.params;
    const path = collectorSlug ?? [];
    const mainSection = path[0] ?? "stats";
    const url = new URL(request.url);

    // 1. /stats
    if (mainSection === "stats") {
      const stats = await collectorEngine.getStats();
      return apiSuccess(stats, "VTU Collector statistics retrieved successfully");
    }

    // 2. /jobs
    if (mainSection === "jobs") {
      const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
      const jobs = await db
        .select()
        .from(vtuCollectionJobs)
        .orderBy(desc(vtuCollectionJobs.createdAt))
        .limit(Math.min(limit, 100));

      return apiSuccess({ jobs }, "Collection jobs retrieved");
    }

    // 3. /discovered
    if (mainSection === "discovered") {
      const category = url.searchParams.get("category") as VtuAcademicCategory | null;
      const approvalStatus = url.searchParams.get("approvalStatus");
      const downloadStatus = url.searchParams.get("downloadStatus");
      const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

      const conditions: any[] = [];
      if (category) {
        conditions.push(eq(vtuDiscoveredResources.category, category));
      }
      if (approvalStatus) {
        conditions.push(eq(vtuDiscoveredResources.approvalStatus, approvalStatus));
      }
      if (downloadStatus) {
        conditions.push(eq(vtuDiscoveredResources.downloadStatus, downloadStatus));
      }

      const query = db
        .select()
        .from(vtuDiscoveredResources)
        .orderBy(desc(vtuDiscoveredResources.createdAt))
        .limit(Math.min(limit, 200));

      const items = conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;

      return apiSuccess({ items }, "Discovered academic resources retrieved");
    }

    return apiError("Unknown VTU collector GET endpoint", 404);
  } catch (err) {
    return handleError(err);
  }
}

/* ============================= POST ============================= */

export async function POST(
  request: Request,
  context: { params: Promise<{ collectorSlug?: string[] }> },
) {
  try {
    const admin = await requireAdmin();
    const { collectorSlug } = await context.params;
    const path = collectorSlug ?? [];
    const mainSection = path[0] ?? "";
    const secondSection = path[1] ?? "";
    const thirdSection = path[2] ?? "";

    // 1. /jobs -> Start a new job (DISCOVERY, DOWNLOAD, UPLOAD)
    if (mainSection === "jobs") {
      const body = await request.json().catch(() => ({}));
      const jobType = body.jobType || "DISCOVERY";
      const category = body.category as VtuAcademicCategory | undefined;
      const sourceWebsite = body.sourceWebsite;
      const filters = body.filters || {};

      const job = await collectorEngine.createJob(jobType, category, sourceWebsite, filters);

      // Execute background processing asynchronously
      (async () => {
        try {
          if (jobType === "DISCOVERY") {
            await collectorEngine.runDiscovery(job.id, filters);
          } else if (jobType === "DOWNLOAD") {
            await collectorEngine.runDownloadAndValidation(job.id, filters.limit || 50);
          } else if (jobType === "UPLOAD") {
            await collectorEngine.runUploadApproved(job.id, category);
          }
        } catch (jobErr) {
          console.error(`[VTU Collector Job ${job.id}] Failed:`, jobErr);
        }
      })();

      await logAudit(admin.id, `JOB_TRIGGER_${jobType}`, { jobId: job.id, category });
      return apiSuccess({ job }, `Collection job '${jobType}' started successfully`);
    }

    // 2. /discovered/:id/approve
    if (mainSection === "discovered" && secondSection && thirdSection === "approve") {
      const id = secondSection;
      await db
        .update(vtuDiscoveredResources)
        .set({
          approvalStatus: "APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(vtuDiscoveredResources.id, id));

      await logAudit(admin.id, "RESOURCE_APPROVED", { resourceId: id });
      return apiSuccess({ id, status: "APPROVED" }, "Resource approved for upload");
    }

    // 3. /discovered/:id/reject
    if (mainSection === "discovered" && secondSection && thirdSection === "reject") {
      const id = secondSection;
      const body = await request.json().catch(() => ({}));
      await db
        .update(vtuDiscoveredResources)
        .set({
          approvalStatus: "REJECTED",
          validationNotes: body.reason || "Rejected by admin review",
          updatedAt: new Date(),
        })
        .where(eq(vtuDiscoveredResources.id, id));

      await logAudit(admin.id, "RESOURCE_REJECTED", { resourceId: id, reason: body.reason });
      return apiSuccess({ id, status: "REJECTED" }, "Resource rejected");
    }

    // 4. /discovered/:id/correct
    if (mainSection === "discovered" && secondSection && thirdSection === "correct") {
      const id = secondSection;
      const body = await request.json();
      const updates: any = { updatedAt: new Date() };

      if (body.title) updates.title = body.title;
      if (body.subjectCode) updates.subjectCode = body.subjectCode.toUpperCase();
      if (body.category) updates.category = body.category;
      if (body.schemeName) updates.schemeName = body.schemeName;
      if (body.semesterNumber) updates.semesterNumber = parseInt(body.semesterNumber, 10);
      if (body.examYear) updates.examYear = parseInt(body.examYear, 10);
      if (body.examMonth) updates.examMonth = body.examMonth;

      await db
        .update(vtuDiscoveredResources)
        .set(updates)
        .where(eq(vtuDiscoveredResources.id, id));

      await logAudit(admin.id, "METADATA_CORRECTED", { resourceId: id, updates });
      return apiSuccess({ id, updates }, "Resource metadata updated successfully");
    }

    // 5. /discovered/upload-approved
    if (mainSection === "discovered" && secondSection === "upload-approved") {
      const body = await request.json().catch(() => ({}));
      const category = body.category as VtuAcademicCategory | undefined;

      const job = await collectorEngine.createJob("UPLOAD", category, "MANUAL_TRIGGER");

      (async () => {
        try {
          await collectorEngine.runUploadApproved(job.id, category);
        } catch (jobErr) {
          console.error(`[VTU Upload Job ${job.id}] Failed:`, jobErr);
        }
      })();

      await logAudit(admin.id, "UPLOAD_APPROVED_BATCH", { jobId: job.id, category });
      return apiSuccess({ job }, "Batch upload of approved resources initiated");
    }

    return apiError("Unknown VTU collector POST endpoint", 404);
  } catch (err) {
    return handleError(err);
  }
}

/* ============================= DELETE ============================= */

export async function DELETE(
  request: Request,
  context: { params: Promise<{ collectorSlug?: string[] }> },
) {
  try {
    const admin = await requireAdmin();
    const { collectorSlug } = await context.params;
    const path = collectorSlug ?? [];
    const mainSection = path[0] ?? "";
    const jobId = path[1] ?? "";

    if (mainSection === "jobs" && jobId) {
      await db
        .update(vtuCollectionJobs)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(vtuCollectionJobs.id, jobId));

      await logAudit(admin.id, "JOB_CANCELLED", { jobId });
      return apiSuccess({ jobId, status: "CANCELLED" }, "Job cancelled successfully");
    }

    return apiError("Unknown VTU collector DELETE endpoint", 404);
  } catch (err) {
    return handleError(err);
  }
}

