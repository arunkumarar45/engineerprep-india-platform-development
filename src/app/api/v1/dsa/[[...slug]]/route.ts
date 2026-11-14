import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { dsaProgress, playlists } from "@/db/schema";
import {
  getDsaPattern,
  getDsaPatterns,
  getDsaProblems,
  getDsaSheet,
  getDsaSheets,
  getPlaylists,
  getProblemBySlug,
} from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";
import playlistsData from "@/data/playlists.json";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const kind = slug?.[0] ?? "sheets";
    const id = slug?.[1];
    const difficulty = url.searchParams.get("difficulty") ?? "ALL";

    if (kind === "sheets") {
      if (id) {
        const sheet = await getDsaSheet(id);
        if (!sheet) return apiError("Sheet not found", 404);
        const problems = await getDsaProblems({ sheetId: sheet.id, difficulty });
        return apiSuccess({ sheet, problems }, "Sheet fetched");
      }
      const sheets = await getDsaSheets();
      return apiSuccess({ sheets }, "DSA sheets fetched");
    }

    if (kind === "patterns") {
      if (id) {
        const pattern = await getDsaPattern(id);
        if (!pattern) return apiError("Pattern not found", 404);
        return apiSuccess(pattern, "Pattern fetched");
      }
      const patterns = await getDsaPatterns();
      return apiSuccess({ patterns }, "DSA patterns fetched");
    }

    if (kind === "playlists") {
      if (id) {
        const fullPlaylist = (playlistsData as any[]).find((p: any) => p.slug === id);
        if (fullPlaylist) {
          return apiSuccess({ playlist: fullPlaylist }, "Playlist fetched");
        }
        const [pl] = await db
          .select()
          .from(playlists)
          .where(eq(playlists.slug, id))
          .limit(1);
        if (!pl) return apiError("Playlist not found", 404);
        return apiSuccess({ playlist: pl }, "Playlist fetched");
      }
      const list = await getPlaylists();
      return apiSuccess({ playlists: list }, "Playlists fetched");
    }

    if (kind === "problems") {
      if (id) {
        const problem = await getProblemBySlug(id);
        if (!problem) return apiError("Problem not found", 404);
        return apiSuccess(problem, "Problem fetched");
      }
      const problems = await getDsaProblems({ difficulty });
      return apiSuccess({ problems }, "Problems fetched");
    }

    return apiError("Unknown DSA resource", 404);
  } catch (error) {
    return handleError(error, "Unable to load DSA data");
  }
}

const progressSchema = z.object({
  problemId: z.string().uuid(),
  sheetId: z.string().uuid().optional(),
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

    // SECURITY FIX: Always filter by both problemId AND userId to prevent
    // cross-user data access or modification.
    const [existing] = await db
      .select()
      .from(dsaProgress)
      .where(
        and(
          eq(dsaProgress.problemId, body.problemId),
          eq(dsaProgress.userId, user.id),
        ),
      )
      .limit(1);

    if (body.completed) {
      if (existing) {
        await db
          .update(dsaProgress)
          .set({ completed: true, solvedAt: new Date() })
          .where(
            and(
              eq(dsaProgress.id, existing.id),
              eq(dsaProgress.userId, user.id),
            ),
          );
        return apiSuccess({ completed: true }, "Problem already marked solved");
      }
      await db.insert(dsaProgress).values({
        userId: user.id,
        problemId: body.problemId,
        sheetId: body.sheetId ?? null,
        completed: true,
      });
      return apiSuccess({ completed: true }, "Problem marked as solved", 201);
    }

    if (existing)
      await db
        .delete(dsaProgress)
        .where(
          and(
            eq(dsaProgress.id, existing.id),
            eq(dsaProgress.userId, user.id),
          ),
        );
    return apiSuccess({ completed: false }, "Progress cleared");
  } catch (error) {
    return handleError(error, "Unable to update DSA progress");
  }
}
