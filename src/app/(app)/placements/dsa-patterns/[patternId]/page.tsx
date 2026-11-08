import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { Badge, ProgressBar } from "@/components/ui";
import { PatternDetail } from "@/components/placements/PatternDetail";
import { getDsaPattern, getDsaProblems, getProblemBySlug } from "@/lib/queries";
import { getDsaProgress } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

export default async function DsaPatternDetailPage({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
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
