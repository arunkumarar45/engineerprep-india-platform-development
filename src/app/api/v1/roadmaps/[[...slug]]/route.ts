import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { roadmapProgress } from "@/db/schema";
import { getRoadmap, getRoadmaps } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const id = slug?.[1] ?? url.searchParams.get("id");

    if (slug?.[0] === "detail" && id) {
      const roadmap = await getRoadmap(id);
      if (!roadmap) return apiError("Roadmap not found", 404);
      return apiSuccess(roadmap, "Roadmap fetched");
    }

    const category = url.searchParams.get("category") ?? "All";
    const roadmaps = await getRoadmaps(category);
    return apiSuccess({ roadmaps }, "Roadmaps fetched");
  } catch (error) {
    return handleError(error, "Unable to load roadmaps");
  }
}

const progressSchema = z.object({
  roadmapId: z.string().uuid(),
  topicId: z.string().uuid(),
  completed: z.boolean().default(true),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    if (slug?.[0] !== "progress") return apiError("Unknown action", 404);
    const user = await requireUser();
    const body = progressSchema.parse(await request.json());

    const [existing] = await db
      .select()
      .from(roadmapProgress)
      .where(
        and(
          eq(roadmapProgress.userId, user.id),
          eq(roadmapProgress.roadmapId, body.roadmapId),
          eq(roadmapProgress.topicId, body.topicId),
        ),
      )
      .limit(1);

    if (body.completed) {
      if (existing) return apiSuccess({ completed: true }, "Topic already completed");
      await db.insert(roadmapProgress).values({
        userId: user.id,
        roadmapId: body.roadmapId,
        topicId: body.topicId,
        completed: true,
      });
      return apiSuccess({ completed: true }, "Topic completed", 201);
    }

    if (existing) await db.delete(roadmapProgress).where(eq(roadmapProgress.id, existing.id));
    return apiSuccess({ completed: false }, "Topic unmarked");
  } catch (error) {
    return handleError(error, "Unable to update roadmap progress");
  }
}
