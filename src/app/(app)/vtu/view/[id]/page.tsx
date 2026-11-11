import { notFound } from "next/navigation";
import { getResourceById, getResources } from "@/lib/queries";
import { VtuDocumentViewer } from "@/components/vtu/VtuDocumentViewer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
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
      <VtuDocumentViewer doc={doc} relatedDocs={relatedDocs} />
    </div>
  );
}

