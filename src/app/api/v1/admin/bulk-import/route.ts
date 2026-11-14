export const runtime = "edge";
/**
 * Bulk content import â€” EngineerPrep India
 *
 * Workflow:
 *   1. POST with action=validate â€” parse file, validate rows, create ImportJob record
 *   2. POST with action=confirm â€” ACTUALLY insert valid rows into the database
 *
 * Files supported: CSV, JSON (array or {rows:[]}), XLSX (requires xlsx package)
 * Import categories: DSA Problems, Roadmaps, Jobs/Internships, Aptitude/Technical tests
 */
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  companies,
  dsaPatterns,
  dsaProblems,
  dsaSheets,
  importJobs,
  mockTests,
  opportunities,
  questions,
  questionOptions,
  roadmapStages,
  roadmapTopics,
  roadmaps,
  vtuUpdates,
  auditLogs,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/* -------------------- Column definitions -------------------- */

const COLUMN_MAPS: Record<string, { required: string[]; optional: string[] }> =
  {
    "DSA Problems": {
      required: ["title", "difficulty", "pattern"],
      optional: ["statement", "practiceUrl", "sheet", "slug"],
    },
    Roadmaps: {
      required: ["title", "category", "stage", "topic"],
      optional: [
        "description",
        "estimatedDuration",
        "difficulty",
        "resourceUrl",
        "estimatedMinutes",
      ],
    },
    "Jobs/Internships": {
      required: ["title", "company", "type", "location"],
      optional: [
        "stipend",
        "salaryMin",
        "salaryMax",
        "batch",
        "skills",
        "deadline",
        "mode",
        "description",
        "applicationUrl",
      ],
    },
    Aptitude: {
      required: ["question", "optionA", "correct"],
      optional: [
        "optionB",
        "optionC",
        "optionD",
        "topic",
        "explanation",
        "testTitle",
        "marks",
      ],
    },
    Technical: {
      required: ["question", "answer", "topic"],
      optional: [
        "optionA",
        "optionB",
        "optionC",
        "optionD",
        "explanation",
        "testTitle",
        "marks",
      ],
    },
    "VTU Updates": {
      required: ["title", "category"],
      optional: ["summary", "fileUrl"],
    },
  };

/* -------------------- Parsers -------------------- */

export function parseCsv(
  text: string,
): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      out.push(current);
      current = "";
    } else current += char;
  }
  out.push(current);
  return out;
}

function parseJson(text: string): Array<Record<string, unknown>> {
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : (data.rows ?? []);
}

/* -------------------- Validation -------------------- */

function validateRows(
  rows: Array<Record<string, unknown>>,
  category: string,
): {
  valid: Array<Record<string, unknown>>;
  errors: Array<{ row: number; field: string; message: string }>;
} {
  const map = COLUMN_MAPS[category];
  if (!map) throw new Error(`Unsupported import category: ${category}`);

  const valid: Array<Record<string, unknown>> = [];
  const errors: Array<{ row: number; field: string; message: string }> = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // 1-indexed, +1 for header row
    const missing = map.required.filter(
      (field) =>
        row[field] === undefined ||
        row[field] === null ||
        String(row[field]).trim() === "",
    );

    if (missing.length > 0) {
      missing.forEach((field) =>
        errors.push({
          row: rowNumber,
          field,
          message: `${field} is required`,
        }),
      );
      return;
    }

    // Category-specific validations
    if (
      category === "DSA Problems" &&
      !["EASY", "MEDIUM", "HARD"].includes(
        String(row.difficulty).toUpperCase(),
      )
    ) {
      errors.push({
        row: rowNumber,
        field: "difficulty",
        message: "Difficulty must be EASY, MEDIUM or HARD",
      });
      return;
    }

    if (
      category === "Jobs/Internships" &&
      !["JOB", "INTERNSHIP", "OFF_CAMPUS"].includes(
        String(row.type).toUpperCase(),
      )
    ) {
      errors.push({
        row: rowNumber,
        field: "type",
        message: "Type must be JOB, INTERNSHIP, or OFF_CAMPUS",
      });
      return;
    }

    valid.push(row);
  });

  return { valid, errors };
}

/* -------------------- Actual DB insertion -------------------- */

async function insertDsaProblems(
  rows: Array<Record<string, unknown>>,
  adminId: string,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  // Cache patterns and sheets for lookup
  const patternMap = new Map<string, string>(); // name -> id
  const sheetMap = new Map<string, string>(); // title -> id

  const allPatterns = await db.select().from(dsaPatterns);
  allPatterns.forEach((p) => patternMap.set(p.name.toLowerCase(), p.id));

  const allSheets = await db.select().from(dsaSheets);
  allSheets.forEach((s) => sheetMap.set(s.title.toLowerCase(), s.id));

  for (const row of rows) {
    const title = String(row.title ?? "").trim();
    const slug =
      String(row.slug ?? title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    const patternName = String(row.pattern ?? "").toLowerCase();
    const sheetTitle = String(row.sheet ?? "").toLowerCase();

    let patternId = patternMap.get(patternName) ?? null;
    if (!patternId && patternName) {
      // Create pattern if it doesn't exist
      const [newPattern] = await db
        .insert(dsaPatterns)
        .values({
          name: String(row.pattern),
          slug: patternName.replace(/[^a-z0-9]+/g, "-"),
        })
        .onConflictDoNothing()
        .returning();
      if (newPattern) {
        patternId = newPattern.id;
        patternMap.set(patternName, patternId);
      }
    }

    let sheetId = sheetMap.get(sheetTitle) ?? null;
    if (!sheetId && sheetTitle) {
      const [newSheet] = await db
        .insert(dsaSheets)
        .values({
          title: String(row.sheet),
          slug: sheetTitle.replace(/[^a-z0-9]+/g, "-"),
          difficulty: "BEGINNER",
          totalProblems: 0,
        })
        .onConflictDoNothing()
        .returning();
      if (newSheet) {
        sheetId = newSheet.id;
        sheetMap.set(sheetTitle, sheetId);
      }
    }

    try {
      await db
        .insert(dsaProblems)
        .values({
          title,
          slug,
          statement: String(row.statement ?? ""),
          practiceUrl: String(row.practiceUrl ?? "") || null,
          difficulty: String(row.difficulty ?? "EASY").toUpperCase() as never,
          patternId,
          sheetId,
          orderIndex: 0,
        })
        .onConflictDoNothing();
      inserted++;
    } catch (err) {
      console.warn(`[import] Skipped duplicate DSA problem: ${title}`, err);
      skipped++;
    }
  }

  // Update totalProblems count on sheets
  for (const [, sheetId] of sheetMap) {
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dsaProblems)
      .where(eq(dsaProblems.sheetId, sheetId));
    const count = countResult[0]?.count ?? 0;
    await db
      .update(dsaSheets)
      .set({ totalProblems: count })
      .where(eq(dsaSheets.id, sheetId));
  }

  void adminId;
  return { inserted, skipped };
}

async function insertJobsInternships(
  rows: Array<Record<string, unknown>>,
  adminId: string,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  // Cache companies for lookup
  const companyMap = new Map<string, string>();
  const allCompanies = await db.select().from(companies);
  allCompanies.forEach((c) => companyMap.set(c.name.toLowerCase(), c.id));

  for (const row of rows) {
    const companyName = String(row.company ?? "").trim();
    let companyId = companyMap.get(companyName.toLowerCase()) ?? null;

    if (!companyId && companyName) {
      const [newCompany] = await db
        .insert(companies)
        .values({
          name: companyName,
          logoText: companyName.substring(0, 2).toUpperCase(),
        })
        .returning();
      companyId = newCompany.id;
      companyMap.set(companyName.toLowerCase(), companyId);
    }

    const opportunityType = String(row.type ?? "JOB")
      .toUpperCase()
      .replace("INTERNSHIP", "INTERNSHIP") as "JOB" | "INTERNSHIP" | "OFF_CAMPUS";

    try {
      await db.insert(opportunities).values({
        title: String(row.title ?? "").trim(),
        description: String(row.description ?? "") || null,
        opportunityType,
        companyId,
        location: String(row.location ?? "").trim(),
        workMode: (String(row.mode ?? "ONSITE").toUpperCase() as "ONSITE" | "REMOTE" | "HYBRID") || "ONSITE",
        salaryMin: row.salaryMin ? parseInt(String(row.salaryMin), 10) : null,
        salaryMax: row.salaryMax ? parseInt(String(row.salaryMax), 10) : null,
        stipend: row.stipend ? parseInt(String(row.stipend), 10) : null,
        graduationBatch: row.batch ? parseInt(String(row.batch), 10) : null,
        applicationDeadline: row.deadline ? new Date(String(row.deadline)) : null,
        applicationUrl: String(row.applicationUrl ?? "") || null,
        status: "OPEN",
      });
      inserted++;
    } catch (err) {
      console.warn(`[import] Skipped opportunity: ${row.title}`, err);
      skipped++;
    }
  }

  void adminId;
  return { inserted, skipped };
}

async function insertRoadmapTopics(
  rows: Array<Record<string, unknown>>,
  adminId: string,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  const roadmapMap = new Map<string, string>(); // title -> id
  const stageMap = new Map<string, string>(); // "roadmapId:stageTitle" -> id

  for (const row of rows) {
    const roadmapTitle = String(row.title ?? "").trim();
    const stageTitle = String(row.stage ?? "Introduction").trim();
    const topicTitle = String(row.topic ?? "").trim();

    if (!roadmapTitle || !topicTitle) {
      skipped++;
      continue;
    }

    // Ensure roadmap exists
    let roadmapId = roadmapMap.get(roadmapTitle.toLowerCase());
    if (!roadmapId) {
      const slug =
        roadmapTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
        "-" +
        Date.now().toString(36);
      const [roadmap] = await db
        .insert(roadmaps)
        .values({
          title: roadmapTitle,
          slug,
          category: String(row.category ?? "General"),
          description: String(row.description ?? "") || null,
          difficulty: (String(row.difficulty ?? "BEGINNER").toUpperCase() as never) || "BEGINNER",
          estimatedDuration: String(row.estimatedDuration ?? "") || null,
          stepCount: 0,
        })
        .onConflictDoNothing()
        .returning();

      if (roadmap) {
        roadmapId = roadmap.id;
        roadmapMap.set(roadmapTitle.toLowerCase(), roadmapId);
      } else {
        // Roadmap already exists â€” look it up
        const [existing] = await db
          .select()
          .from(roadmaps)
          .where(eq(roadmaps.title, roadmapTitle))
          .limit(1);
        if (existing) {
          roadmapId = existing.id;
          roadmapMap.set(roadmapTitle.toLowerCase(), roadmapId);
        }
      }
    }

    if (!roadmapId) {
      skipped++;
      continue;
    }

    // Ensure stage exists
    const stageKey = `${roadmapId}:${stageTitle.toLowerCase()}`;
    let stageId = stageMap.get(stageKey);
    if (!stageId) {
      const [stage] = await db
        .insert(roadmapStages)
        .values({
          roadmapId,
          title: stageTitle,
          orderIndex: stageMap.size,
        })
        .onConflictDoNothing()
        .returning();

      if (stage) {
        stageId = stage.id;
        stageMap.set(stageKey, stageId);
      }
    }

    if (!stageId) {
      skipped++;
      continue;
    }

    // Insert topic
    try {
      await db.insert(roadmapTopics).values({
        stageId,
        title: topicTitle,
        resourceUrl: String(row.resourceUrl ?? "") || null,
        estimatedMinutes: row.estimatedMinutes
          ? parseInt(String(row.estimatedMinutes), 10)
          : 60,
        orderIndex: 0,
      });
      inserted++;
    } catch (err) {
      console.warn(`[import] Skipped topic: ${topicTitle}`, err);
      skipped++;
    }
  }

  void adminId;
  return { inserted, skipped };
}

async function insertVtuUpdates(
  rows: Array<Record<string, unknown>>,
  adminId: string,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      await db.insert(vtuUpdates).values({
        title: String(row.title ?? "").trim(),
        category: String(row.category ?? "General").trim(),
        summary: String(row.summary ?? "") || null,
        fileUrl: String(row.fileUrl ?? "") || null,
        createdBy: adminId,
      });
      inserted++;
    } catch (err) {
      console.warn(`[import] Skipped VTU update: ${row.title}`, err);
      skipped++;
    }
  }

  return { inserted, skipped };
}

async function insertAptitudeQuestions(
  rows: Array<Record<string, unknown>>,
  adminId: string,
  category: string,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  // Group by testTitle or use a default test
  const testMap = new Map<string, string>(); // testTitle -> testId

  const getOrCreateTest = async (testTitle: string): Promise<string> => {
    if (testMap.has(testTitle)) return testMap.get(testTitle)!;
    const slug =
      testTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now().toString(36);
    const [test] = await db
      .insert(mockTests)
      .values({
        title: testTitle,
        slug,
        subject: category,
        difficulty: "MEDIUM",
        durationMinutes: 60,
        totalMarks: rows.length * 2,
        isPublished: false,
      })
      .returning();
    testMap.set(testTitle, test.id);
    return test.id;
  };

  for (const row of rows) {
    const testTitle =
      String(row.testTitle ?? `${category} Test - ${new Date().toLocaleDateString("en-IN")}`);
    const testId = await getOrCreateTest(testTitle);

    try {
      const [q] = await db
        .insert(questions)
        .values({
          testId,
          text: String(row.question ?? "").trim(),
          topic: String(row.topic ?? category).trim(),
          marks: row.marks ? parseInt(String(row.marks), 10) : 2,
          orderIndex: 0,
        })
        .returning();

      // Insert options
      const optionLabels = ["A", "B", "C", "D"];
      const correctLabel = String(row.correct ?? "A").toUpperCase();

      for (const label of optionLabels) {
        const text = String(row[`option${label}`] ?? "").trim();
        if (!text && label !== "A") continue; // Skip empty options (except A)
        await db.insert(questionOptions).values({
          questionId: q.id,
          label,
          text: text || `Option ${label}`,
          isCorrect: label === correctLabel,
        });
      }

      inserted++;
    } catch (err) {
      console.warn(`[import] Skipped question: ${row.question}`, err);
      skipped++;
    }
  }

  void adminId;
  return { inserted, skipped };
}

/* -------------------- API Handlers -------------------- */

export async function GET() {
  try {
    await requireAdmin();
    const imports = await db
      .select()
      .from(importJobs)
      .orderBy(importJobs.createdAt);
    return apiSuccess(
      { imports, columns: COLUMN_MAPS },
      "Import history fetched",
    );
  } catch (error) {
    return handleError(error, "Unable to load imports");
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const category = String(form.get("category") ?? "DSA Problems");
    const action = String(form.get("action") ?? "validate");

    /* ---- CONFIRM: Actually insert records ---- */
    if (action === "confirm") {
      const importId = String(form.get("importId") ?? "");
      const [job] = await db
        .select()
        .from(importJobs)
        .where(eq(importJobs.id, importId))
        .limit(1);

      if (!job) return apiError("Import job not found", 404);
      if (job.status === "COMPLETED")
        return apiError("This import has already been processed", 409);
      if (job.status !== "VALIDATED")
        return apiError("Only validated imports can be confirmed", 400);

      // Mark as processing
      await db
        .update(importJobs)
        .set({ status: "PROCESSING" })
        .where(eq(importJobs.id, importId));

      // Get the preview rows from the job (what was validated)
      const validRows = (job.preview as Array<Record<string, unknown>>) ?? [];

      let insertResult = { inserted: 0, skipped: 0 };
      try {
        switch (job.category) {
          case "DSA Problems":
            insertResult = await insertDsaProblems(validRows, admin.id);
            break;
          case "Jobs/Internships":
            insertResult = await insertJobsInternships(validRows, admin.id);
            break;
          case "Roadmaps":
            insertResult = await insertRoadmapTopics(validRows, admin.id);
            break;
          case "VTU Updates":
            insertResult = await insertVtuUpdates(validRows, admin.id);
            break;
          case "Aptitude":
          case "Technical":
            insertResult = await insertAptitudeQuestions(
              validRows,
              admin.id,
              job.category,
            );
            break;
          default:
            throw new Error(
              `Insertion not implemented for category: ${job.category}`,
            );
        }

        await db
          .update(importJobs)
          .set({
            status: "COMPLETED",
            importedRows: insertResult.inserted,
            completedAt: new Date(),
          })
          .where(eq(importJobs.id, importId));

        // Write audit log
        await db.insert(auditLogs).values({
          actorId: admin.id,
          action: "BULK_IMPORT",
          entity: job.category,
          entityId: importId,
          metadata: { inserted: insertResult.inserted, skipped: insertResult.skipped },
        });

        return apiSuccess(
          {
            importedRows: insertResult.inserted,
            skippedRows: insertResult.skipped,
          },
          `Import completed. ${insertResult.inserted} records inserted.`,
        );
      } catch (insertError) {
        await db
          .update(importJobs)
          .set({
            status: "FAILED",
            completedAt: new Date(),
          })
          .where(eq(importJobs.id, importId));

        throw insertError;
      }
    }

    /* ---- VALIDATE: Parse and validate file ---- */
    if (!(file instanceof File)) return apiError("A file is required", 400);
    if (file.size > MAX_BYTES) return apiError("File exceeds the 50 MB limit", 413);

    const name = file.name.toLowerCase();
    const text = await file.text();
    let rows: Array<Record<string, unknown>>;

    if (name.endsWith(".json")) {
      rows = parseJson(text);
    } else if (name.endsWith(".xlsx")) {
      // Try to load xlsx package dynamically
      try {
        const XLSX = await import("xlsx" as never) as { read: (data: Buffer, opts: { type: string }) => { SheetNames: string[]; Sheets: Record<string, unknown> }; utils: { sheet_to_json: (sheet: unknown) => Array<Record<string, unknown>> } };
        const workbook = XLSX.read(Buffer.from(text), { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      } catch {
        return apiError(
          "XLSX support requires the 'xlsx' package. Install it with: npm install xlsx, or export your spreadsheet as CSV or JSON.",
          400,
        );
      }
    } else {
      rows = parseCsv(text);
    }

    const { valid, errors } = validateRows(rows, category);

    // Store ALL valid rows in the preview field for use during confirmation
    const [job] = await db
      .insert(importJobs)
      .values({
        category,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(0)} KB`,
        status: errors.length === 0 ? "VALIDATED" : "FAILED",
        totalRows: rows.length,
        validRows: valid.length,
        invalidRows: errors.length,
        importedRows: 0,
        preview: valid, // Store ALL valid rows, not just the first 5
        errors: errors.slice(0, 25),
        createdBy: admin.id,
      })
      .returning();

    return apiSuccess(
      {
        importId: job.id,
        fileName: job.fileName,
        totalRows: job.totalRows,
        validRows: job.validRows,
        invalidRows: job.invalidRows,
        preview: valid.slice(0, 5), // Show only 5 for display
        errors: errors.slice(0, 25),
      },
      errors.length === 0
        ? "File validated successfully. Confirm to import."
        : "File validated with row-level errors. Fix issues and re-upload, or confirm to import only valid rows.",
    );
  } catch (error) {
    return handleError(error, "Import processing failed");
  }
}
