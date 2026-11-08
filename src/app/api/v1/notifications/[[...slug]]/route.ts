import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notificationPreferences, notifications } from "@/db/schema";
import { getNotifications } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";

const preferenceSchema = z.object({
  vtuUpdates: z.boolean().optional(),
  jobAlerts: z.boolean().optional(),
  internshipAlerts: z.boolean().optional(),
  applicationUpdates: z.boolean().optional(),
  deadlineReminders: z.boolean().optional(),
  dsaReminders: z.boolean().optional(),
  roadmapReminders: z.boolean().optional(),
  mockTestReminders: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  timezone: z.string().optional(),
  reminderTime: z.string().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  digestFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "OFF"]).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const user = await requireUser();
    const { slug } = await context.params;

    if (slug?.[0] === "preferences") {
      const [prefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, user.id))
        .limit(1);
      return apiSuccess(
        { preferences: prefs ?? null },
        "Notification preferences fetched",
      );
    }

    const rows = await getNotifications(user.id);
    const unread = rows.filter((n) => !n.isRead).length;
    return apiSuccess({ notifications: rows, unread }, "Notifications fetched");
  } catch (error) {
    return handleError(error, "Unable to load notifications");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const user = await requireUser();
    const { slug } = await context.params;
    const body = await request.json().catch(() => ({}));

    if (slug?.[0] === "preferences") {
      const payload = preferenceSchema.parse(body);
      const [existing] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, user.id))
        .limit(1);
      if (existing) {
        await db
          .update(notificationPreferences)
          .set({ ...payload, updatedAt: new Date() })
          .where(eq(notificationPreferences.id, existing.id));
      } else {
        await db.insert(notificationPreferences).values({
          userId: user.id,
          ...payload,
        });
      }
      return apiSuccess({ preferences: payload }, "Preferences saved");
    }

    if (body.action === "read-all") {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, user.id));
      return apiSuccess({ unread: 0 }, "All notifications marked as read");
    }

    if (body.id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, body.id));
      return apiSuccess({ id: body.id }, "Notification marked as read");
    }

    return apiError("Unknown notification action", 400);
  } catch (error) {
    return handleError(error, "Notification action failed");
  }
}
