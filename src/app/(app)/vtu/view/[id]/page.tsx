import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getResourceById, getResources } from "@/lib/queries";
import { VtuDocumentViewer } from "@/components/vtu/VtuDocumentViewer";
import { BreadcrumbsJsonLd, LearningResourceJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!id) return {};

  const doc = await getResourceById(id);
  if (!doc) return {};

  // Protect pending or unpublished submissions from indexing
  if (doc.status !== "PUBLISHED") {
    return {
      title: `${doc.title} | EngineerPrep India`,
      robots: { index: false, follow: false },
    };
  }

  const typeLabel =
    doc.resourceType === "NOTES"
      ? "Notes"
      : doc.resourceType === "QUESTION_PAPER"
      ? "Question Paper"
      : doc.resourceType === "SYLLABUS"
      ? "Syllabus"
      : doc.resourceType === "LAB_MANUAL"
      ? "Lab Manual"
      : "Study Material";

  const cleanDescription =
    doc.description?.trim() ||
    `Download and view verified VTU ${typeLabel}: ${doc.title}. Includes PDF preview and syllabus details on EngineerPrep India.`;

  const canonicalUrl = absoluteUrl(`/vtu/view/${id}`);

  return {
    title: `${doc.title} | VTU ${typeLabel}`,
    description: cleanDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${doc.title} | VTU ${typeLabel} | EngineerPrep India`,
      description: cleanDescription,
      url: canonicalUrl,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${doc.title} | VTU ${typeLabel}`,
      description: cleanDescription,
    },
  };
}

export default async function VtuViewPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const doc = await getResourceById(id);
  if (!doc) notFound();

  // Fetch other related materials for the same subject
  let relatedDocs: Array<{
    id: string;
    title: string;
    resourceType: string;
    moduleNumber: number | null;
  }> = [];

  if (doc.subjectId) {
    const allForSubject = await getResources({ subjectId: doc.subjectId });
    relatedDocs = allForSubject.map((r) => ({
      id: r.id,
      title: r.title,
      resourceType: r.resourceType,
      moduleNumber: r.moduleNumber,
    }));
  }

  return (
    <div className="min-h-screen bg-surface">
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "VTU Notes & Resources", url: "/vtu" },
          {
            name:
              doc.resourceType === "NOTES"
                ? "Subject Notes"
                : doc.resourceType === "QUESTION_PAPER"
                ? "Question Papers"
                : doc.resourceType === "SYLLABUS"
                ? "Syllabus"
                : "Resources",
            url:
              doc.resourceType === "NOTES"
                ? "/vtu/notes"
                : doc.resourceType === "QUESTION_PAPER"
                ? "/vtu/question-papers"
                : doc.resourceType === "SYLLABUS"
                ? "/vtu/syllabus"
                : "/vtu/resources",
          },
          { name: doc.title, url: `/vtu/view/${doc.id}` },
        ]}
      />
      <LearningResourceJsonLd
        name={doc.title}
        description={
          doc.description ||
          `VTU ${doc.resourceType} for ${doc.subjectCode || "Engineering"}`
        }
        url={`/vtu/view/${doc.id}`}
        learningResourceType={
          doc.resourceType === "NOTES"
            ? "Lecture Notes"
            : doc.resourceType === "QUESTION_PAPER"
            ? "Examination Question Paper"
            : doc.resourceType === "SYLLABUS"
            ? "Curriculum Scheme"
            : "Study Material"
        }
      />
      <VtuDocumentViewer doc={doc} relatedDocs={relatedDocs} />
    </div>
  );
}

