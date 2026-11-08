import Link from "next/link";
import { Clock, ListChecks, PlayCircle, Timer, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, Card } from "@/components/ui";
import { difficultyTone } from "@/lib/utils";
import { getAttempts, getMockTests } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";

export default async function MockTestsPage() {
  const user = await getSessionUser();
  const tests = await getMockTests();

  const counts = new Map<string, number>();
  for (const test of tests) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions)
      .where(sql`${questions.testId} = ${test.id}`);
    counts.set(test.id, row?.count ?? 0);
  }

  const attempts = user ? await getAttempts(user.id) : [];
  const bestByTest = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.status === "IN_PROGRESS") continue;
    const best = bestByTest.get(attempt.testId) ?? 0;
    bestByTest.set(attempt.testId, Math.max(best, Number(attempt.percentage ?? 0)));
  }

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "Mock Tests" },
        ]}
        title="Mock Tests"
        subtitle="Timed aptitude, technical and company tests with instant scoring."
        actions={<Badge tone="brand">{tests.length} tests available</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tests.map((test) => {
          const count = counts.get(test.id) ?? 0;
          const best = bestByTest.get(test.id);
          return (
            <Card key={test.id} hover className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-500">
                  <ListChecks className="size-5" />
                </span>
                <Badge tone={difficultyTone(test.difficulty)}>
                  {test.difficulty}
                </Badge>
              </div>
              <h2 className="mt-3.5 text-sm font-extrabold leading-snug text-ink-900">
                {test.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                {test.description}
              </p>
              <dl className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface px-2 py-2">
                  <dt className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                    Subject
                  </dt>
                  <dd className="text-[0.72rem] font-bold text-ink-900">
                    {test.subject}
                  </dd>
                </div>
                <div className="rounded-lg bg-surface px-2 py-2">
                  <dt className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                    Duration
                  </dt>
                  <dd className="text-[0.72rem] font-bold text-ink-900">
                    {test.durationMinutes} min
                  </dd>
                </div>
                <div className="rounded-lg bg-surface px-2 py-2">
                  <dt className="text-[0.62rem] uppercase tracking-wider text-ink-500">
                    Marks
                  </dt>
                  <dd className="text-[0.72rem] font-bold text-ink-900">
                    {test.totalMarks}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] text-ink-500">
                <Clock className="size-3" /> {count} questions
                {best !== undefined && (
                  <>
                    {" · "}
                    <Trophy className="size-3 text-brand-500" /> best {best}%
                  </>
                )}
              </p>
              <Link
                href={`/placements/mock-tests/${test.id}`}
                className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-500 text-xs font-bold text-white transition-colors hover:bg-brand-600"
              >
                <PlayCircle className="size-3.5" />{" "}
                {best !== undefined ? "Re-attempt Test" : "Start Test"}
              </Link>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <Timer className="size-4 text-brand-500" /> How scoring works
        </h2>
        <ul className="mt-2.5 grid gap-2 text-xs text-ink-700 sm:grid-cols-2">
          <li>• Each question carries 2 marks with 0.5 negative marking.</li>
          <li>• Scoring happens on the server after submission.</li>
          <li>• Correct answers are never exposed before you submit.</li>
          <li>• The test auto-submits when the timer reaches zero.</li>
        </ul>
      </Card>
    </>
  );
}
