import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { Badge, ProgressBar } from "@/components/ui";
import { PatternDetail } from "@/components/placements/PatternDetail";
import { getDsaPattern, getDsaProblems, getProblemBySlug } from "@/lib/queries";
import { getDsaProgress } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { BreadcrumbsJsonLd, LearningResourceJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

interface PageProps {
  params: Promise<{ patternId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { patternId } = await params;
  const data = await getDsaPattern(patternId);
  if (!data?.pattern) return {};

  const { pattern, problems } = data;
  const title = `${pattern.title} Pattern – LeetCode Problem Guide`;
  const description =
    pattern.description?.trim() ||
    `Master the ${pattern.title} coding pattern with ${problems.length} curated practice questions, algorithmic templates, and interview solutions.`;

  const canonicalUrl = absoluteUrl(`/placements/dsa-patterns/${pattern.slug || pattern.id}`);

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
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | EngineerPrep India`,
      description,
    },
  };
}

export default async function DsaPatternDetailPage({
  params,
}: PageProps) {
  const { patternId } = await params;
  const data = await getDsaPattern(patternId);
  if (!data) notFound();

  const user = await getSessionUser();
  const [progress, related] = await Promise.all([
    user ? getDsaProgress(user.id) : Promise.resolve(new Map()),
    getDsaProblems(),
  ]);

  const { pattern, problems } = data;

  // Solutions live in a dedicated table; attach them per problem
  const detailed = await Promise.all(
    problems.map(async (problem) => {
      const full = await getProblemBySlug(problem.slug);
      return {
        ...problem,
        solutions:
          full?.solutions.map((s) => ({
            language: s.language,
            code: s.code,
            complexity: s.complexity,
          })) ?? [],
      };
    }),
  );
  void related;

  const solvedCount = detailed.filter((p) => progress.has(p.id)).length;

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: "DSA Patterns", url: "/placements/dsa-patterns" },
          { name: pattern.name || pattern.title, url: `/placements/dsa-patterns/${pattern.slug || pattern.id}` },
        ]}
      />
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "DSA Patterns", href: "/placements/dsa-patterns" },
          { label: pattern.name },
        ]}
        title={pattern.name}
        subtitle={pattern.summary}
        actions={
          <div className="flex items-center gap-3">
            <div className="w-36">
              <div className="mb-1 flex items-center justify-between text-[0.68rem] font-semibold text-ink-500">
                <span>Completed</span>
                <span className="tabular-nums text-ink-900">
                  {solvedCount} / {problems.length}
                </span>
              </div>
              <ProgressBar
                value={(solvedCount / Math.max(1, problems.length)) * 100}
                showLabel={false}
              />
            </div>
            <Badge tone="brand">{problems.length} problems</Badge>
          </div>
        }
      />

      <PatternDetail
        pattern={pattern}
        problems={detailed}
        solvedIds={[...progress.keys()]}
        isLoggedIn={Boolean(user)}
      />
    </>
  );
}
