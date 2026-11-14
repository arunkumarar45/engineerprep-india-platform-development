import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookmarks, downloads, resources } from "@/db/schema";
import {
  getBranches,
  getResourceStats,
  getResources,
  getSemesters,
  getSubjects,
} from "@/lib/queries";
import { getSessionUser, requireAdmin, requireUser } from "@/lib/auth";
import { apiError, apiSuccess, handleError, paginate } from "@/lib/api";

const filterSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  subjectId: z.string().optional(),
  module: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(9),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);

    if (slug?.[0] === "filters") {
      const [branches, semesters, subjects, stats] = await Promise.all([
        getBranches(),
        getSemesters(),
        getSubjects(),
        getResourceStats(),
      ]);
      return apiSuccess({ branches, semesters, subjects, stats }, "Filters loaded");
    }

    const filters = filterSchema.parse(Object.fromEntries(url.searchParams));
    const rows = await getResources(filters);
    const { rows: page, meta } = paginate(rows, filters.page, filters.pageSize);
    return apiSuccess({ resources: page, meta }, "Resources fetched");
  } catch (error) {
    return handleError(error, "Unable to load resources");
  }
}

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  resourceType: z.enum([
    "NOTES",
    "QUESTION_PAPER",
    "SYLLABUS",
    "LAB_MANUAL",
    "ASSIGNMENT",
    "OTHER",
  ]),
  subjectId: z.string().uuid().optional(),
  moduleNumber: z.coerce.number().int().min(1).max(8).optional(),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.string().optional(),
  sourcePageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;

    if (slug?.[0] === "download") {
      const user = await getSessionUser();
      const id = slug[1];
      if (!id) return apiError("Resource id is required", 400);
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, id))
        .limit(1);
      if (!resource) return apiError("Resource not found", 404);
      if (user) {
        await db.insert(downloads).values({ userId: user.id, resourceId: id });
      }
      await db
        .update(resources)
        .set({ downloadCount: resource.downloadCount + 1 })
        .where(eq(resources.id, id));

      let finalUrl = resource.fileUrl;
      const isBrokenDrive = /1L9X8902|1P5Y7912|1M3Z9914|1XpY3Q9k/.test(finalUrl);
      if (isBrokenDrive || (!finalUrl.startsWith("http") && !finalUrl.startsWith("/"))) {
        finalUrl = `/vtu/view/${resource.id}`;
      }

      return apiSuccess(
        { fileUrl: finalUrl, fileName: resource.fileName },
        "Download recorded",
      );
    }

    if (slug?.[0] === "bookmark") {
      const user = await requireUser();
      const id = slug[1];
      if (!id) return apiError("Resource id is required", 400);
      const [existing] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.refId, id),
            eq(bookmarks.userId, user.id),
            eq(bookmarks.kind, "RESOURCE"),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .delete(bookmarks)
          .where(and(eq(bookmarks.id, existing.id), eq(bookmarks.userId, user.id)));
        return apiSuccess({ bookmarked: false }, "Bookmark removed");
      }
      await db.insert(bookmarks).values({
        userId: user.id,
        kind: "RESOURCE",
        refId: id,
      });
      return apiSuccess({ bookmarked: true }, "Resource bookmarked");
    }

    // Authenticated users (students, contributors, admins) can upload resources
    const user = await requireUser();
    const body = createSchema.parse(await request.json());
    // Only admins can directly publish; community and student submissions default to DRAFT for review
    const status = user.role === "ADMIN" ? (body.status ?? "PUBLISHED") : "DRAFT";
    const [created] = await db
      .insert(resources)
      .values({
        ...body,
        status,
        subjectId: body.subjectId ?? null,
        moduleNumber: body.moduleNumber ?? null,
        uploadedBy: user.id,
        fileSize: body.fileSize ?? "—",
      })
      .returning();
    const message =
      status === "PUBLISHED"
        ? "Resource published successfully"
        : "Resource submitted for review";
    return apiSuccess({ resource: created }, message, 201);
  } catch (error) {
    return handleError(error, "Resource action failed");
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    await requireAdmin();
    const { slug } = await context.params;
    const id = slug?.[1];
    if (!id) return apiError("Resource id is required", 400);
    const body = await request.json();
    await db
      .update(resources)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(resources.id, id));
    return apiSuccess({ id }, "Resource updated");
  } catch (error) {
    return handleError(error, "Resource update failed");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    await requireAdmin();
    const { slug } = await context.params;
    const id = slug?.[1];
    if (!id) return apiError("Resource id is required", 400);
    await db.delete(resources).where(eq(resources.id, id));
    return apiSuccess({ id }, "Resource deleted");
  } catch (error) {
    return handleError(error, "Resource delete failed");
  }
}
