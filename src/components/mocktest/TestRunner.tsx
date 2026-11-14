"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ListChecks,
  RotateCcw,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Modal,
  ProgressBar,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export type TestQuestion = {
  id: string;
  text: string;
  topic: string;
  marks: number;
  options: Array<{ id: string; label: string; text: string; isCorrect?: boolean }>;
  explanation?: string | null;
};

export type TestMeta = {
  id: string;
  title: string;
  subject: string;
  difficulty: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
};

type AttemptState = {
  attemptId: string;
  expiresAt: string | null;
};

type Result = {
  score: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  percentage: number;
  topicPerformance: Record<
    string,
    { total: number; correct: number; incorrect: number }
  >;
  submittedAt: string | null;
  status: string;
};

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export function TestRunner({
  test,
  isLoggedIn,
  previousAttempt,
}: {
  test: TestMeta;
  isLoggedIn: boolean;
  previousAttempt?: {
    id: string;
    score: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    percentage: number;
    submittedAt: Date | string | null;
    topicPerformance: unknown;
  } | null;
}) {
  const router = useRouter();
  const { push } = useToast();

  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(test.durationMinutes * 60);
  const [result, setResult] = useState<Result | null>(null);
  const [review, setReview] = useState(false);
  const [starting, setStarting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef<number | null>(null);

  /* ------------------------------ start ------------------------------ */

  const start = useCallback(async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=/placements/mock-tests/${test.id}`);
      return;
    }
    setStarting(true);
    try {
      const res = await fetch("/api/v1/tests/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        push({ title: "Unable to start test", description: json.message, tone: "error" });
        return;
      }
      const data = json.data;
      setQuestions(data.questions ?? []);
      setAttempt({ attemptId: data.attempt.id, expiresAt: data.attempt.expiresAt });
      const restored: Record<string, string> = {};
      const restoredMarked: Record<string, boolean> = {};
      for (const response of data.responses ?? []) {
        if (response.optionId) restored[response.questionId] = response.optionId;
        if (response.markedForReview) restoredMarked[response.questionId] = true;
      }
      setAnswers(restored);
      setMarked(restoredMarked);
      if (data.attempt.expiresAt) {
        const seconds = Math.max(
          0,
          Math.floor(
            (new Date(data.attempt.expiresAt).getTime() - Date.now()) / 1000,
          ),
        );
        setRemaining(seconds);
      }
      push({ title: "Test started", description: test.title, tone: "success" });
    } finally {
      setStarting(false);
    }
  }, [isLoggedIn, push, router, test.id, test.title]);

  /* ----------------------------- timer ------------------------------ */

  useEffect(() => {
    if (!attempt || result) return;
    const interval = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          void submitAttempt(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, result]);

  /* --------------------------- persistence --------------------------- */

  useEffect(() => {
    if (!attempt) return;
    const question = questions[current];
    if (!question) return;
    setVisited((prev) => ({ ...prev, [question.id]: true }));
  }, [attempt, current, questions]);

  const persist = useCallback(
    (questionId: string, optionId: string | null, markedForReview: boolean) => {
      if (!attempt) return;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        try {
          await fetch(`/api/v1/tests/attempt/${attempt.attemptId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, optionId, markedForReview }),
          });
        } catch {
          /* answers are retried on next change */
        }
      }, 350);
    },
    [attempt],
  );

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  /* ----------------------------- actions ----------------------------- */

  function selectOption(question: TestQuestion, optionId: string) {
    const isMarked = Boolean(marked[question.id]);
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    persist(question.id, optionId, isMarked);
  }

  function clearResponse(question: TestQuestion) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
    persist(question.id, null, Boolean(marked[question.id]));
  }

  function toggleMark(question: TestQuestion) {
    const next = !marked[question.id];
    setMarked((prev) => ({ ...prev, [question.id]: next }));
    persist(question.id, answers[question.id] ?? null, next);
  }

  async function submitAttempt(auto = false) {
    if (!attempt) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/tests/submit/${attempt.attemptId}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        push({ title: "Submission failed", description: json.message, tone: "error" });
        return;
      }
      const data = json.data;
      setResult({
        score: data.attempt.score,
        correctCount: data.attempt.correctCount,
        incorrectCount: data.attempt.incorrectCount,
        unattemptedCount: data.attempt.unattemptedCount,
        percentage: Number(data.attempt.percentage ?? 0),
        topicPerformance: data.topicPerformance ?? {},
        submittedAt: data.attempt.submittedAt,
        status: data.attempt.status,
      });
      push({
        title: auto ? "Time is up — test submitted" : "Test submitted",
        description: `You scored ${data.attempt.score} marks.`,
        tone: auto ? "warning" : "success",
      });
      router.refresh();
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  /* ---------------------------- derived ----------------------------- */

  const stats = useMemo(() => {
    let answered = 0;
    let markedCount = 0;
    let notVisited = 0;
    for (const question of questions) {
      if (answers[question.id]) answered += 1;
      if (marked[question.id]) markedCount += 1;
      if (!visited[question.id]) notVisited += 1;
    }
    return {
      answered,
      marked: markedCount,
      notVisited,
      notAnswered: questions.length - answered,
    };
  }, [answers, marked, visited, questions]);

  const question = questions[current];
  const timeLabel = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(
    remaining % 60,
  ).padStart(2, "0")}`;

  /* ----------------------------- screens ---------------------------- */

  if (!isLoggedIn) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-base font-bold text-ink-900">Login required</h2>
        <p className="mt-1.5 text-sm text-ink-500">
          Sign in to attempt this mock test and save your score.
        </p>
        <Link
          href={`/login?next=/placements/mock-tests/${test.id}`}
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
        >
          Login to start
        </Link>
      </Card>
    );
  }

  if (result) {
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden border-0 bg-navy-900 p-0">
          <div className="relative p-6">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 120% at 15% 20%, rgba(255,90,0,0.35), transparent 60%)",
              }}
              aria-hidden
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-wider text-white/60">
                  {result.status === "AUTO_SUBMITTED" ? "Auto submitted" : "Result"}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-white">
                  You scored {result.score} / {test.totalMarks}
                </h2>
                <p className="mt-1 text-sm text-white/70">
                  {result.percentage}% · {test.title}
                </p>
              </div>
              <span className="grid size-16 place-items-center rounded-2xl bg-brand-500 text-white">
                <Trophy className="size-8" />
              </span>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Correct", value: result.correctCount, icon: CheckCircle2, tone: "text-success-500" },
            { label: "Incorrect", value: result.incorrectCount, icon: XCircle, tone: "text-error-500" },
            { label: "Unattempted", value: result.unattemptedCount, icon: AlertTriangle, tone: "text-warning-500" },
            { label: "Percentage", value: `${result.percentage}%`, icon: ListChecks, tone: "text-brand-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className={cn("size-5", item.tone)} />
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-500">
                      {item.label}
                    </p>
                    <p className="text-xl font-extrabold text-ink-900">{item.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-ink-900">Topic-wise performance</h3>
          <div className="mt-4 space-y-3.5">
            {Object.entries(result.topicPerformance).length === 0 && (
              <p className="text-xs text-ink-500">No topic data available.</p>
            )}
            {Object.entries(result.topicPerformance).map(([topic, data]) => {
              const percent = data.total
                ? Math.round((data.correct / data.total) * 100)
                : 0;
              return (
                <div key={topic}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink-900">{topic}</span>
                    <span className="tabular-nums text-ink-500">
                      {data.correct}/{data.total} correct · {percent}%
                    </span>
                  </div>
                  <ProgressBar
                    value={percent}
                    showLabel={false}
                    tone={percent >= 70 ? "success" : percent >= 40 ? "warning" : "brand"}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setReview(true)}>
            <ListChecks className="size-4" /> Review Answers
          </Button>
          <Link
            href="/placements/mock-tests"
            className="inline-flex h-9.5 items-center rounded-lg border border-line px-4 text-sm font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
          >
            Back to tests
          </Link>
          <Link
            href="/my-tests"
            className="inline-flex h-9.5 items-center rounded-lg border border-line px-4 text-sm font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
          >
            Test history
          </Link>
        </div>

        <Modal
          open={review}
          onClose={() => setReview(false)}
          title="Review answers"
          description={test.title}
          size="lg"
        >
          <div className="space-y-4">
            {questions.map((q, index) => {
              const chosen = answers[q.id];
              const correct = q.options.find((o) => o.isCorrect);
              const chosenOption = q.options.find((o) => o.id === chosen);
              return (
                <div key={q.id} className="rounded-xl border border-line p-4">
                  <p className="text-sm font-semibold text-ink-900">
                    {index + 1}. {q.text}
                  </p>
                  <div className="mt-2 space-y-1">
                    {q.options.map((option) => {
                      const isChosen = option.id === chosen;
                      const isCorrect = option.isCorrect;
                      return (
                        <p
                          key={option.id}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs",
                            isCorrect
                              ? "bg-success-500/10 font-bold text-success-500"
                              : isChosen
                                ? "bg-error-500/10 font-bold text-error-500"
                                : "text-ink-700",
                          )}
                        >
                          <span className="font-bold">{option.label}</span>
                          {option.text}
                          {isCorrect && " — correct"}
                        </p>
                      );
                    })}
                  </div>
                  {!chosen && (
                    <p className="mt-2 text-[0.7rem] font-semibold text-warning-500">
                      Not attempted
                    </p>
                  )}
                  {q.explanation && (
                    <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-[0.72rem] text-ink-700">
                      <span className="font-bold">Explanation:</span> {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
            {chosenNote(questions, answers)}
          </div>
        </Modal>
      </div>
    );
  }

  if (!attempt || !question) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-base font-bold text-ink-900">Ready to start?</h2>
        <p className="mt-1.5 text-sm text-ink-500">
          {test.durationMinutes} minutes · {test.questionCount} questions ·{" "}
          {test.totalMarks} marks. The test auto-submits when the timer ends.
        </p>
        {previousAttempt && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">
            <Trophy className="size-3.5" /> Previous score:{" "}
            {previousAttempt.score} ({Number(previousAttempt.percentage)}%)
          </p>
        )}
        <div className="mt-5 flex justify-center">
          <Button size="lg" loading={starting} onClick={start}>
            <Timer className="size-4" /> Start Test
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      {/* Question panel */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5">
          <div className="flex items-center gap-2">
            <Badge tone="brand">Question {current + 1}</Badge>
            <Badge tone="neutral">{question.topic}</Badge>
            <Badge tone="neutral">{question.marks} marks</Badge>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums",
              remaining < 60
                ? "bg-error-500/10 text-error-500"
                : "bg-navy-900/5 text-ink-900",
            )}
          >
            <Clock className="size-4" /> {timeLabel}
          </span>
        </div>

        <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-900">
          {question.text}
        </p>

        <div className="mt-4 space-y-2">
          {question.options.map((option, index) => {
            const isSelected = answers[question.id] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => selectOption(question, option.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                  isSelected
                    ? "border-brand-500 bg-brand-50"
                    : "border-line bg-white hover:border-brand-300 hover:bg-brand-50/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold",
                    isSelected
                      ? "bg-brand-500 text-white"
                      : "bg-navy-900/5 text-ink-700",
                  )}
                >
                  {option.label ?? OPTION_LABELS[index] ?? index + 1}
                </span>
                <span className="text-sm text-ink-900">{option.text}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={current === 0}
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            >
              <ChevronLeft className="size-3.5" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={current === questions.length - 1}
              onClick={() =>
                setCurrent((c) => Math.min(questions.length - 1, c + 1))
              }
            >
              Next <ChevronRight className="size-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => clearResponse(question)}>
              <RotateCcw className="size-3.5" /> Clear
            </Button>
            <Button
              variant={marked[question.id] ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleMark(question)}
            >
              <Flag className="size-3.5" />
              {marked[question.id] ? "Marked" : "Review"}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setConfirmOpen(true)}
            >
              Submit Test
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation panel */}
      <aside className="space-y-4">
        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink-900">Question navigation</h3>
          <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
            {questions.map((q, index) => {
              const isAnswered = Boolean(answers[q.id]);
              const isMarked = Boolean(marked[q.id]);
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrent(index)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-md border text-[0.7rem] font-bold transition-colors",
                    index === current
                      ? "border-brand-500 bg-brand-500 text-white"
                      : isMarked
                        ? "border-warning-500/40 bg-warning-500/15 text-[#a56a00]"
                        : isAnswered
                          ? "border-success-500/30 bg-success-500/10 text-success-500"
                          : "border-line bg-white text-ink-500 hover:border-brand-300",
                  )}
                  aria-label={`Go to question ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink-900">Status</h3>
          <dl className="mt-3 space-y-2 text-xs">
            {[
              { label: "Answered", value: stats.answered, tone: "text-success-500" },
              { label: "Not answered", value: stats.notAnswered, tone: "text-error-500" },
              { label: "Marked", value: stats.marked, tone: "text-[#a56a00]" },
              { label: "Not visited", value: stats.notVisited, tone: "text-ink-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <dt className="text-ink-500">{item.label}</dt>
                <dd className={cn("font-bold", item.tone)}>{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 border-t border-line pt-3">
            <ProgressBar
              value={(stats.answered / Math.max(1, questions.length)) * 100}
              showLabel={false}
              size="sm"
            />
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-[0.7rem] leading-relaxed text-ink-500">
            Your answers are saved as you move between questions. Submitting ends
            the attempt and reveals the score immediately.
          </p>
        </Card>
      </aside>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => submitAttempt(false)}
        title="Submit test?"
        message={`You have answered ${stats.answered} of ${questions.length} questions. Once submitted you cannot change your answers.`}
        confirmLabel="Submit Test"
        cancelLabel="Keep working"
        destructive={false}
      />
    </div>
  );
}

function chosenNote(questions: TestQuestion[], answers: Record<string, string>) {
  const unattempted = questions.filter((q) => !answers[q.id]).length;
  if (!unattempted) return null;
  return (
    <p className="text-xs font-semibold text-warning-500">
      {unattempted} question{unattempted === 1 ? "" : "s"} left unattempted.
    </p>
  );
}
