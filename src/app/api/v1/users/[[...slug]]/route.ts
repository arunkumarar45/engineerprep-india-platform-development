import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";

const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  collegeName: z.string().min(2).optional(),
  branchId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  graduationYear: z.coerce.number().int().min(2020).max(2035).optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    if (slug?.[0] !== "profile") return apiError("Unknown action", 404);
    const session = await requireUser();
    const body = profileSchema.parse(await request.json());

    const [updated] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, session.id))
      .returning();

    if (!updated) return apiError("Account not found", 404);

    return apiSuccess(
      {
        user: {
          id: updated.id,
          fullName: updated.fullName,
          email: updated.email,
          role: updated.role,
          collegeName: updated.collegeName,
          branchId: updated.branchId,
          semesterId: updated.semesterId,
          graduationYear: updated.graduationYear,
          profileImageUrl: updated.profileImageUrl,
          emailVerified: updated.emailVerified,
        },
      },
      "Profile updated",
    );
  } catch (error) {
    return handleError(error, "Unable to update profile");
  }
}

export async function GET() {
  try {
    const session = await requireUser();
    return apiSuccess({ user: session }, "Profile fetched");
  } catch (error) {
    return handleError(error, "Authentication required");
  }
}
