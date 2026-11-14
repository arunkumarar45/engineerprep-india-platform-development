import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Learning Progress",
  robots: { index: false, follow: false },
};
import { Code2, Flame, Route, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, ProgressBar } from "@/components/ui";
import { StatCard } from "@/components/cards";
import { getSessionUser } from "@/lib/auth";
import {
  getAttempts,
  getDsaPatterns,
  getDsaProgress,
  getDsaProblems,
  getRoadmapProgress,
  getRoadmaps,
  getStreak,
} from "@/lib/queries";

export default async function MyProgressPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/my-progress");

  const [progress, problems, patterns, roadmaps, roadmapProgress, attempts, streak] =
    await Promise.all([
      getDsaProgress(user.id),
      getDsaProblems(),
      getDsaPatterns(),
      getRoadmaps(),
      getRoadmapProgress(user.id),
      getAttempts(user.id),
      getStreak(user.id),
    ]);

  const patternStats = patterns.map((pattern) => {
    const list = problems.filter((p) => p.patternId === pattern.id);
    const solved = list.filter((p) => progress.has(p.id)).length;
    return {
      pattern,
      total: list.length,
      solved,
      percent: list.length ? Math.round((solved / list.length) * 100) : 0,
    };
  });

  const roadmapStats = roadmaps.map((roadmap) => {
    const completed = roadmapProgress.get(roadmap.id)?.size ?? 0;
    return {
      roadmap,
      completed,
      percent: roadmap.stepCount
        ? Math.round((completed / roadmap.stepCount) * 100)
        : 0,
    };
  });

  const submitted = attempts.filter((a) => a.status !== "IN_PROGRESS");
  const totalPoints = 0;

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Student Dashboard", href: "/dashboard" },
          { label: "My Progress" },
        ]}
        title="My Progress"
        subtitle="Every DSA pattern, roadmap and test attempt in one place."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Problems solved"
          value={progress.size}
          hint={`of ${problems.length} seeded problems`}
          icon={<Code2 className="size-5" />}
        />
        <StatCard
          label="Roadmap topics"
          value={[...roadmapProgress.values()].reduce(
            (sum, set) => sum + set.size,
            0,
          )}
          hint={`across ${roadmaps.length} roadmaps`}
          icon={<Route className="size-5" />}
          tone="info"
        />
        <StatCard
          label="Tests attempted"
          value={submitted.length}
          hint="mock tests submitted"
          icon={<Trophy className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Current streak"
          value={`${streak?.currentStreak ?? 0} days`}
          hint={`Longest ${streak?.longestStreak ?? 0} days`}
          icon={<Flame className="size-5" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-900">DSA patterns</h2>
          <div className="mt-4 space-y-3.5">
            {patternStats.map((item) => (
              <div key={item.pattern.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Link
                    href={`/placements/dsa-patterns/${item.pattern.slug}`}
                    className="truncate text-xs font-bold text-ink-900 hover:text-brand-600"
                  >
                    {item.pattern.name}
                  </Link>
                  <span className="shrink-0 text-[0.68rem] tabular-nums text-ink-500">
                    {item.solved}/{item.total} · {item.percent}%
                  </span>
                </div>
                <ProgressBar value={item.percent} showLabel={false} size="sm" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink-900">Roadmaps</h2>
          <div className="mt-4 space-y-3.5">
            {roadmapStats.map((item) => (
              <div key={item.roadmap.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Link
                    href={`/placements/roadmaps/${item.roadmap.slug}`}
                    className="truncate text-xs font-bold text-ink-900 hover:text-brand-600"
                  >
                    {item.roadmap.title}
                  </Link>
                  <span className="shrink-0 text-[0.68rem] tabular-nums text-ink-500">
                    {item.completed} topics · {item.percent}%
                  </span>
                </div>
                <ProgressBar value={item.percent} showLabel={false} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="text-sm font-bold text-ink-900">Recent test attempts</h2>
        {submitted.length === 0 ? (
          <p className="mt-3 text-xs text-ink-500">
            No mock tests attempted yet.{" "}
            <Link
              href="/placements/mock-tests"
              className="font-bold text-brand-600 hover:underline"
            >
              Attempt one now →
            </Link>
          </p>
        ) : (
          <div className="mt-3 divide-y divide-line">
            {submitted.slice(0, 6).map((attempt) => (
              <div
                key={attempt.id}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-500">
                  <Trophy className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink-900">
                    {attempt.testTitle}
                  </p>
                  <p className="text-[0.68rem] text-ink-500">
                    {attempt.correctCount} correct · {attempt.incorrectCount}{" "}
                    incorrect · {attempt.unattemptedCount} skipped
                  </p>
                </div>
                <span className="text-xs font-bold text-ink-900">
                  {Number(attempt.percentage ?? 0)}%
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-[0.7rem] text-ink-500">
          Total learning points recorded: {totalPoints}
        </p>
      </Card>
    </>
  );
}
