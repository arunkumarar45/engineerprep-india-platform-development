import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Mock Tests",
  robots: { index: false, follow: false },
};
import { ListChecks, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui";
import { StatCard } from "@/components/cards";
import { getAttempts } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export default async function MyTestsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/my-tests");

  const attempts = await getAttempts(user.id);
  const submitted = attempts.filter((a) => a.status !== "IN_PROGRESS");
  const best = submitted.reduce(
    (max, a) => Math.max(max, Number(a.percentage ?? 0)),
    0,
  );
  const average = submitted.length
    ? Math.round(
        submitted.reduce((sum, a) => sum + Number(a.percentage ?? 0), 0) /
          submitted.length,
      )
    : 0;

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Student Dashboard", href: "/dashboard" },
          { label: "Test History" },
        ]}
        title="Test History"
        subtitle="Every mock test attempt with scores and topic analysis."
        actions={
          <Link
            href="/placements/mock-tests"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
          >
            <ListChecks className="size-4" /> New test
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tests completed" value={submitted.length} icon={<ListChecks className="size-5" />} />
        <StatCard label="Best score" value={`${best}%`} icon={<Trophy className="size-5" />} tone="success" />
        <StatCard label="Average score" value={`${average}%`} icon={<Trophy className="size-5" />} tone="info" />
      </div>

      {submitted.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-6" />}
          title="No test attempts yet"
          message="Attempt a mock test to build your history and track improvement."
          action={
            <Link
              href="/placements/mock-tests"
              className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-600"
            >
              Browse mock tests
            </Link>
          }
        />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-line">
            {submitted.map((attempt) => {
              const percent = Number(attempt.percentage ?? 0);
              const topics =
                attempt.topicPerformance &&
                typeof attempt.topicPerformance === "object"
                  ? Object.entries(
                      attempt.topicPerformance as Record<
                        string,
                        { total: number; correct: number }
                      >,
                    )
                  : [];
              return (
                <div key={attempt.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink-900">
                        {attempt.testTitle}
                      </p>
                      <p className="text-[0.68rem] text-ink-500">
                        {attempt.subject} · {formatDateTime(attempt.submittedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={percent >= 70 ? "success" : percent >= 40 ? "warning" : "error"}>
                        {percent}%
                      </Badge>
                      <Link
                        href={`/placements/mock-tests/${attempt.testId}`}
                        className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-xs font-bold text-ink-900 hover:border-brand-300 hover:text-brand-600"
                      >
                        Re-attempt
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                        Score
                      </p>
                      <p className="text-sm font-bold text-ink-900">
                        {attempt.score} / {attempt.totalMarks ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                        Correct
                      </p>
                      <p className="text-sm font-bold text-success-500">
                        {attempt.correctCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                        Incorrect
                      </p>
                      <p className="text-sm font-bold text-error-500">
                        {attempt.incorrectCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                        Skipped
                      </p>
                      <p className="text-sm font-bold text-ink-500">
                        {attempt.unattemptedCount}
                      </p>
                    </div>
                  </div>
                  {topics.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {topics.map(([topic, data]) => (
                        <div key={topic}>
                          <div className="mb-1 flex justify-between text-[0.65rem]">
                            <span className="font-semibold text-ink-700">
                              {topic}
                            </span>
                            <span className="tabular-nums text-ink-500">
                              {data.correct}/{data.total}
                            </span>
                          </div>
                          <ProgressBar
                            value={
                              data.total
                                ? (data.correct / data.total) * 100
                                : 0
                            }
                            showLabel={false}
                            size="sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
