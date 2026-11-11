import { PageHeader } from "@/components/layout";
import {
  getBranches,
  getSchemes,
  getSemesters,
  getSubjects,
} from "@/lib/queries";
import { VtuUploadPageClient } from "./VtuUploadClient";

export default async function VtuUploadPage() {
  const [branches, semesters, schemes, subjects] = await Promise.all([
    getBranches(),
    getSemesters(),
    getSchemes(),
    getSubjects(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: "VTU Notes & Resources", href: "/vtu" },
          { label: "Upload Resource" },
        ]}
        title="Upload VTU Study Resource"
        subtitle="Contribute subject notes, previous year question papers, syllabus copies or lab manuals to help your fellow engineering students."
      />

      <VtuUploadPageClient
        meta={{ branches, semesters, schemes, subjects }}
      />
    </div>
  );
}

