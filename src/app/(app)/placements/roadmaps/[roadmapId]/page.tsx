import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui";
import { difficultyTone } from "@/lib/utils";
import { RoadmapDetail } from "@/components/placements/RoadmapDetail";
import { getRoadmap, getRoadmapProgress } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ roadmapId: string }>;
}) {
  const { roadmapId } = await params;
  const data = await getRoadmap(roadmapId);
  if (!data) notFound();

  const user = await getSessionUser();
  const progress = user ? await getRoadmapProgress(user.id) : new Map();
  const completedIds = [...(progress.get(data.roadmap.id) ?? [])];

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Placement Guides", href: "/placements" },
          { label: "Developer Roadmaps", href: "/placements/roadmaps" },
          { label: data.roadmap.title },
        ]}
        title={data.roadmap.title}
        subtitle={data.roadmap.description}
        actions={
          <Badge tone={difficultyTone(data.roadmap.difficulty)}>
            {data.roadmap.difficulty}
          </Badge>
        }
      />

      <RoadmapDetail
        roadmap={data.roadmap}
        stages={data.stages.map((stage) => ({
          id: stage.id,
          title: stage.title,
          description: stage.description,
          orderIndex: stage.orderIndex,
        }))}
        topics={data.topics.map((topic) => ({
          id: topic.id,
          title: topic.title,
          resourceUrl: topic.resourceUrl,
          resourceLabel: topic.resourceLabel,
          estimatedMinutes: topic.estimatedMinutes,
          orderIndex: topic.orderIndex,
          stageId: topic.stageId,
        }))}
        completedIds={completedIds}
        isLoggedIn={Boolean(user)}
      />
    </>
  );
}
