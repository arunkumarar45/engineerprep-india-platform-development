import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { difficultyTone } from "@/lib/utils";
import { ProblemTracker } from "@/components/placements/ProblemTracker";
import { getDsaProgress, getDsaSheet, getDsaProblems } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { BreadcrumbsJsonLd, LearningResourceJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

interface PageProps {
  params: Promise<{ sheetId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sheetId } = await params;
  const sheet = await getDsaSheet(sheetId);
  if (!sheet) return {};

  const title = `${sheet.title} – Practice Coding Problems`;
  const description =
    sheet.description?.trim() ||
    `Solve curated algorithmic coding problems from ${sheet.title}. Includes topic breakdown, LeetCode problem links, and progress tracking on EngineerPrep India.`;

  const canonicalUrl = absoluteUrl(`/placements/dsa-sheets/${sheet.slug || sheet.id}`);

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

export default async function DsaSheetDetailPage({
  params,
}: PageProps) {
  const { sheetId } = await params;
  const sheet = await getDsaSheet(sheetId);
  if (!sheet) notFound();

  const user = await getSessionUser();
  const [problems, progress] = await Promise.all([
    getDsaProblems({ sheetId: sheet.id }),
    user ? getDsaProgress(user.id) : Promise.resolve(new Map()),
  ]);

  const solved = problems.filter((p) => progress.has(p.id)).length;
  const percent = problems.length
    ? Math.round((solved / problems.length) * 100)
    : 0;

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: "DSA Sheets", url: "/placements/dsa-sheets" },
          { name: sheet.title, url: `/placements/dsa-sheets/${sheet.slug || sheet.id}` },
        ]}
      />
      <LearningResourceJsonLd
        name={sheet.title}
        description={sheet.description || `Complete ${sheet.title} coding problem set`}
        url={`/placements/dsa-sheets/${sheet.slug || sheet.id}`}
        learningResourceType="Algorithmic Problem Sheet"
      />
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "DSA Sheets", href: "/placements/dsa-sheets" },
          { label: sheet.title },
        ]}
        title={sheet.title}
        subtitle={sheet.description ?? "Curated problem sheet"}
        actions={<Badge tone={difficultyTone(sheet.difficulty)}>{sheet.difficulty}</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Problems</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                {problems.length} problems in this sheet · {solved} solved
              </p>
            </div>
            <Badge tone="brand">{percent}% complete</Badge>
          </div>
          {problems.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-500">
              No problems have been added to this sheet yet.
            </p>
          ) : (
            <ProblemTracker
              problems={problems.map((p) => ({
                id: p.id,
                title: p.title,
                difficulty: p.difficulty,
                slug: p.slug,
                patternName: p.patternName,
                practiceUrl: p.practiceUrl,
                platform: p.platform,
                topic: p.topic,
                subtopic: p.subtopic,
                videoUrl: p.videoUrl,
                statement: p.statement,
              }))}
              solvedIds={[...progress.keys()]}
              isLoggedIn={Boolean(user)}
              basePath="/placements/dsa-sheets"
            />
          )}
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-ink-900">Your progress</h2>
            <div className="mt-3">
              <ProgressBar value={percent} />
            </div>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-ink-500">Solved</dt>
                <dd className="font-bold text-ink-900">{solved}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Remaining</dt>
                <dd className="font-bold text-ink-900">
                  {problems.length - solved}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Author</dt>
                <dd className="font-bold text-ink-900">{sheet.author ?? "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-ink-900">How to use this sheet</h2>
            <ul className="mt-3 space-y-2 text-xs text-ink-700">
              <li>1. Mark a problem solved using the circle icon.</li>
              <li>2. Your progress is saved against your account.</li>
              <li>3. Resume exactly where you left off after a refresh.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
