import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  mockTests,
  questionOptions,
  questions,
  testAttempts,
  testResponses,
} from "@/db/schema";
import { getAttempts, getMockTest, getMockTests } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";

function safeQuestions(
  qs: Array<{ id: string; text: string; topic: string; marks: number; orderIndex: number }>,
  opts: Array<{ id: string; questionId: string; label: string; text: string }>,
) {
  return qs.map((q) => ({
    ...q,
    options: opts
      .filter((o) => o.questionId === q.id)
      .map((o) => ({ id: o.id, label: o.label, text: o.text })),
  }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const kind = slug?.[0];
    const id = slug?.[1];

    if (kind === "history") {
      const user = await requireUser();
      const attempts = await getAttempts(user.id);
      return apiSuccess({ attempts }, "Test history fetched");
    }

    if (kind === "attempt" && id) {
      const user = await requireUser();
      const [attempt] = await db
        .select()
        .from(testAttempts)
        .where(eq(testAttempts.id, id))
        .limit(1);
      if (!attempt || attempt.userId !== user.id)
        return apiError("Attempt not found", 404);

      const test = await getMockTest(attempt.testId);
      if (!test) return apiError("Test not found", 404);

      const responses = await db
        .select()
        .from(testResponses)
        .where(eq(testResponses.attemptId, attempt.id));

      const submitted = attempt.status !== "IN_PROGRESS";
      const qIds = test.questions.map((q) => q.id);
      const opts = await db
        .select()
        .from(questionOptions)
        .where(inArray(questionOptions.questionId, qIds));

      return apiSuccess(
        {
          attempt,
          test: {
            id: test.test.id,
            title: test.test.title,
            subject: test.test.subject,
            durationMinutes: test.test.durationMinutes,
            totalMarks: test.test.totalMarks,
          },
          questions: submitted
            ? test.questions.map((q) => ({
                ...q,
                options: opts
                  .filter((o) => o.questionId === q.id)
                  .map((o) => ({
                    id: o.id,
                    label: o.label,
                    text: o.text,
                    isCorrect: o.isCorrect,
                  })),
              }))
            : safeQuestions(test.questions, opts),
          responses,
        },
        submitted ? "Attempt result fetched" : "Attempt resumed",
      );
    }

    if (kind === "detail" && id) {
      const test = await getMockTest(id);
      if (!test) return apiError("Test not found", 404);
      return apiSuccess(
        {
          test: test.test,
          questions: safeQuestions(test.questions, test.options),
        },
        "Test fetched",
      );
    }

    const tests = await getMockTests();
    return apiSuccess({ tests }, "Mock tests fetched");
  } catch (error) {
    return handleError(error, "Unable to load test data");
  }
}

const startSchema = z.object({ testId: z.string().uuid() });

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const user = await requireUser();

    if (slug?.[0] === "attempt") {
      const body = startSchema.parse(await request.json());
      const test = await getMockTest(body.testId);
      if (!test) return apiError("Test not found", 404);

      // Resume an in-progress attempt instead of creating duplicates
      const previous = await db
        .select()
        .from(testAttempts)
        .where(
          and(
            eq(testAttempts.userId, user.id),
            eq(testAttempts.testId, test.test.id),
            eq(testAttempts.status, "IN_PROGRESS"),
          ),
        )
        .limit(1);

      if (previous[0]) {
        const responses = await db
          .select()
          .from(testResponses)
          .where(eq(testResponses.attemptId, previous[0].id));
        return apiSuccess(
          {
            attempt: previous[0],
            test: test.test,
            questions: safeQuestions(test.questions, test.options),
            responses,
          },
          "Existing attempt resumed",
        );
      }

      const [attempt] = await db
        .insert(testAttempts)
        .values({
          testId: test.test.id,
          userId: user.id,
          status: "IN_PROGRESS",
          unattemptedCount: test.questions.length,
          expiresAt: new Date(
            Date.now() + test.test.durationMinutes * 60_000,
          ),
        })
        .returning();

      return apiSuccess(
        {
          attempt,
          test: test.test,
          questions: safeQuestions(test.questions, test.options),
          responses: [],
        },
        "Test started",
        201,
      );
    }

    if (slug?.[0] === "submit" && slug?.[1]) {
      const attemptId = slug[1];
      const [attempt] = await db
        .select()
        .from(testAttempts)
        .where(eq(testAttempts.id, attemptId))
        .limit(1);
      if (!attempt || attempt.userId !== user.id)
        return apiError("Attempt not found", 404);
      if (attempt.status !== "IN_PROGRESS")
        return apiSuccess({ attemptId }, "Attempt already submitted");

      const test = await getMockTest(attempt.testId);
      if (!test) return apiError("Test not found", 404);

      const qIds = test.questions.map((q) => q.id);
      const opts = await db
        .select()
        .from(questionOptions)
        .where(inArray(questionOptions.questionId, qIds));
      const correctByOption = new Map(
        opts.filter((o) => o.isCorrect).map((o) => [o.id, o.questionId]),
      );
      const correctByQuestion = new Map(
        opts.filter((o) => o.isCorrect).map((o) => [o.questionId, o.id]),
      );

      const responses = await db
        .select()
        .from(testResponses)
        .where(eq(testResponses.attemptId, attempt.id));

      let score = 0;
      let correct = 0;
      let incorrect = 0;
      const topicPerformance: Record<
        string,
        { total: number; correct: number; incorrect: number }
      > = {};

      for (const q of test.questions) {
        const response = responses.find((r) => r.questionId === q.id);
        const bucket =
          topicPerformance[q.topic] ??
          (topicPerformance[q.topic] = { total: 0, correct: 0, incorrect: 0 });
        bucket.total += 1;
        if (response?.optionId) {
          const isRight = correctByOption.get(response.optionId) === q.id;
          await db
            .update(testResponses)
            .set({ isCorrect: isRight })
            .where(eq(testResponses.id, response.id));
          if (isRight) {
            correct += 1;
            score += Number(q.marks);
            bucket.correct += 1;
          } else {
            incorrect += 1;
            score -= Number(q.negativeMarks);
            bucket.incorrect += 1;
          }
        }
        void correctByQuestion;
      }

      const total = test.questions.length;
      const unattempted = Math.max(0, total - correct - incorrect);
      const percentage = test.test.totalMarks
        ? Math.max(0, Math.round((score / test.test.totalMarks) * 100))
        : 0;

      const [updated] = await db
        .update(testAttempts)
        .set({
          status: "SUBMITTED",
          submittedAt: new Date(),
          score: Math.max(0, Math.round(score)),
          correctCount: correct,
          incorrectCount: incorrect,
          unattemptedCount: unattempted,
          percentage: String(percentage),
          topicPerformance,
        })
        .where(eq(testAttempts.id, attempt.id))
        .returning();

      return apiSuccess(
        { attempt: updated, topicPerformance },
        "Test submitted and scored",
      );
    }

    return apiError("Unknown test action", 404);
  } catch (error) {
    return handleError(error, "Test action failed");
  }
}

const responseSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid().nullable(),
  markedForReview: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const attemptId = slug?.[1];
    if (!attemptId) return apiError("Attempt id is required", 400);
    const user = await requireUser();
    const body = responseSchema.parse(await request.json());

    const [attempt] = await db
      .select()
      .from(testAttempts)
      .where(eq(testAttempts.id, attemptId))
      .limit(1);
    if (!attempt || attempt.userId !== user.id)
      return apiError("Attempt not found", 404);
    if (attempt.status !== "IN_PROGRESS")
      return apiError("This attempt is already submitted", 409);

    // Auto-submit when the timer has expired
    if (attempt.expiresAt && attempt.expiresAt < new Date()) {
      return apiError("Time is up — the test was auto-submitted", 409);
    }

    const [existing] = await db
      .select()
      .from(testResponses)
      .where(
        and(
          eq(testResponses.attemptId, attempt.id),
          eq(testResponses.questionId, body.questionId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(testResponses)
        .set({
          optionId: body.optionId,
          markedForReview: body.markedForReview ?? existing.markedForReview,
          answeredAt: body.optionId ? new Date() : null,
        })
        .where(eq(testResponses.id, existing.id));
    } else {
      await db.insert(testResponses).values({
        attemptId: attempt.id,
        questionId: body.questionId,
        optionId: body.optionId,
        markedForReview: body.markedForReview ?? false,
        answeredAt: body.optionId ? new Date() : null,
      });
    }

    // Keep the attempt summary counters fresh
    const responses = await db
      .select()
      .from(testResponses)
      .where(eq(testResponses.attemptId, attempt.id));
    const answered = responses.filter((r) => r.optionId).length;
    await db
      .update(testAttempts)
      .set({ unattemptedCount: Math.max(0, responses.length - answered) })
      .where(eq(testAttempts.id, attempt.id));

    return apiSuccess({ saved: true }, "Response saved");
  } catch (error) {
    return handleError(error, "Unable to save response");
  }
}
