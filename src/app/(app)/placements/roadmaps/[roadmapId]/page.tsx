import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { Badge } from "@/components/ui";
import { difficultyTone } from "@/lib/utils";
import { RoadmapDetail } from "@/components/placements/RoadmapDetail";
import { getRoadmap, getRoadmapProgress } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { BreadcrumbsJsonLd, LearningResourceJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

interface PageProps {
  params: Promise<{ roadmapId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { roadmapId } = await params;
  const data = await getRoadmap(roadmapId);
  if (!data?.roadmap) return {};

  const title = `${data.roadmap.title} Roadmap – Learning Path & Guide`;
  const description =
    data.roadmap.description?.trim() ||
    `Step-by-step ${data.roadmap.title} developer roadmap with milestone tracking, essential skills, and interview guidelines.`;

  const canonicalUrl = absoluteUrl(`/placements/roadmaps/${data.roadmap.slug}`);

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

export default async function RoadmapDetailPage({
  params,
}: PageProps) {
  const { roadmapId } = await params;
  const data = await getRoadmap(roadmapId);
  if (!data) notFound();

  const user = await getSessionUser();
  const progress = user ? await getRoadmapProgress(user.id) : new Map();
  const completedIds = [...(progress.get(data.roadmap.id) ?? [])];

  return (
    <>
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Placement Guides", url: "/placements" },
          { name: "Developer Roadmaps", url: "/placements/roadmaps" },
          { name: data.roadmap.title, url: `/placements/roadmaps/${data.roadmap.slug}` },
        ]}
      />
      <LearningResourceJsonLd
        name={data.roadmap.title}
        description={data.roadmap.description || `${data.roadmap.title} learning roadmap`}
        url={`/placements/roadmaps/${data.roadmap.slug}`}
        learningResourceType="Developer Roadmap"
      />
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
