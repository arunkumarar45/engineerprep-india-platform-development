import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { getDsaPatterns, getDsaProblems, getDsaProgress } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Essential DSA Coding Patterns for Technical Interviews",
  description:
    "Master the 24 core Data Structure and Algorithm patterns (Two Pointers, Sliding Window, Fast & Slow Pointers, Monotonic Stack, Backtracking, DP) for software engineer interviews.",
  alternates: {
    canonical: absoluteUrl("/placements/dsa-patterns"),
  },
  openGraph: {
    title: "Essential DSA Coding Patterns for Technical Interviews | EngineerPrep India",
    description:
      "Learn and recognize patterns in LeetCode problems: Two Pointers, Sliding Window, Top K Elements, Binary Search, and Tree BFS/DFS.",
    url: absoluteUrl("/placements/dsa-patterns"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Essential DSA Coding Patterns for Technical Interviews | EngineerPrep India",
    description:
      "Learn and recognize patterns in LeetCode problems: Two Pointers, Sliding Window, Top K Elements, Binary Search, and Tree BFS/DFS.",
  },
};

export default async function DsaPatternsPage() {
  const user = await getSessionUser();
  const [patterns, problems, progress] = await Promise.all([
    getDsaPatterns(),
    getDsaProblems(),
    user ? getDsaProgress(user.id) : Promise.resolve(new Map()),
  ]);

  const counts = new Map<string, { total: number; solved: number }>();
  for (const problem of problems) {
    if (!problem.patternId) continue;
    const bucket = counts.get(problem.patternId) ?? { total: 0, solved: 0 };
    bucket.total += 1;
    if (progress.has(problem.id)) bucket.solved += 1;
    counts.set(problem.patternId, bucket);
  }

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: "DSA Patterns", url: "/placements/dsa-patterns" },
        ]}
      />
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "DSA Patterns" },
        ]}
        title="DSA Patterns"
        subtitle="Master the 24 essential coding patterns asked in top product and tech interviews."
        actions={<Badge tone="brand">{patterns.length} patterns</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {patterns.map((pattern) => {
          const stats = counts.get(pattern.id) ?? { total: 0, solved: 0 };
          const percent = stats.total
            ? Math.round((stats.solved / stats.total) * 100)
            : 0;
          return (
            <Link key={pattern.id} href={`/placements/dsa-patterns/${pattern.slug}`}>
              <Card hover className="h-full p-5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="grid size-11 place-items-center rounded-xl text-white"
                    style={{ background: pattern.tint ?? "#FF5A00" }}
                  >
                    <Sparkles className="size-5" />
                  </span>
                  <Badge tone="neutral">{stats.total} problems</Badge>
                </div>
                <h2 className="mt-3.5 text-sm font-extrabold text-ink-900">
                  {pattern.name}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                  {pattern.summary}
                </p>
                <div className="mt-3.5">
                  <div className="mb-1 flex items-center justify-between text-[0.68rem] font-semibold text-ink-500">
                    <span>Completed</span>
                    <span className="tabular-nums text-ink-900">
                      {stats.solved} / {stats.total}
                    </span>
                  </div>
                  <ProgressBar value={percent} showLabel={false} />
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600">
                  Open pattern <ArrowRight className="size-3.5" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
