import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { RoadmapCard } from "@/components/cards";
import { RoadmapFilters } from "./RoadmapFilters";
import { getRoadmapProgress, getRoadmaps } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Software Developer Career Roadmaps & Learning Paths",
  description:
    "Step-by-step developer roadmaps for engineering students: Frontend, Backend, Full Stack, DevOps, Data Engineering & AI career tracks with structured milestones.",
  alternates: {
    canonical: absoluteUrl("/placements/roadmaps"),
  },
  openGraph: {
    title: "Software Developer Career Roadmaps & Learning Paths | EngineerPrep India",
    description:
      "Role-wise technical learning paths with curated resources, project benchmarks, and interview preparation checklists.",
    url: absoluteUrl("/placements/roadmaps"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Software Developer Career Roadmaps & Learning Paths | EngineerPrep India",
    description:
      "Role-wise technical learning paths with curated resources, project benchmarks, and interview preparation checklists.",
  },
};

const CATEGORIES = ["All", "Web Dev", "Backend", "Full Stack", "DevOps", "Data & AI"];

export default async function RoadmapsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = CATEGORIES.includes(category ?? "") ? (category as string) : "All";
  const user = await getSessionUser();

  const [roadmaps, progress] = await Promise.all([
    getRoadmaps(active),
    user ? getRoadmapProgress(user.id) : Promise.resolve(new Map()),
  ]);

  const withProgress = roadmaps.map((roadmap) => {
    const completed = progress.get(roadmap.id)?.size ?? 0;
    const percent = roadmap.stepCount
      ? Math.round((completed / roadmap.stepCount) * 100)
      : 0;
    return { roadmap, percent };
  });

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: "Developer Roadmaps", url: "/placements/roadmaps" },
        ]}
      />
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "Developer Roadmaps" },
        ]}
        title="Developer Roadmaps"
        subtitle="Step-by-step learning paths to become a job-ready developer."
        actions={<RoadmapFilters options={CATEGORIES} active={active} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {withProgress.map(({ roadmap, percent }) => (
          <RoadmapCard
            key={roadmap.id}
            roadmap={roadmap}
            progress={percent}
            href={`/placements/roadmaps/${roadmap.slug}`}
          />
        ))}
      </div>
    </>
  );
}
