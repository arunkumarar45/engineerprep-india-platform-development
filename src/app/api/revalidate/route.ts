import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const VALID_TAGS = new Set([
  "resource-stats",
  "vtu-updates",
  "branches",
  "semesters",
  "schemes",
  "subjects",
  "dsa-sheets",
  "dsa-patterns",
  "playlists",
  "roadmaps",
  "mock-tests",
]);

/**
 * On-demand cache revalidation endpoint.
 * Called by the admin panel after publishing or updating content.
 *
 * Usage:
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   Body: { "tag": "resource-stats" }   OR  { "path": "/vtu/notes" }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "REVALIDATE_SECRET not set" }, { status: 500 });
  }

  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tag?: string; path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.tag) {
    if (!VALID_TAGS.has(body.tag)) {
      return NextResponse.json({ error: `Unknown tag: ${body.tag}` }, { status: 400 });
    }
    revalidateTag(body.tag);
    return NextResponse.json({ revalidated: true, tag: body.tag });
  }

  if (body.path) {
    revalidatePath(body.path);
    return NextResponse.json({ revalidated: true, path: body.path });
  }

  return NextResponse.json({ error: "Provide 'tag' or 'path' in body" }, { status: 400 });
}
