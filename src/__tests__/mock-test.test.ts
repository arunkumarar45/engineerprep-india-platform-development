/**
 * Mock test engine tests — EngineerPrep India
 *
 * Tests the scoring logic, timer validation, and submission rules.
 */
import { describe, it, expect } from "vitest";

/* ------------------------------------------------------------------ */
/* Server-side scoring logic                                           */
/* ------------------------------------------------------------------ */

describe("Mock Test — Server-side Scoring", () => {
  type Question = {
    id: string;
    marks: number;
    negativeMarks: number;
    topic: string;
    correctOptionId: string;
  };

  type Response = {
    questionId: string;
    optionId: string | null;
  };

  function scoreTest(
    questions: Question[],
    responses: Response[],
  ): {
    score: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    topicPerformance: Record<string, { total: number; correct: number; incorrect: number }>;
  } {
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    const topicPerformance: Record<
      string,
      { total: number; correct: number; incorrect: number }
    > = {};

    for (const q of questions) {
      const bucket =
        topicPerformance[q.topic] ??
        (topicPerformance[q.topic] = { total: 0, correct: 0, incorrect: 0 });
      bucket.total += 1;

      const response = responses.find((r) => r.questionId === q.id);
      if (response?.optionId) {
        const isRight = response.optionId === q.correctOptionId;
        if (isRight) {
          correct += 1;
          score += q.marks;
          bucket.correct += 1;
        } else {
          incorrect += 1;
          score -= q.negativeMarks;
          bucket.incorrect += 1;
        }
      }
    }

    return {
      score: Math.max(0, score),
      correct,
      incorrect,
      unattempted: questions.length - correct - incorrect,
      topicPerformance,
    };
  }

  const questions: Question[] = [
    { id: "q1", marks: 2, negativeMarks: 0.5, topic: "Arrays", correctOptionId: "opt-a" },
    { id: "q2", marks: 2, negativeMarks: 0.5, topic: "Arrays", correctOptionId: "opt-c" },
    { id: "q3", marks: 2, negativeMarks: 0.5, topic: "Graphs", correctOptionId: "opt-b" },
    { id: "q4", marks: 2, negativeMarks: 0.5, topic: "Graphs", correctOptionId: "opt-d" },
  ];

  it("scores all correct answers", () => {
    const responses: Response[] = [
      { questionId: "q1", optionId: "opt-a" }, // correct
      { questionId: "q2", optionId: "opt-c" }, // correct
      { questionId: "q3", optionId: "opt-b" }, // correct
      { questionId: "q4", optionId: "opt-d" }, // correct
    ];
    const result = scoreTest(questions, responses);
    expect(result.score).toBe(8); // 4 × 2 marks
    expect(result.correct).toBe(4);
    expect(result.incorrect).toBe(0);
    expect(result.unattempted).toBe(0);
  });

  it("applies negative marking for wrong answers", () => {
    const responses: Response[] = [
      { questionId: "q1", optionId: "opt-b" }, // wrong
      { questionId: "q2", optionId: "opt-c" }, // correct
      { questionId: "q3", optionId: null },    // unattempted
      { questionId: "q4", optionId: null },    // unattempted
    ];
    const result = scoreTest(questions, responses);
    // 1 correct × 2 - 1 wrong × 0.5 = 1.5
    expect(result.score).toBeCloseTo(1.5);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(1);
    expect(result.unattempted).toBe(2);
  });

  it("score never goes below 0", () => {
    const responses: Response[] = [
      { questionId: "q1", optionId: "opt-b" }, // wrong
      { questionId: "q2", optionId: "opt-a" }, // wrong
      { questionId: "q3", optionId: "opt-d" }, // wrong
      { questionId: "q4", optionId: "opt-a" }, // wrong
    ];
    const result = scoreTest(questions, responses);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("tracks topic performance correctly", () => {
    const responses: Response[] = [
      { questionId: "q1", optionId: "opt-a" }, // Arrays - correct
      { questionId: "q2", optionId: "opt-a" }, // Arrays - wrong
      { questionId: "q3", optionId: "opt-b" }, // Graphs - correct
      { questionId: "q4", optionId: null },    // Graphs - unattempted
    ];
    const result = scoreTest(questions, responses);
    expect(result.topicPerformance.Arrays.total).toBe(2);
    expect(result.topicPerformance.Arrays.correct).toBe(1);
    expect(result.topicPerformance.Arrays.incorrect).toBe(1);
    expect(result.topicPerformance.Graphs.total).toBe(2);
    expect(result.topicPerformance.Graphs.correct).toBe(1);
    expect(result.topicPerformance.Graphs.incorrect).toBe(0);
  });

  it("handles all unattempted questions", () => {
    const responses: Response[] = questions.map((q) => ({
      questionId: q.id,
      optionId: null,
    }));
    const result = scoreTest(questions, responses);
    expect(result.score).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.incorrect).toBe(0);
    expect(result.unattempted).toBe(4);
  });
});

/* ------------------------------------------------------------------ */
/* Timer validation                                                    */
/* ------------------------------------------------------------------ */

describe("Mock Test — Timer Validation", () => {
  it("detects expired test attempt", () => {
    const isExpired = (expiresAt: Date) => expiresAt < new Date();

    const pastTime = new Date(Date.now() - 60_000); // 1 minute ago
    const futureTime = new Date(Date.now() + 60_000); // 1 minute from now

    expect(isExpired(pastTime)).toBe(true);
    expect(isExpired(futureTime)).toBe(false);
  });

  it("calculates expiry correctly from duration", () => {
    const durationMinutes = 60;
    const startTime = new Date();
    const expiresAt = new Date(startTime.getTime() + durationMinutes * 60_000);

    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    expect(timeUntilExpiry).toBeGreaterThan(59 * 60_000); // about 1 hour
    expect(timeUntilExpiry).toBeLessThan(61 * 60_000);
  });
});

/* ------------------------------------------------------------------ */
/* Percentage calculation                                              */
/* ------------------------------------------------------------------ */

describe("Mock Test — Percentage Calculation", () => {
  it("calculates percentage correctly", () => {
    const calculatePercentage = (score: number, totalMarks: number) =>
      totalMarks ? Math.max(0, Math.round((score / totalMarks) * 100)) : 0;

    expect(calculatePercentage(80, 100)).toBe(80);
    expect(calculatePercentage(45, 100)).toBe(45);
    expect(calculatePercentage(0, 100)).toBe(0);
    expect(calculatePercentage(100, 100)).toBe(100);
    expect(calculatePercentage(-5, 100)).toBe(0); // negative score = 0%
    expect(calculatePercentage(50, 0)).toBe(0); // zero total marks = 0%
  });
});

