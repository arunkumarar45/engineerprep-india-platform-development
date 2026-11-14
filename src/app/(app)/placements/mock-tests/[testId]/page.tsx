import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui";
import { TestRunner } from "@/components/mocktest/TestRunner";
import { getAttempts, getMockTest } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

interface PageProps {
  params: Promise<{ testId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { testId } = await params;
  const data = await getMockTest(testId);
  if (!data?.test) return {};

  const title = `${data.test.title} – Placement Mock Test`;
  const description =
    data.test.description?.trim() ||
    `Attempt the ${data.test.title} (${data.test.durationMinutes} mins, ${data.test.totalMarks} marks) on EngineerPrep India with real-time scoring.`;

  const canonicalUrl = absoluteUrl(`/placements/mock-tests/${data.test.id}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | EngineerPrep India`,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | EngineerPrep India`,
      description,
    },
  };
}

export default async function MockTestPage({
  params,
}: PageProps) {
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
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: "Mock Tests", url: "/placements/mock-tests" },
          { name: data.test.title, url: `/placements/mock-tests/${data.test.id}` },
        ]}
      />
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
