import { PageHeader } from "@/components/layout";
import { RoadmapCard } from "@/components/cards";
import { RoadmapFilters } from "./RoadmapFilters";
import { getRoadmapProgress, getRoadmaps } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

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
