import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import {
  getBranches,
  getSchemes,
  getSemesters,
  getSubjects,
} from "@/lib/queries";
import { BreadcrumbsJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-config";
import { VtuUploadPageClient } from "./VtuUploadClient";

export const metadata: Metadata = {
  title: "Contribute & Upload Study Materials | VTU Resource Library",
  description:
    "Submit authentic VTU notes, question papers, and syllabus copies for verification and inclusion in the EngineerPrep India student library.",
  alternates: {
    canonical: absoluteUrl("/vtu/upload"),
  },
  openGraph: {
    title: "Contribute & Upload Study Materials | EngineerPrep India",
    description:
      "Share your verified VTU engineering study materials and notes with fellow students.",
    url: absoluteUrl("/vtu/upload"),
    type: "website",
  },
};

export default async function VtuUploadPage() {
  const [branches, semesters, schemes, subjects] = await Promise.all([
    getBranches(),
    getSemesters(),
    getSchemes(),
    getSubjects(),
  ]);

  return (
    <div className="space-y-6">
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "VTU Notes & Resources", url: "/vtu" },
          { name: "Upload Resource", url: "/vtu/upload" },
        ]}
      />
      <PageHeader
        breadcrumb={[
          { label: "VTU Notes & Resources", href: "/vtu" },
          { label: "Upload Resource" },
        ]}
        title="Upload VTU Study Resource"
        subtitle="Contribute subject notes, previous year question papers, or syllabus copies to help your fellow engineering students."
      />

      <VtuUploadPageClient
        meta={{ branches, semesters, schemes, subjects }}
      />
    </div>
  );
}

