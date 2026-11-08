import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui";
import { TestRunner } from "@/components/mocktest/TestRunner";
import { getAttempts, getMockTest } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

export default async function MockTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const data = await getMockTest(testId);
  if (!data) notFound();

  const user = await getSessionUser();
  const attempts = user ? await getAttempts(user.id) : [];
  const previous =
    attempts.find((a) => a.testId === data.test.id && a.status !== "IN_PROGRESS") ??
    null;

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "Mock Tests", href: "/placements/mock-tests" },
          { label: data.test.title },
        ]}
        title={data.test.title}
        subtitle={data.test.description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{data.test.subject}</Badge>
            <Badge tone="neutral">{data.test.durationMinutes} minutes</Badge>
            <Badge tone="neutral">{data.questions.length} questions</Badge>
            <Badge tone="neutral">{data.test.totalMarks} marks</Badge>
          </div>
        }
      />

      <TestRunner
        test={{
          id: data.test.id,
          title: data.test.title,
          subject: data.test.subject,
          difficulty: data.test.difficulty,
          durationMinutes: data.test.durationMinutes,
          totalMarks: data.test.totalMarks,
          questionCount: data.questions.length,
        }}
        isLoggedIn={Boolean(user)}
        previousAttempt={
          previous
            ? {
                id: previous.id,
                score: previous.score,
                correctCount: previous.correctCount,
                incorrectCount: previous.incorrectCount,
                unattemptedCount: previous.unattemptedCount,
                percentage: Number(previous.percentage ?? 0),
                submittedAt: previous.submittedAt,
                topicPerformance: previous.topicPerformance,
              }
            : null
        }
      />
    </>
  );
}
