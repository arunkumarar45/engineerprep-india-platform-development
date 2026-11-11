import { db } from "../../db";
import {
  vtuDiscoveredResources,
  vtuCollectionJobs,
  resources,
  subjects,
  branches,
  schemes,
  semesters,
} from "../../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { VtuAcademicCategory, DiscoveredResourceInput, CollectionJobFilters } from "./types";
import { VtuOfficialAdapter } from "./adapters/vtu-official";
import { VtuCircleAdapter } from "./adapters/vtu-circle";
import { downloadAndValidateFile } from "./downloader";

export class VtuCollectorEngine {
  private officialAdapter = new VtuOfficialAdapter();
  private circleAdapter = new VtuCircleAdapter();

  async createJob(
    jobType: "DISCOVERY" | "DOWNLOAD" | "VALIDATION" | "UPLOAD",
    category?: VtuAcademicCategory,
    sourceWebsite?: string,
    filters?: CollectionJobFilters,
  ) {
    const [job] = await db
      .insert(vtuCollectionJobs)
      .values({
        jobType,
        category: category || null,
        sourceWebsite: sourceWebsite || "ALL",
        status: "RUNNING",
        startedAt: new Date(),
        filters: filters || {},
      })
      .returning();

    return job;
  }

  async updateJob(
    jobId: string,
    updates: {
      status?: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
      progress?: number;
      totalItems?: number;
      processedItems?: number;
      successCount?: number;
      failedCount?: number;
      errorMessage?: string;
      result?: any;
    },
  ) {
    const values: any = {
      ...updates,
      updatedAt: new Date(),
    };
    if (updates.status === "COMPLETED" || updates.status === "FAILED") {
      values.finishedAt = new Date();
    }

    await db.update(vtuCollectionJobs).set(values).where(eq(vtuCollectionJobs.id, jobId));
  }

  async runDiscovery(
    jobId: string,
    filters: CollectionJobFilters = {},
  ): Promise<{ discovered: number; duplicates: number }> {
    let discovered = 0;
    let duplicates = 0;

    try {
      const itemsToProcess: DiscoveredResourceInput[] = [];

      // Category 1: QUESTION_PAPER
      if (!filters.category || filters.category === "QUESTION_PAPER") {
        const officialMqp = await this.officialAdapter.discoverModelQuestionPapers();
        itemsToProcess.push(...officialMqp);
        const circleQp = await this.circleAdapter.discoverResources("QUESTION_PAPER");
        itemsToProcess.push(...circleQp);
      }

      // Category 2: SYLLABUS
      if (!filters.category || filters.category === "SYLLABUS") {
        const officialSyllabus = await this.officialAdapter.discoverSyllabus();
        itemsToProcess.push(...officialSyllabus);
      }

      // Category 3: LAB_MANUAL
      if (!filters.category || filters.category === "LAB_MANUAL") {
        const circleLabs = await this.circleAdapter.discoverResources("LAB_MANUAL");
        itemsToProcess.push(...circleLabs);
      }

      // Category 4: ASSIGNMENT
      if (!filters.category || filters.category === "ASSIGNMENT") {
        const circleAssignments = await this.circleAdapter.discoverResources("ASSIGNMENT");
        itemsToProcess.push(...circleAssignments);
      }

      await this.updateJob(jobId, {
        totalItems: itemsToProcess.length,
        processedItems: 0,
        progress: 10,
      });

      // Insert discovered items checking for duplicates
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];

        // Check duplicate by original file URL
        const [existingUrl] = await db
          .select({ id: vtuDiscoveredResources.id })
          .from(vtuDiscoveredResources)
          .where(eq(vtuDiscoveredResources.originalFileUrl, item.originalFileUrl))
          .limit(1);

        if (existingUrl) {
          duplicates++;
          continue;
        }

        // Try resolving branch and scheme IDs if available
        let branchId: string | null = null;
        let schemeId: string | null = null;
        let semesterId: string | null = null;

        if (item.branchCode) {
          const [branchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(eq(branches.code, item.branchCode.toUpperCase()))
            .limit(1);
          if (branchRow) branchId = branchRow.id;
        }

        if (item.schemeName) {
          const [schemeRow] = await db
            .select({ id: schemes.id })
            .from(schemes)
            .where(sql`lower(${schemes.name}) LIKE ${`%${item.schemeName.toLowerCase()}%`}`)
            .limit(1);
          if (schemeRow) schemeId = schemeRow.id;
        }

        if (item.semesterNumber) {
          const [semRow] = await db
            .select({ id: semesters.id })
            .from(semesters)
            .where(eq(semesters.number, item.semesterNumber))
            .limit(1);
          if (semRow) semesterId = semRow.id;
        }

        await db.insert(vtuDiscoveredResources).values({
          title: item.title,
          category: item.category,
          subjectCode: item.subjectCode || null,
          subjectName: item.subjectName || null,
          branchCode: item.branchCode || null,
          branchId,
          schemeName: item.schemeName || "2022 Scheme",
          schemeId,
          semesterNumber: item.semesterNumber || null,
          semesterId,
          examYear: item.examYear || 2024,
          examMonth: item.examMonth || null,
          examType: item.examType || null,
          moduleNumber: item.moduleNumber || null,
          sourceWebsite: item.sourceWebsite,
          sourcePageUrl: item.sourcePageUrl,
          originalFileUrl: item.originalFileUrl,
          downloadStatus: "DISCOVERED",
          validationStatus: "PENDING",
          approvalStatus: "PENDING_REVIEW",
        });

        discovered++;

        if (i % 5 === 0 || i === itemsToProcess.length - 1) {
          const progress = Math.min(95, Math.round(10 + (i / itemsToProcess.length) * 85));
          await this.updateJob(jobId, {
            processedItems: i + 1,
            successCount: discovered,
            progress,
          });
        }
      }

      await this.updateJob(jobId, {
        status: "COMPLETED",
        progress: 100,
        processedItems: itemsToProcess.length,
        successCount: discovered,
        result: { discovered, duplicates },
      });

      return { discovered, duplicates };
    } catch (err: any) {
      await this.updateJob(jobId, {
        status: "FAILED",
        errorMessage: err?.message || String(err),
      });
      throw err;
    }
  }

  async runDownloadAndValidation(jobId: string, limit = 50): Promise<{ downloaded: number; failed: number }> {
    let downloaded = 0;
    let failed = 0;

    try {
      // Find discovered resources that are ready to download
      const pendingItems = await db
        .select()
        .from(vtuDiscoveredResources)
        .where(eq(vtuDiscoveredResources.downloadStatus, "DISCOVERED"))
        .limit(limit);

      await this.updateJob(jobId, {
        totalItems: pendingItems.length,
        processedItems: 0,
        progress: 5,
      });

      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];

        await db
          .update(vtuDiscoveredResources)
          .set({ downloadStatus: "DOWNLOADING" })
          .where(eq(vtuDiscoveredResources.id, item.id));

        const downloadRes = await downloadAndValidateFile(item.originalFileUrl, {
          category: item.category as VtuAcademicCategory,
          suggestedFileName: `${item.subjectCode || item.category}-${item.title}`,
        });

        if (downloadRes.success && downloadRes.publicUrl) {
          // Check for duplicate by SHA-256 hash
          const [duplicateHash] = await db
            .select({ id: vtuDiscoveredResources.id })
            .from(vtuDiscoveredResources)
            .where(
              and(
                eq(vtuDiscoveredResources.fileHash, downloadRes.fileHash!),
                sql`${vtuDiscoveredResources.id} != ${item.id}`,
              ),
            )
            .limit(1);

          const validationNotes = duplicateHash
            ? `Warning: File identical (SHA-256) to discovered item ${duplicateHash.id}`
            : downloadRes.validation?.notes || "Verified authentic VTU document";

          await db
            .update(vtuDiscoveredResources)
            .set({
              downloadStatus: "DOWNLOADED",
              storedFilePath: downloadRes.publicUrl,
              fileSize: downloadRes.fileSizeHuman,
              fileHash: downloadRes.fileHash,
              mimeType: downloadRes.mimeType,
              validationStatus: downloadRes.validation?.isValid ? "VALID" : "FLAGGED",
              validationNotes,
              approvalStatus: downloadRes.validation?.isValid && !duplicateHash ? "APPROVED" : "PENDING_REVIEW",
              updatedAt: new Date(),
            })
            .where(eq(vtuDiscoveredResources.id, item.id));

          downloaded++;
        } else {
          await db
            .update(vtuDiscoveredResources)
            .set({
              downloadStatus: "FAILED",
              validationStatus: "INVALID",
              errorLog: downloadRes.error || "Download/Validation failed",
              updatedAt: new Date(),
            })
            .where(eq(vtuDiscoveredResources.id, item.id));

          failed++;
        }

        const progress = Math.min(98, Math.round(((i + 1) / pendingItems.length) * 100));
        await this.updateJob(jobId, {
          processedItems: i + 1,
          successCount: downloaded,
          failedCount: failed,
          progress,
        });
      }

      await this.updateJob(jobId, {
        status: "COMPLETED",
        progress: 100,
        processedItems: pendingItems.length,
        successCount: downloaded,
        failedCount: failed,
        result: { downloaded, failed },
      });

      return { downloaded, failed };
    } catch (err: any) {
      await this.updateJob(jobId, {
        status: "FAILED",
        errorMessage: err?.message || String(err),
      });
      throw err;
    }
  }

  async runUploadApproved(jobId: string, category?: VtuAcademicCategory): Promise<{ uploaded: number; skipped: number }> {
    let uploaded = 0;
    let skipped = 0;

    try {
      // Select items that are APPROVED, not yet uploaded, and have a stored file path
      const condition = and(
        eq(vtuDiscoveredResources.approvalStatus, "APPROVED"),
        eq(vtuDiscoveredResources.isUploaded, false),
        category ? eq(vtuDiscoveredResources.category, category) : sql`1=1`,
      );

      const approvedItems = await db
        .select()
        .from(vtuDiscoveredResources)
        .where(condition);

      await this.updateJob(jobId, {
        totalItems: approvedItems.length,
        processedItems: 0,
        progress: 5,
      });

      for (let i = 0; i < approvedItems.length; i++) {
        const item = approvedItems[i];

        if (!item.storedFilePath) {
          skipped++;
          continue;
        }

        // Find subject record if subjectCode is given
        let subjectId: string | null = null;
        let branchId = item.branchId;
        let schemeId = item.schemeId;
        let semesterId = item.semesterId;

        if (item.subjectCode) {
          const [subj] = await db
            .select()
            .from(subjects)
            .where(sql`upper(${subjects.code}) = upper(${item.subjectCode})`)
            .limit(1);

          if (subj) {
            subjectId = subj.id;
            if (!branchId) branchId = subj.branchId;
            if (!schemeId) schemeId = subj.schemeId;
            if (!semesterId) semesterId = subj.semesterId;
          }
        }

        // Deduplication in live resources:
        // Check if identical fileUrl or fileHash already exists in resources table
        const [existingLive] = await db
          .select({ id: resources.id })
          .from(resources)
          .where(
            item.fileHash
              ? eq(resources.fileHash, item.fileHash)
              : eq(resources.fileUrl, item.storedFilePath),
          )
          .limit(1);

        if (existingLive) {
          await db
            .update(vtuDiscoveredResources)
            .set({
              isUploaded: true,
              uploadedResourceId: existingLive.id,
              validationNotes: "Linked to existing verified live resource",
            })
            .where(eq(vtuDiscoveredResources.id, item.id));
          skipped++;
          continue;
        }

        // Insert into live resources table
        // Notice: strictly resourceType is item.category (QUESTION_PAPER, SYLLABUS, LAB_MANUAL, ASSIGNMENT)
        // Existing NOTES are strictly preserved and never overwritten
        const [newRes] = await db
          .insert(resources)
          .values({
            title: item.title,
            description: `Official authentic VTU ${item.category.replace(/_/g, " ").toLowerCase()} collected from ${item.sourceWebsite}.`,
            resourceType: item.category,
            subjectId,
            moduleNumber: item.moduleNumber || null,
            fileName: item.storedFilePath.split("/").pop() || `${item.category}.pdf`,
            fileUrl: item.storedFilePath,
            fileSize: item.fileSize || "PDF",
            status: "PUBLISHED",
            branchId,
            schemeId,
            semesterId,
            subjectCode: item.subjectCode,
            examYear: item.examYear,
            examMonth: item.examMonth,
            examType: item.examType,
            sourceWebsite: item.sourceWebsite,
            sourcePageUrl: item.sourcePageUrl,
            originalFileUrl: item.originalFileUrl,
            fileHash: item.fileHash,
            mimeType: item.mimeType || "application/pdf",
            downloadStatus: "COMPLETED",
            verificationStatus: "VERIFIED",
          })
          .returning();

        await db
          .update(vtuDiscoveredResources)
          .set({
            isUploaded: true,
            uploadedResourceId: newRes.id,
            updatedAt: new Date(),
          })
          .where(eq(vtuDiscoveredResources.id, item.id));

        uploaded++;

        const progress = Math.min(98, Math.round(((i + 1) / approvedItems.length) * 100));
        await this.updateJob(jobId, {
          processedItems: i + 1,
          successCount: uploaded,
          progress,
        });
      }

      await this.updateJob(jobId, {
        status: "COMPLETED",
        progress: 100,
        processedItems: approvedItems.length,
        successCount: uploaded,
        result: { uploaded, skipped },
      });

      return { uploaded, skipped };
    } catch (err: any) {
      await this.updateJob(jobId, {
        status: "FAILED",
        errorMessage: err?.message || String(err),
      });
      throw err;
    }
  }

  async getStats() {
    // 1. Live Resources count per category
    const liveStats = await db
      .select({
        category: resources.resourceType,
        count: sql<number>`count(*)::int`,
      })
      .from(resources)
      .groupBy(resources.resourceType);

    // 2. Discovered table stats
    const discCategoryStats = await db
      .select({
        category: vtuDiscoveredResources.category,
        count: sql<number>`count(*)::int`,
      })
      .from(vtuDiscoveredResources)
      .groupBy(vtuDiscoveredResources.category);

    const discApprovalStats = await db
      .select({
        approvalStatus: vtuDiscoveredResources.approvalStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(vtuDiscoveredResources)
      .groupBy(vtuDiscoveredResources.approvalStatus);

    const discDownloadStats = await db
      .select({
        downloadStatus: vtuDiscoveredResources.downloadStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(vtuDiscoveredResources)
      .groupBy(vtuDiscoveredResources.downloadStatus);

    // 3. Recent collection jobs
    const recentJobs = await db
      .select()
      .from(vtuCollectionJobs)
      .orderBy(desc(vtuCollectionJobs.createdAt))
      .limit(10);

    return {
      liveResources: liveStats,
      discovered: {
        byCategory: discCategoryStats,
        byApproval: discApprovalStats,
        byDownloadStatus: discDownloadStats,
      },
      recentJobs,
    };
  }
}

export const collectorEngine = new VtuCollectorEngine();
