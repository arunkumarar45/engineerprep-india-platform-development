/**
 * BullMQ Worker — EngineerPrep India
 *
 * Runs as an independent process alongside the Next.js frontend.
 * Processes jobs from Redis queues using BullMQ.
 *
 * Usage:
 *   npm run worker
 *
 * Required environment variables:
 *   REDIS_URL          — Redis connection URL (default: redis://localhost:6379)
 *   DATABASE_URL       — PostgreSQL connection string
 */

import "dotenv/config";
import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  automationExecutions,
  notifications,
  notificationOutbox,
  opportunities,
  users,
  studentStreaks,
  learningActivities,
} from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Redis connection                                                     */
/* ------------------------------------------------------------------ */

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

connection.on("error", (err: Error) => {
  console.error("[worker] Redis connection error:", err.message);
});

connection.on("connect", () => {
  console.log("[worker] ✅ Connected to Redis:", REDIS_URL);
});

/* ------------------------------------------------------------------ */
/* Logging helpers                                                      */
/* ------------------------------------------------------------------ */

function log(queue: string, message: string, data?: unknown) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${queue}] ${message}`, data ?? "");
}

function logError(queue: string, message: string, err: unknown) {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [${queue}] ❌ ${message}`, err);
}

/* ------------------------------------------------------------------ */
/* Record execution result in DB                                        */
/* ------------------------------------------------------------------ */

async function recordExecution(
  status: "SUCCESS" | "FAILED" | "SKIPPED",
  result: Record<string, unknown>,
) {
  try {
    await db.insert(automationExecutions).values({
      status,
      triggerSource: "QUEUE",
      attempts: 1,
      message: JSON.stringify(result).slice(0, 500),
      result,
      startedAt: new Date(),
      finishedAt: new Date(),
    });
  } catch (dbErr) {
    logError("db", "Failed to record execution", dbErr);
  }
}

/* ------------------------------------------------------------------ */
/* Job handlers                                                         */
/* ------------------------------------------------------------------ */

type JobPayload = Record<string, unknown>;
type JobResult = Record<string, unknown>;

/** Sends in-app notifications to students about new jobs */
async function handleJobAlert(payload: JobPayload): Promise<JobResult> {
  const opportunityId = String(payload.opportunityId ?? "");
  if (!opportunityId) return { skipped: true, reason: "No opportunityId" };

  const [opp] = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      graduationBatch: opportunities.graduationBatch,
    })
    .from(opportunities)
    .where(eq(opportunities.id, opportunityId))
    .limit(1);

  if (!opp) return { skipped: true, reason: "Opportunity not found" };

  const eligibleStudents = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.role, "STUDENT"),
        eq(users.isActive, true),
        opp.graduationBatch
          ? eq(users.graduationYear, opp.graduationBatch)
          : sql`true`,
      ),
    );

  if (eligibleStudents.length === 0) {
    return { notified: 0, reason: "No eligible students" };
  }

  const batchSize = 100;
  let totalNotified = 0;

  for (let i = 0; i < eligibleStudents.length; i += batchSize) {
    const batch = eligibleStudents.slice(i, i + batchSize);
    await db.insert(notifications).values(
      batch.map((s: { id: string }) => ({
        userId: s.id,
        type: "JOB_ALERT" as const,
        title: `New opportunity: ${opp.title}`,
        body: `A new job opportunity matching your profile has been posted.`,
        linkUrl: `/jobs/${opp.id}`,
        isRead: false,
      })),
    );
    totalNotified += batch.length;
  }

  return { notified: totalNotified, opportunityId };
}

/** Sends in-app notifications about VTU updates */
async function handleVtuUpdate(payload: JobPayload): Promise<JobResult> {
  const title = String(payload.title ?? "New VTU Update");
  const category = String(payload.category ?? "General");
  const updateId = String(payload.updateId ?? "");

  const students = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "STUDENT"), eq(users.isActive, true)));

  if (students.length === 0) return { notified: 0 };

  const batchSize = 100;
  let totalNotified = 0;

  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    await db.insert(notifications).values(
      batch.map((s: { id: string }) => ({
        userId: s.id,
        type: "VTU_UPDATE" as const,
        title: `VTU Update: ${title}`,
        body: `New ${category} update posted on the platform.`,
        linkUrl: updateId ? `/vtu/updates/${updateId}` : `/vtu/updates`,
        isRead: false,
      })),
    );
    totalNotified += batch.length;
  }

  return { notified: totalNotified, category };
}

/** Checks for approaching deadlines and reminds students */
async function handleDeadlineReminder(_payload: JobPayload): Promise<JobResult> {
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const upcoming = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      applicationDeadline: opportunities.applicationDeadline,
    })
    .from(opportunities)
    .where(
      and(
        eq(opportunities.status, "ACTIVE"),
        gte(opportunities.applicationDeadline, now),
        lte(opportunities.applicationDeadline, in48Hours),
      ),
    );

  if (upcoming.length === 0) return { reminded: 0, scanned: 0 };

  let totalReminded = 0;

  for (const opp of upcoming) {
    const students = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "STUDENT"), eq(users.isActive, true)));

    for (let i = 0; i < students.length; i += 100) {
      const batch = students.slice(i, i + 100);
      await db.insert(notifications).values(
        batch.map((s: { id: string }) => ({
          userId: s.id,
          type: "DEADLINE_REMINDER" as const,
          title: `Deadline approaching: ${opp.title}`,
          body: `Application deadline for "${opp.title}" is in less than 48 hours!`,
          linkUrl: `/jobs/${opp.id}`,
          isRead: false,
        })),
      );
      totalReminded += batch.length;
    }
  }

  return { reminded: totalReminded, scanned: upcoming.length };
}

/** Updates student streaks based on today's learning activity */
async function handleStreakUpdate(_payload: JobPayload): Promise<JobResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get students who had activity today
  const activeToday = await db
    .selectDistinct({ userId: learningActivities.userId })
    .from(learningActivities)
    .where(gte(learningActivities.occurredAt, today));

  let updated = 0;

  for (const { userId } of activeToday) {
    const [yesterdayActivity] = await db
      .select({ id: learningActivities.id })
      .from(learningActivities)
      .where(
        and(
          eq(learningActivities.userId, userId),
          gte(learningActivities.occurredAt, yesterday),
          lte(learningActivities.occurredAt, today),
        ),
      )
      .limit(1);

    const [existingStreak] = await db
      .select()
      .from(studentStreaks)
      .where(eq(studentStreaks.userId, userId))
      .limit(1);

    if (existingStreak) {
      const isConsecutive = !!yesterdayActivity;
      await db
        .update(studentStreaks)
        .set({
          currentStreak: isConsecutive
            ? sql`${studentStreaks.currentStreak} + 1`
            : 1,
          longestStreak: isConsecutive
            ? sql`GREATEST(${studentStreaks.longestStreak}, ${studentStreaks.currentStreak} + 1)`
            : sql`GREATEST(${studentStreaks.longestStreak}, 1)`,
          lastActiveDate: today,
          updatedAt: new Date(),
        })
        .where(eq(studentStreaks.userId, userId));
    } else {
      await db.insert(studentStreaks).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
      });
    }
    updated++;
  }

  return { updated };
}

/** Flush notification outbox — deliver pending notifications */
async function handleNotificationQueue(_payload: JobPayload): Promise<JobResult> {
  const pending = await db
    .select()
    .from(notificationOutbox)
    .where(eq(notificationOutbox.status, "PENDING"))
    .limit(100);

  if (pending.length === 0) return { flushed: 0 };

  let flushed = 0;
  for (const item of pending) {
    try {
      if (item.userId) {
        await db.insert(notifications).values({
          userId: item.userId,
          type: item.type,
          title: item.title,
          body: item.body ?? "",
          linkUrl: item.linkUrl ?? null,
          isRead: false,
        });
      }

      await db
        .update(notificationOutbox)
        .set({ status: "SENT", processedAt: new Date() })
        .where(eq(notificationOutbox.id, item.id));

      flushed++;
    } catch {
      await db
        .update(notificationOutbox)
        .set({ status: "FAILED", processedAt: new Date() })
        .where(eq(notificationOutbox.id, item.id));
    }
  }

  return { flushed, total: pending.length };
}

/** Cleanup: expire old records */
async function handleCleanup(_payload: JobPayload): Promise<JobResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.isRead, true),
        lte(notifications.createdAt, thirtyDaysAgo),
      ),
    );

  return { ranAt: new Date().toISOString() };
}

async function handleLearningReminder(_payload: JobPayload): Promise<JobResult> {
  return { reminded: 0, reason: "SMTP required for email reminders" };
}

async function handleWeeklyReport(_payload: JobPayload): Promise<JobResult> {
  return { generated: 0, reason: "SMTP required for weekly reports" };
}

async function handleEmailQueue(_payload: JobPayload): Promise<JobResult> {
  return { sent: false, reason: "SMTP not configured" };
}

async function handleBulkImport(payload: JobPayload): Promise<JobResult> {
  return { processed: 0, jobId: payload.jobId };
}

async function handleContentPublishing(_payload: JobPayload): Promise<JobResult> {
  return { published: 0 };
}

/* ------------------------------------------------------------------ */
/* Queue → handler mapping                                              */
/* ------------------------------------------------------------------ */

const QUEUE_HANDLERS: Record<string, (payload: JobPayload) => Promise<JobResult>> = {
  "job-alert-queue": handleJobAlert,
  "vtu-update-queue": handleVtuUpdate,
  "deadline-reminder-queue": handleDeadlineReminder,
  "learning-reminder-queue": handleLearningReminder,
  "streak-queue": handleStreakUpdate,
  "weekly-report-queue": handleWeeklyReport,
  "notification-queue": handleNotificationQueue,
  "email-queue": handleEmailQueue,
  "cleanup-queue": handleCleanup,
  "bulk-import-queue": handleBulkImport,
  "content-publishing-queue": handleContentPublishing,
};

/* ------------------------------------------------------------------ */
/* Create workers for each queue                                        */
/* ------------------------------------------------------------------ */

const workers: Worker[] = [];

for (const [queueName, handler] of Object.entries(QUEUE_HANDLERS)) {
  const worker = new Worker(
    queueName,
    async (job: Job) => {
      log(queueName, `Processing job #${job.id}`, { payload: job.data });
      const result = await handler(job.data as JobPayload);
      await recordExecution("SUCCESS", result);
      log(queueName, `✅ Completed job #${job.id}`, result);
      return result;
    },
    {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  );

  worker.on("failed", async (job, err: Error) => {
    logError(queueName, `Job #${job?.id} failed: ${err.message}`, err);
    await recordExecution("FAILED", { error: err.message });
  });

  workers.push(worker);
  log(queueName, `Worker started for queue: ${queueName}`);
}

/* ------------------------------------------------------------------ */
/* Graceful shutdown                                                    */
/* ------------------------------------------------------------------ */

async function shutdown(signal: string) {
  console.log(`\n[worker] Received ${signal}, shutting down gracefully...`);
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  console.log("[worker] ✅ All workers stopped. Bye!");
  process.exit(0);
}

process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT", () => { void shutdown("SIGINT"); });

console.log(
  `\n[worker] 🚀 EngineerPrep India BullMQ Worker started — ${workers.length} queues active\n`,
);
