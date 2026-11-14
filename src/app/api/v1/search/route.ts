export const runtime = "edge";
import { searchAll } from "@/lib/queries";
import { apiSuccess, handleError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const hits = await searchAll(q);
    return apiSuccess(hits, "Search completed");
  } catch (error) {
    return handleError(error, "Search failed");
  }
}
