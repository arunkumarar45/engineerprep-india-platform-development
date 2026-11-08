import { getDashboardSummary } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { apiSuccess, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const summary = await getDashboardSummary(user.id);
    return apiSuccess({ user, ...summary }, "Dashboard summary fetched");
  } catch (error) {
    return handleError(error, "Unable to load dashboard");
  }
}
