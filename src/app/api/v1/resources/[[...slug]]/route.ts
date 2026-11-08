import { eq } from "drizzle-orm";
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
import { requireAdmin, requireUser } from "@/lib/auth";
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
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const user = await requireUser();

    if (slug?.[0] === "download") {
      const id = slug[1];
      if (!id) return apiError("Resource id is required", 400);
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, id))
        .limit(1);
      if (!resource) return apiError("Resource not found", 404);
      await db.insert(downloads).values({ userId: user.id, resourceId: id });
      await db
        .update(resources)
        .set({ downloadCount: resource.downloadCount + 1 })
        .where(eq(resources.id, id));
      return apiSuccess(
        { fileUrl: resource.fileUrl, fileName: resource.fileName },
        "Download recorded",
      );
    }

    if (slug?.[0] === "bookmark") {
      const id = slug[1];
      if (!id) return apiError("Resource id is required", 400);
      const [existing] = await db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.refId, id))
        .limit(1);
      if (existing) {
        await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
        return apiSuccess({ bookmarked: false }, "Bookmark removed");
      }
      await db.insert(bookmarks).values({
        userId: user.id,
        kind: "RESOURCE",
        refId: id,
      });
      return apiSuccess({ bookmarked: true }, "Resource bookmarked");
    }

    // Students can upload too — their resources go into DRAFT for admin review
    const body = createSchema.parse(await request.json());
    const isAdmin = user.role === "ADMIN";
    const status = isAdmin ? (body.status ?? "PUBLISHED") : "DRAFT";
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
    const message = isAdmin
      ? "Resource published successfully"
      : "Resource submitted for review — it will appear once approved by an admin";
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
